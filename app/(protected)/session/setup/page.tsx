import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetupClient } from './setup-client'

export default async function SessionSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  return <SetupClient tier={profile?.tier ?? 'free'} />
}
