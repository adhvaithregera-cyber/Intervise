import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Session } from '@/types/database'

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  student: 'Student',
  pro: 'Pro',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-brand-600',
  C: 'text-amber-600',
  D: 'text-orange-600',
  F: 'text-red-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(5)

  const sessionsLeft = profile.sessions_limit - profile.sessions_used_this_month
  const exhausted = sessionsLeft <= 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Ready to practise today?</p>
        </div>
        <Badge variant={profile.tier === 'free' ? 'gray' : 'brand'}>
          {TIER_LABELS[profile.tier] ?? profile.tier} plan
        </Badge>
      </div>

      {/* Session quota card */}
      <div className="grid grid-cols-3 gap-6">
        <Card tinted className="col-span-2">
          <p className="mb-1 text-sm font-medium text-brand-700">Sessions this month</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-brand-900">
              {profile.sessions_used_this_month}
            </span>
            <span className="mb-1 text-lg text-brand-400">/ {profile.sessions_limit}</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-brand-100">
            <div
              className="h-2 rounded-full bg-brand-600 transition-all"
              style={{
                width: `${Math.min(
                  (profile.sessions_used_this_month / profile.sessions_limit) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-brand-600">
            {exhausted ? 'No sessions left this month.' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} remaining`}
          </p>
        </Card>

        <Card>
          <p className="mb-1 text-sm font-medium text-gray-500">Role</p>
          <p className="text-lg font-semibold text-gray-900">
            {profile.role_type ?? '—'}
          </p>
          {profile.interview_date && (
            <>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-500">Interview date</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(profile.interview_date)}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Primary CTA */}
      <div className="flex items-center gap-4">
        {exhausted ? (
          <div className="flex items-center gap-4">
            <Button disabled>Start practice session</Button>
            <p className="text-sm text-gray-500">
              You&apos;ve used all your sessions for this month.{' '}
              <Link href="/#pricing" className="text-brand-600 hover:underline">
                Upgrade to get more.
              </Link>
            </p>
          </div>
        ) : (
          <Link href="/session/setup">
            <Button size="lg">Start practice session</Button>
          </Link>
        )}
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent sessions</h2>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session: Session) => (
              <Link
                key={session.id}
                href={`/session/report/${session.id}`}
                className="block"
              >
                <Card className="flex items-center justify-between hover:border-brand-300 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {session.difficulty} session
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.completed_at ? formatDate(session.completed_at) : '—'}
                    </p>
                  </div>
                  {session.overall_grade ? (
                    <span
                      className={`text-2xl font-bold ${
                        GRADE_COLORS[session.overall_grade] ?? 'text-gray-600'
                      }`}
                    >
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
          <Card className="text-center py-12">
            <p className="text-gray-500 text-sm">No completed sessions yet.</p>
            <p className="text-gray-400 text-xs mt-1">
              Start a session to see your results here.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
