import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Session } from '@/types/database'

const TIER_LABELS: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400', B: 'text-[#F9C125]', C: 'text-amber-400', D: 'text-orange-400', F: 'text-red-400',
}

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(249,193,37,0.13)',
  borderRadius: '1rem',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: recentSessions } = await supabase
    .from('sessions').select('*').eq('user_id', user.id).eq('status', 'complete')
    .order('completed_at', { ascending: false }).limit(5)

  const sessionsLeft = profile.sessions_limit - profile.sessions_used_this_month
  const exhausted = sessionsLeft <= 0
  const pct = Math.min((profile.sessions_used_this_month / profile.sessions_limit) * 100, 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-white/55">Ready to practise today?</p>
          </div>
          <Badge variant={profile.tier === 'free' ? 'gray' : 'brand'}>
            {TIER_LABELS[profile.tier] ?? profile.tier} plan
          </Badge>
        </div>
      </FadeIn>

      {/* Session quota + info */}
      <FadeIn delay={0.08}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 p-6" style={CARD_STYLE}>
            <p className="mb-1 text-sm font-semibold text-[#F9C125]">Sessions this month</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{profile.sessions_used_this_month}</span>
              <span className="mb-1 text-lg text-white/55">/ {profile.sessions_limit}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: '#F9C125' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/55">
              {exhausted ? 'No sessions left this month.' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} remaining`}
            </p>
          </div>

          <div className="p-6" style={CARD_STYLE}>
            <p className="mb-1 text-sm font-medium text-white/40">Role</p>
            <p className="text-lg font-semibold text-white">{profile.role_type ?? '—'}</p>
            {profile.interview_date && (
              <>
                <p className="mt-4 mb-1 text-sm font-medium text-white/40">Interview date</p>
                <p className="text-sm font-semibold text-white">{formatDate(profile.interview_date)}</p>
              </>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Primary CTA */}
      <FadeIn delay={0.16}>
        <div className="flex items-center gap-4">
          {exhausted ? (
            <>
              <button
                disabled
                className="rounded-xl px-6 py-3 text-base font-semibold text-white/40 cursor-not-allowed"
                style={{ backgroundColor: 'rgba(249,193,37,0.12)', border: '1px solid rgba(249,193,37,0.13)' }}
              >
                Start practice session
              </button>
              <p className="text-sm text-white/55">
                All sessions used this month.{' '}
                <Link href="/#pricing" className="font-semibold text-[#F9C125] hover:text-white transition-colors">Upgrade →</Link>
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
      <FadeIn delay={0.24}>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Recent sessions</h2>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session: Session) => (
                <Link key={session.id} href={`/session/report/${session.id}`} className="block">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:brightness-110 transition-all"
                    style={CARD_STYLE}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white capitalize">{session.difficulty} session</p>
                      <p className="text-xs text-white/40">{session.completed_at ? formatDate(session.completed_at) : '—'}</p>
                    </div>
                    {session.overall_grade ? (
                      <span className={`text-2xl font-bold ${GRADE_COLORS[session.overall_grade] ?? 'text-white/55'}`}>
                        {session.overall_grade}
                      </span>
                    ) : (
                      <Badge variant="gray">No grade</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center" style={CARD_STYLE}>
              <p className="text-white/55 text-sm">No completed sessions yet.</p>
              <p className="text-white/40 text-xs mt-1">Start a session to see your results here.</p>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
