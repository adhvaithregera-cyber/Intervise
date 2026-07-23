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
    .select('full_name, age, tier, sessions_used_this_month, sessions_limit, role_type, interview_date, biggest_weakness, subscription_status, tier_expires_at, razorpay_subscription_id, experience_level, interview_type, practice_frequency, job_challenge')
    .eq('id', user.id)
    .single()

  if (!profile) notFound()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <FadeIn delay={0}>
        <h1 className="mb-3 shrink-0 text-xl font-bold text-white">Profile</h1>
      </FadeIn>
      <FadeIn delay={0.08} className="flex-1 min-h-0">
        <ProfileForm
          fullName={profile.full_name}
          email={user.email ?? ''}
          initialAge={profile.age ?? null}
          initialRoleType={profile.role_type}
          initialInterviewDate={profile.interview_date}
          initialBiggestWeakness={profile.biggest_weakness}
          initialExperienceLevel={(profile as { experience_level?: string | null }).experience_level ?? null}
          initialInterviewType={(profile as { interview_type?: string | null }).interview_type ?? null}
          initialPracticeFrequency={(profile as { practice_frequency?: string | null }).practice_frequency ?? null}
          initialJobChallenge={(profile as { job_challenge?: string | null }).job_challenge ?? null}
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

