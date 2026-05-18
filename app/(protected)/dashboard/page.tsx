import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Session } from '@/types/database'

const TIER_LABELS: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600', B: 'text-[#E07A2F]', C: 'text-amber-600', D: 'text-orange-600', F: 'text-red-600',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E07A2F]">
            {profile.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-[#6BA3C8]">Ready to practise today?</p>
        </div>
        <Badge variant={profile.tier === 'free' ? 'gray' : 'brand'}>
          {TIER_LABELS[profile.tier] ?? profile.tier} plan
        </Badge>
      </div>

      {/* Session quota + info */}
      <div className="grid grid-cols-3 gap-6">
        <Card tinted className="col-span-2">
          <p className="mb-1 text-sm font-semibold text-[#F9C125]">Sessions this month</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-[#E07A2F]">{profile.sessions_used_this_month}</span>
            <span className="mb-1 text-lg text-[#6BA3C8]">/ {profile.sessions_limit}</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#6BA3C8]/40">
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#E07A2F' }} />
          </div>
          <p className="mt-2 text-xs text-[#F9C125]">
            {exhausted ? 'No sessions left this month.' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} remaining`}
          </p>
        </Card>

        <Card>
          <p className="mb-1 text-sm font-medium text-[#6BA3C8]">Role</p>
          <p className="text-lg font-semibold text-[#E07A2F]">{profile.role_type ?? '—'}</p>
          {profile.interview_date && (
            <>
              <p className="mt-4 mb-1 text-sm font-medium text-[#6BA3C8]">Interview date</p>
              <p className="text-sm font-semibold text-[#E07A2F]">{formatDate(profile.interview_date)}</p>
            </>
          )}
        </Card>
      </div>

      {/* Primary CTA */}
      <div className="flex items-center gap-4">
        {exhausted ? (
          <>
            <button disabled className="rounded-xl bg-[#E07A2F]/40 px-6 py-3 text-base font-semibold text-white cursor-not-allowed">
              Start practice session
            </button>
            <p className="text-sm text-[#6BA3C8]">
              All sessions used this month.{' '}
              <Link href="/#pricing" className="font-semibold text-[#E07A2F] hover:text-[#F9C125]">Upgrade →</Link>
            </p>
          </>
        ) : (
          <Link
            href="/session/setup"
            className="inline-flex items-center rounded-xl bg-[#E07A2F] px-6 py-3 text-base font-semibold text-white hover:bg-[#C96A1A] transition-colors shadow-md shadow-[#E07A2F]/20"
          >
            Start practice session
          </Link>
        )}
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#E07A2F]">Recent sessions</h2>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session: Session) => (
              <Link key={session.id} href={`/session/report/${session.id}`} className="block">
                <Card className="flex items-center justify-between hover:border-[#F9C125] hover:shadow-md transition-all cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-[#E07A2F] capitalize">{session.difficulty} session</p>
                    <p className="text-xs text-[#6BA3C8]">{session.completed_at ? formatDate(session.completed_at) : '—'}</p>
                  </div>
                  {session.overall_grade ? (
                    <span className={`text-2xl font-bold ${GRADE_COLORS[session.overall_grade] ?? 'text-[#6BA3C8]'}`}>
                      {session.overall_grade}
                    </span>
                  ) : (
                    <Badge variant="gray">No grade</Badge>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <p className="text-[#6BA3C8] text-sm">No completed sessions yet.</p>
            <p className="text-[#6BA3C8] text-xs mt-1">Start a session to see your results here.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
