import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FadeIn } from '@/components/ui/fade-in'
import { ProfileEditCard } from './profile-edit-card'
import { SessionRow } from './session-row'
import { Lock } from 'lucide-react'

const TIER_LABELS: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }

// Source of truth for limits — never trust the potentially stale DB column
const TIER_SESSION_LIMITS: Record<string, number> = { free: 2, student: 12, pro: 30 }

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  let sessionsQuery = supabase
    .from('sessions').select('*').eq('user_id', user.id).eq('status', 'complete')
    .order('completed_at', { ascending: false })

  if (profile.tier === 'free') {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    sessionsQuery = sessionsQuery.gte('created_at', cutoff)
  } else if (profile.tier === 'student') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    sessionsQuery = sessionsQuery.gte('created_at', cutoff)
  }

  const { data: recentSessions } = await sessionsQuery.limit(10)

  const isPro = profile.tier === 'pro'

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
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">Sessions this month</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{profile.sessions_used_this_month}</span>
              <span className="mb-1 text-lg text-white/60">/ {sessionsLimit}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: 'rgba(249,193,37,0.15)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: '#F9C125' }}
              />
            </div>
            <p className="mt-2 text-xs text-[#F9C125]/70">
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
          <h2 className="mb-4 text-lg font-semibold text-white">Recent sessions</h2>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center" style={CARD_STYLE}>
              <p className="text-[#F9C125]/80 text-sm">No completed sessions yet.</p>
              <p className="text-white/50 text-xs mt-1">Start a session to see your results here.</p>
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

            {/* Progress trends card */}
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

            {/* Weakness summary + weekly plan card */}
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
