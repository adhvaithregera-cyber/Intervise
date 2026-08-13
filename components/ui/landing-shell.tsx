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
  isLoading?: boolean
  children?: never
}

export function LandingShell({ sessionHref, userTier, hasCompletedSession = false, isLoading = false }: LandingShellProps) {
  return (
    <>
      <HeroSection sessionHref={sessionHref} hasCompletedSession={hasCompletedSession} isLoading={isLoading} />
      <CategoryStrip />
      <AppPreview />
      <PricingSection userTier={userTier} />
      <FinalCta showSignup={!userTier} />
      <MinimalFooter />
    </>
  )
}
