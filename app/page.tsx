import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intervise – AI Interview Coaching',
  description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure. Prepare smarter for your next job interview.',
  alternates: { canonical: 'https://intervise.in' },
}
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { InterviewComparison } from '@/components/ui/interview-comparison'
import { CategoryStrip } from '@/components/ui/category-strip'
import { AppPreview } from '@/components/ui/app-preview'
import { ComparisonSection } from '@/components/ui/comparison-section'
import { FinalCta } from '@/components/ui/final-cta'
import { HeroSection } from '@/components/ui/hero-section'
import { MinimalFooter } from '@/components/ui/minimal-footer'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let tier: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()
    tier = profile?.tier ?? 'free'
  }
  const showTryFree = !user

  return (
    <div className="min-h-screen text-white">
      <Navbar />

      {/* ── HERO ── */}
      <HeroSection sessionHref={user ? '/session/setup' : '/signup'} />

      {/* Category strip — dark band */}
      <CategoryStrip />

      {/* ── APP PREVIEW ── */}
      <AppPreview />

      {/* ── COMPARISON ── */}
      <ComparisonSection />

      {/* ── PRICING — dark section ── */}
      <PricingSection userTier={tier} />

      {/* ── FINAL CTA ── */}
      <FinalCta showSignup={showTryFree} />

      {/* ── FOOTER ── */}
      <MinimalFooter />
    </div>
  )
}
