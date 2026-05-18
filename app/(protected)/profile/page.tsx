import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tier, sessions_used_this_month, sessions_limit, role_type, interview_date, biggest_weakness')
    .eq('id', user.id)
    .single()

  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-[#E07A2F]">Profile</h1>
      <ProfileForm
        fullName={profile.full_name}
        email={user.email ?? ''}
        initialAge={null}
        initialRoleType={profile.role_type}
        initialInterviewDate={profile.interview_date}
        initialBiggestWeakness={profile.biggest_weakness}
        tier={profile.tier ?? 'free'}
        sessionsUsed={profile.sessions_used_this_month}
        sessionsLimit={profile.sessions_limit}
      />
    </div>
  )
}
