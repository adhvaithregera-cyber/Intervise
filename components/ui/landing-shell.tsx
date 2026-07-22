'use client'

import { useState } from 'react'
import CursorGlow from '@/components/ui/cursor-glow'
import { PrivacyModal } from '@/components/ui/privacy-modal'
import { HeroSection } from '@/components/ui/hero-section'
import { CategoryStrip } from '@/components/ui/category-strip'
import { AppPreview } from '@/components/ui/app-preview'
import PricingSection from '@/components/ui/pricing-section'
import { FinalCta } from '@/components/ui/final-cta'
import { MinimalFooter } from '@/components/ui/minimal-footer'

interface LandingShellProps {
  sessionHref: string
  userTier: string | null
  hasCompletedSession?: boolean
  children?: never
}

export function LandingShell({ sessionHref, userTier, hasCompletedSession = false }: LandingShellProps) {
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <CursorGlow />
      <HeroSection sessionHref={sessionHref} hasCompletedSession={hasCompletedSession} />
      <CategoryStrip />
      <AppPreview />
      <PricingSection userTier={userTier} />
      <FinalCta showSignup={!userTier} />
      <MinimalFooter onPrivacyOpen={() => setPrivacyOpen(true)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  )
}
