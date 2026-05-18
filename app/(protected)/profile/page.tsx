import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  student: 'Student',
  pro: 'Pro',
}

const TIER_SESSIONS: Record<string, string> = {
  free: '2 sessions / month',
  student: '10 sessions / month',
  pro: '30 sessions / month',
}

const TIER_BADGE: Record<string, 'gray' | 'brand' | 'green'> = {
  free: 'gray',
  student: 'brand',
  pro: 'green',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, age, tier, sessions_used_this_month, sessions_limit, role_type, interview_date')
    .eq('id', user.id)
    .single()

  if (!profile) notFound()

  const tier = profile.tier ?? 'free'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-[#170C79]">Profile</h1>

      <div className="space-y-4">
        {/* Personal info */}
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8ACBD0]">
              Personal Information
            </h2>
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#8ACBD0]">Full name</dt>
                <dd className="text-sm font-medium text-[#170C79]">
                  {profile.full_name ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#8ACBD0]/40 pt-4">
                <dt className="text-sm text-[#8ACBD0]">Age</dt>
                <dd className="text-sm font-medium text-[#170C79]">
                  {profile.age != null ? `${profile.age} years old` : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[#8ACBD0]/40 pt-4">
                <dt className="text-sm text-[#8ACBD0]">Email</dt>
                <dd className="text-sm font-medium text-[#170C79]">{user.email}</dd>
              </div>
              {profile.role_type && (
                <div className="flex items-center justify-between border-t border-[#8ACBD0]/40 pt-4">
                  <dt className="text-sm text-[#8ACBD0]">Role target</dt>
                  <dd className="text-sm font-medium text-[#170C79]">{profile.role_type}</dd>
                </div>
              )}
              {profile.interview_date && (
                <div className="flex items-center justify-between border-t border-[#8ACBD0]/40 pt-4">
                  <dt className="text-sm text-[#8ACBD0]">Interview date</dt>
                  <dd className="text-sm font-medium text-[#170C79]">
                    {new Date(profile.interview_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </Card>

        {/* Subscription */}
        <Card>
          <div className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8ACBD0]">
              Subscription
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-[#170C79]">
                    {TIER_LABEL[tier]} Plan
                  </span>
                  <Badge variant={TIER_BADGE[tier] ?? 'gray'}>{TIER_LABEL[tier]}</Badge>
                </div>
                <p className="mt-1 text-sm text-[#8ACBD0]">{TIER_SESSIONS[tier]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#8ACBD0]">Used this month</p>
                <p className="text-lg font-bold text-[#170C79]">
                  {profile.sessions_used_this_month}{' '}
                  <span className="text-sm font-normal text-[#8ACBD0]">
                    / {profile.sessions_limit}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
