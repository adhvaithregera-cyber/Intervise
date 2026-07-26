import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { MinimalFooter } from '@/components/ui/minimal-footer'
import { createClient, getUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free, Student and Pro plans for AI interview coaching. Start free with 2 sessions/month. Upgrade for full AI feedback, progress charts, and Hard difficulty.',
  alternates: { canonical: 'https://intervise.in/pricing' },
}

export default async function PricingPage() {
  const user = await getUser()
  let tier: string | null = null
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
    tier = data?.tier ?? 'free'
  }

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <PricingSection userTier={tier} />
      <MinimalFooter />
    </div>
  )
}
