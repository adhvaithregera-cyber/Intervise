import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FadeIn } from '@/components/ui/fade-in'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, age, tier, sessions_used_this_month, sessions_limit, role_type, interview_date, biggest_weakness, subscription_status, tier_expires_at, razorpay_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <FadeIn delay={0}>
        <h1 className="mb-4 text-2xl font-bold text-white">Profile</h1>
      </FadeIn>
      <FadeIn delay={0.08}>
        <ProfileForm
          fullName={profile.full_name}
          email={user.email ?? ''}
          initialAge={profile.age ?? null}
          initialRoleType={profile.role_type}
          initialInterviewDate={profile.interview_date}
          initialBiggestWeakness={profile.biggest_weakness}
          tier={profile.tier ?? 'free'}
          sessionsUsed={profile.sessions_used_this_month}
          sessionsLimit={profile.sessions_limit}
          subscriptionStatus={profile.subscription_status ?? null}
          tierExpiresAt={profile.tier_expires_at ?? null}
          hasActiveSubscription={!!profile.razorpay_subscription_id && profile.subscription_status === 'active'}
        />
      </FadeIn>
    </div>
  )
}
