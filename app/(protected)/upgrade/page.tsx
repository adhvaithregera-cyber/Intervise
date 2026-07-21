import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FadeIn } from '@/components/ui/fade-in'
import { UpgradeCards } from './upgrade-cards'

export default async function UpgradePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.tier ?? 'free'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <FadeIn delay={0}>
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Upgrade your plan</h1>
          <p className="mb-10 text-sm text-white/50">
            Choose the plan that fits your prep goals. Cancel anytime.
          </p>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <UpgradeCards currentTier={currentTier} />
      </FadeIn>
    </div>
  )
}
