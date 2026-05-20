import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FadeIn } from '@/components/ui/fade-in'
import { ProfileEditCard } from './profile-edit-card'
import { RecentSessionsList } from './recent-sessions-list'
import { FillerBarChart, WpmLineChart, CategoryChart } from './progress-charts'
import { Lock } from 'lucide-react'

const TIER_LABELS: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }

const TIER_SESSION_LIMITS: Record<string, number> = { free: 2, student: 12, pro: 30 }

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const INNER_CARD = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '0.75rem',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isPro = profile.tier === 'pro'
  const isStudent = profile.tier === 'student' || isPro

  // ── History window ──────────────────────────────────────────────────────
  // Free: 7 days | Student: 3 months | Pro: unlimited
  const getWindowCutoff = (tier: string) => {
    if (tier === 'free') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    if (tier === 'student') return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    return null // Pro: unlimited
  }
  const windowCutoff = getWindowCutoff(profile.tier)

  let sessionsQuery = supabase
    .from('sessions').select('*').eq('user_id', user.id).eq('status', 'complete')
    .order('completed_at', { ascending: false })

  if (windowCutoff) {
    sessionsQuery = sessionsQuery.gte('created_at', windowCutoff)
  }

  const { data: recentSessions } = await sessionsQuery.limit(20)

  // ── Chart data (Student+ only) ──────────────────────────────────────────
  type SessionStat = { date: string; fillers: number; wpm: number | null }
  type CategoryStat = { category: string; avgFillers: number; sessions: number }

  let sessionStats: SessionStat[] = []
  let categoryStats: CategoryStat[] = []

  if (isStudent) {
    // Fetch all completed sessions within window for charts (up to 30)
    let chartSessionsQuery = supabase
      .from('sessions').select('id, created_at').eq('user_id', user.id).eq('status', 'complete')
      .order('created_at', { ascending: true })

    if (windowCutoff) {
      chartSessionsQuery = chartSessionsQuery.gte('created_at', windowCutoff)
    }

    const { data: chartSessions } = await chartSessionsQuery.limit(30)
    const sessionIds = (chartSessions ?? []).map((s) => s.id)

    if (sessionIds.length > 0) {
      // Fetch answers + questions for those sessions in parallel
      const [{ data: answers }, { data: questions }] = await Promise.all([
        supabase.from('answers').select('session_id, filler_count, wpm, question_id')
          .in('session_id', sessionIds).eq('transcription_failed', false),
        supabase.from('questions').select('id, category_name'),
      ])

      const questionMap = Object.fromEntries((questions ?? []).map((q) => [q.id, q.category_name]))

      // Per-session stats
      const statsBySession: Record<string, { fillers: number; wpms: number[]; date: string }> = {}
      for (const s of chartSessions ?? []) {
        const d = new Date(s.created_at)
        statsBySession[s.id] = {
          date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          fillers: 0,
          wpms: [],
        }
      }
      for (const a of answers ?? []) {
        if (!statsBySession[a.session_id]) continue
        statsBySession[a.session_id].fillers += a.filler_count ?? 0
        if (a.wpm !== null) statsBySession[a.session_id].wpms.push(a.wpm)
      }

      sessionStats = (chartSessions ?? []).map((s) => {
        const st = statsBySession[s.id]
        const avgWpm = st.wpms.length > 0
          ? Math.round(st.wpms.reduce((a, b) => a + b, 0) / st.wpms.length)
          : null
        return { date: st.date, fillers: st.fillers, wpm: avgWpm }
      })

      // Per-category stats
      const catMap: Record<string, { total: number; count: number }> = {}
      for (const a of answers ?? []) {
        const cat = questionMap[a.question_id] ?? 'Unknown'
        if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 }
        catMap[cat].total += a.filler_count ?? 0
        catMap[cat].count += 1
      }
      categoryStats = Object.entries(catMap).map(([category, { total, count }]) => ({
        category,
        avgFillers: count > 0 ? total / count : 0,
        sessions: count,
      }))
    }
  }

  const sessionsLimit = TIER_SESSION_LIMITS[profile.tier] ?? 2
  const sessionsLeft = sessionsLimit - profile.sessions_used_this_month
  const exhausted = sessionsLeft <= 0
  const pct = Math.min((profile.sessions_used_this_month / sessionsLimit) * 100, 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'rgba(28,10,0,0.75)' }}>
            {TIER_LABELS[profile.tier] ?? profile.tier} plan
          </p>
        </div>
      </FadeIn>

      {/* Session quota + info */}
      <FadeIn>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 p-6" style={CARD_STYLE}>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#F9C125]">Sessions this month</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{profile.sessions_used_this_month}</span>
              <span className="mb-1 text-xl text-white/60">/ {sessionsLimit}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: 'rgba(249,193,37,0.15)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: '#F9C125' }}
              />
            </div>
            <p className="mt-2 text-sm text-[#F9C125]/70">
              {exhausted ? 'No sessions left this month.' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} remaining`}
            </p>
          </div>

          <ProfileEditCard
            initialRoleType={profile.role_type}
            initialInterviewDate={profile.interview_date}
          />
        </div>
      </FadeIn>

      {/* Primary CTA */}
      <FadeIn>
        <div className="flex items-center gap-4">
          {exhausted ? (
            <>
              <button
                disabled
                className="rounded-xl px-6 py-3 text-base font-semibold cursor-not-allowed"
                style={{ backgroundColor: 'rgba(28,10,0,0.4)', border: '1px solid rgba(249,193,37,0.15)', color: 'rgba(255,255,255,0.35)' }}
              >
                Start practice session
              </button>
              <p className="text-sm font-medium" style={{ color: 'rgba(28,10,0,0.75)' }}>
                All sessions used this month.{' '}
                <Link href="/#pricing" className="font-bold underline hover:opacity-70 transition-opacity" style={{ color: '#1C0A00' }}>Upgrade →</Link>
              </p>
            </>
          ) : (
            <Link
              href="/session/setup"
              className="inline-flex items-center rounded-xl bg-[#F9C125] px-6 py-3 text-base font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/25"
            >
              Start practice session
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Recent sessions */}
      <FadeIn>
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Recent sessions</h2>
          {recentSessions && recentSessions.length > 0 ? (
            <RecentSessionsList sessions={recentSessions as import('@/types/database').Session[]} />
          ) : (
            <div className="py-12 text-center" style={CARD_STYLE}>
              <p className="text-[#F9C125]/80 text-base">No completed sessions yet.</p>
              <p className="text-white/50 text-sm mt-1">Start a session to see your results here.</p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Your Progress (Student+) ──────────────────────────────────────── */}
      <FadeIn>
        <div className="p-6" style={CARD_STYLE}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Your Progress</h2>
            {!isStudent && (
              <span className="text-sm font-semibold uppercase tracking-wider text-[#F9C125]/60">Student+</span>
            )}
          </div>

          {!isStudent ? (
            /* Blurred teaser for Free users */
            <div className="relative rounded-xl overflow-hidden">
              <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}
                className="grid grid-cols-2 gap-4">
                <div className="p-5" style={INNER_CARD}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-3">Filler words per session</p>
                  <div className="flex items-end gap-2 h-20">
                    {[8, 5, 12, 3, 7, 4, 9, 2].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${(h / 12) * 100}%`, background: 'rgba(249,193,37,0.5)' }} />
                    ))}
                  </div>
                </div>
                <div className="p-5" style={INNER_CARD}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-3">Speech pace per session</p>
                  <div className="flex items-end gap-2 h-20">
                    {[60, 75, 55, 80, 70, 85, 65, 90].map((h, i) => (
                      <div key={i} className="h-px flex-1" style={{ marginTop: 'auto', borderTop: '2px solid rgba(249,193,37,0.5)' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(28,10,0,0.55)' }}>
                <div className="text-center px-6">
                  <div className="flex justify-center mb-3">
                    <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                      <Lock className="h-6 w-6 text-[#F9C125]" />
                    </div>
                  </div>
                  <p className="font-bold text-white mb-1">Unlock Progress Charts</p>
                  <p className="text-sm text-white/60 mb-4">Track filler words, pace, and category performance over time</p>
                  <Link href="/#pricing">
                    <button className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all">
                      Upgrade to Student →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Live charts for Student+ */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FillerBarChart data={sessionStats} />
                <WpmLineChart data={sessionStats} />
              </div>
              <CategoryChart data={categoryStats} />
            </div>
          )}
        </div>
      </FadeIn>

      {/* Pro-only insights — blurred teaser for Free + Student */}
      <FadeIn>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Insights &amp; Planning
            {!isPro && (
              <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-[#F9C125]/60">Pro only</span>
            )}
          </h2>
          <div className="grid grid-cols-2 gap-6">

            <div className="relative rounded-2xl overflow-hidden">
              <div style={{ ...CARD_STYLE, filter: isPro ? 'none' : 'blur(5px)', userSelect: isPro ? 'auto' : 'none', pointerEvents: isPro ? 'auto' : 'none' }} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125] mb-3">Progress Trends</p>
                <p className="text-[10px] text-white/40 mb-3">WPM · Filler words · Format compliance</p>
                <div className="flex items-end gap-1.5 h-12">
                  {[60, 45, 70, 55, 80, 65, 85, 75].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: 'rgba(249,193,37,0.35)' }} />
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-2">Last 8 sessions</p>
              </div>
              {!isPro && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(28,10,0,0.55)' }}>
                  <div className="text-center px-4">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full p-2.5" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.3)' }}>
                        <Lock className="h-5 w-5 text-[#F9C125]" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white mb-3">Track your progress</p>
                    <Link href="/#pricing">
                      <button className="rounded-xl bg-[#F9C125] px-4 py-2 text-xs font-bold text-[#1C0A00] hover:brightness-110 transition-all">
                        Upgrade to Pro →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden">
              <div style={{ ...CARD_STYLE, filter: isPro ? 'none' : 'blur(5px)', userSelect: isPro ? 'auto' : 'none', pointerEvents: isPro ? 'auto' : 'none' }} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125] mb-3">This Week&apos;s Plan</p>
                <div className="space-y-2">
                  {['Work on concise Situation framing', 'Reduce filler words below 5/answer', 'Improve WPM consistency to 130+'].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: '#F9C125' }} />
                      <p className="text-xs text-white/60">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-3">AI-generated · Updated every Monday</p>
              </div>
              {!isPro && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(28,10,0,0.55)' }}>
                  <div className="text-center px-4">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full p-2.5" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.3)' }}>
                        <Lock className="h-5 w-5 text-[#F9C125]" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white mb-3">Weekly AI plan</p>
                    <Link href="/#pricing">
                      <button className="rounded-xl bg-[#F9C125] px-4 py-2 text-xs font-bold text-[#1C0A00] hover:brightness-110 transition-all">
                        Upgrade to Pro →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </FadeIn>
    </div>
  )
}
