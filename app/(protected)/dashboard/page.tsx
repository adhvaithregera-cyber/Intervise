import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FadeIn } from '@/components/ui/fade-in'
import { ProfileEditCard } from './profile-edit-card'
import { RecentSessionsList } from './recent-sessions-list'
import { ChartsClient } from './charts-client'
import type { SessionStat, ProgressSummary } from './charts-client'
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: pageError } = await searchParams
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

  // ── Build both session queries ──────────────────────────────────────────
  let recentQ = supabase
    .from('sessions').select('*').eq('user_id', user.id).eq('status', 'complete')
    .order('completed_at', { ascending: false })
  if (windowCutoff) recentQ = recentQ.gte('created_at', windowCutoff)

  let chartQ = supabase
    .from('sessions').select('id, created_at, difficulty, overall_grade').eq('user_id', user.id).eq('status', 'complete')
    .order('created_at', { ascending: true })
  if (windowCutoff) chartQ = chartQ.gte('created_at', windowCutoff)

  // ── Fetch both in parallel ──────────────────────────────────────────────
  const [{ data: recentSessions }, chartSessionsResult] = await Promise.all([
    recentQ.limit(20),
    isStudent ? chartQ.limit(30) : Promise.resolve({ data: null, error: null }),
  ])

  // ── Chart data (Student+ only) ──────────────────────────────────────────
  type CategoryStat = { category: string; avgFillers: number; sessions: number }

  let sessionStats: SessionStat[] = []
  let categoryStats: CategoryStat[] = []

  if (isStudent) {
    const chartSessions = chartSessionsResult.data
    const sessionIds = (chartSessions ?? []).map((s) => s.id)

    if (sessionIds.length > 0) {
      // Fetch answers + questions for those sessions in parallel
      const { data: answers } = await supabase
        .from('answers').select('session_id, filler_count, wpm, question_id')
        .in('session_id', sessionIds).eq('transcription_failed', false)

      const questionIds = [...new Set((answers ?? []).map((a) => a.question_id))]
      const [{ data: questions }] = await Promise.all([
        questionIds.length > 0
          ? supabase.from('questions').select('id, category_name').in('id', questionIds)
          : Promise.resolve({ data: [] }),
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

      // Count occurrences of each date to detect duplicates
      const dateCount: Record<string, number> = {}
      for (const s of chartSessions ?? []) {
        const d = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        dateCount[d] = (dateCount[d] ?? 0) + 1
      }

      sessionStats = (chartSessions ?? []).map((s) => {
        const st = statsBySession[s.id]
        const avgWpm = st.wpms.length > 0
          ? Math.round(st.wpms.reduce((a, b) => a + b, 0) / st.wpms.length)
          : null
        const diff = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)
        const label = (dateCount[st.date] ?? 1) > 1 ? `${diff} · ${st.date}` : st.date
        return { label, date: st.date, fillers: st.fillers, wpm: avgWpm, grade: s.overall_grade ?? null }
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

  // ── Progress summary stats ──────────────────────────────────────────────
  const progressSummary: ProgressSummary = {
    avgFillers: null, fillerTrend: 'flat',
    avgWpm: null, wpmTrend: 'flat',
    bestGrade: null,
  }
  if (sessionStats.length > 0) {
    const allFillers = sessionStats.map(s => s.fillers)
    progressSummary.avgFillers = Math.round(allFillers.reduce((a, b) => a + b, 0) / allFillers.length)
    if (sessionStats.length >= 2) {
      const half = Math.ceil(sessionStats.length / 2)
      const firstAvg = sessionStats.slice(0, half).reduce((a, s) => a + s.fillers, 0) / half
      const lastAvg = sessionStats.slice(-half).reduce((a, s) => a + s.fillers, 0) / half
      if (lastAvg < firstAvg - 0.5) progressSummary.fillerTrend = 'down'
      else if (lastAvg > firstAvg + 0.5) progressSummary.fillerTrend = 'up'
    }
    const wpmData = sessionStats.filter(s => s.wpm !== null)
    if (wpmData.length > 0) {
      progressSummary.avgWpm = Math.round(wpmData.reduce((a, s) => a + (s.wpm ?? 0), 0) / wpmData.length)
      if (wpmData.length >= 2) {
        const half = Math.ceil(wpmData.length / 2)
        const firstAvg = wpmData.slice(0, half).reduce((a, s) => a + (s.wpm ?? 0), 0) / half
        const lastAvg = wpmData.slice(-half).reduce((a, s) => a + (s.wpm ?? 0), 0) / half
        if (lastAvg > firstAvg + 3) progressSummary.wpmTrend = 'up'
        else if (lastAvg < firstAvg - 3) progressSummary.wpmTrend = 'down'
      }
    }
    const GRADE_ORDER = ['A', 'B', 'C', 'D', 'F']
    const grades = sessionStats.map(s => s.grade).filter(Boolean) as string[]
    if (grades.length > 0) {
      progressSummary.bestGrade = grades.reduce((best, g) =>
        GRADE_ORDER.indexOf(g) < GRADE_ORDER.indexOf(best) ? g : best
      )
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

      {/* Primary CTA — centrepiece */}
      <FadeIn>
        <div className="flex flex-col gap-3">
          {pageError === 'quota_exceeded' && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              You&apos;ve used all your sessions this month. Upgrade your plan to continue.
            </div>
          )}
          {exhausted ? (
            <div
              className="w-full flex flex-col items-center justify-center rounded-2xl gap-1 py-5 sm:py-0 min-h-[64px] sm:min-h-[80px]"
              style={{ backgroundColor: 'rgba(28,10,0,0.4)', border: '1px solid rgba(249,193,37,0.15)' }}
            >
              <span className="text-base sm:text-lg font-semibold text-center px-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Start Practice Session</span>
              <p className="text-sm font-medium text-center px-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                All sessions used this month.{' '}
                <Link href="/#pricing" className="font-bold underline hover:opacity-50 transition-opacity" style={{ color: 'rgba(249,193,37,0.5)' }}>Upgrade →</Link>
              </p>
            </div>
          ) : (
            <Link
              href="/session/setup"
              className="w-full flex items-center justify-center rounded-2xl bg-[#F9C125] text-lg sm:text-xl font-bold text-[#1C0A00] hover:brightness-110 transition-all py-5 sm:py-0 min-h-[64px] sm:min-h-[80px]"
              style={{
                boxShadow: '0 0 40px rgba(249,193,37,0.35), 0 8px 32px rgba(249,193,37,0.25)',
              }}
            >
              Start Practice Session →
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Compact info row: sessions + your info */}
      <FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sessions this month */}
          <div className="p-4" style={CARD_STYLE}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-2">Sessions this month</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-bold text-white">{profile.sessions_used_this_month}</span>
              <span className="text-sm text-white/50">/ {sessionsLimit} used</span>
            </div>
            <div className="h-1.5 w-full rounded-full mb-1.5" style={{ backgroundColor: 'rgba(249,193,37,0.15)' }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: '#F9C125' }}
              />
            </div>
            <p className="text-xs text-[#F9C125]/60">
              {exhausted ? 'No sessions left' : `${sessionsLeft} remaining`}
            </p>
          </div>

          {/* Your info */}
          <ProfileEditCard
            initialRoleType={profile.role_type}
            initialInterviewDate={profile.interview_date}
          />
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
            <div className="relative rounded-xl overflow-hidden" style={{ transform: 'translateZ(0)' }}>
              <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <ChartsClient sessionStats={sessionStats} categoryStats={categoryStats} summary={progressSummary} />
          )}
        </div>
      </FadeIn>


    </div>
  )
}
