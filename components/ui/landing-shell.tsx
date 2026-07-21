'use client'

import { useState } from 'react'
import CursorGlow from '@/components/ui/cursor-glow'
import { PrivacyModal } from '@/components/ui/privacy-modal'
import { Navbar } from '@/components/layout/navbar'
import { HeroSection } from '@/components/ui/hero-section'
import { CategoryStrip } from '@/components/ui/category-strip'
import { AppPreview } from '@/components/ui/app-preview'
import { ComparisonSection } from '@/components/ui/comparison-section'
import PricingSection from '@/components/ui/pricing-section'
import { FinalCta } from '@/components/ui/final-cta'
import { MinimalFooter } from '@/components/ui/minimal-footer'

interface LandingShellProps {
  sessionHref: string
  userTier: string | null
  children?: never
}

export function LandingShell({ sessionHref, userTier }: LandingShellProps) {
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <CursorGlow />
      <Navbar />
      <HeroSection sessionHref={sessionHref} />
      <CategoryStrip />
      <AppPreview />
      <ComparisonSection />
      <PricingSection userTier={userTier} />
      <FinalCta showSignup={!userTier} />
      <MinimalFooter onPrivacyOpen={() => setPrivacyOpen(true)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  )
}
