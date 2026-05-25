import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { InterviewComparison } from '@/components/ui/interview-comparison'
import { CategoryStrip } from '@/components/ui/category-strip'
import { HowItWorks } from '@/components/ui/how-it-works'
import { ComparisonSection } from '@/components/ui/comparison-section'
import { FinalCta } from '@/components/ui/final-cta'
import { HeroSection } from '@/components/ui/hero-section'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  // Supabase sometimes redirects to the site URL root with ?code= instead of
  // /auth/callback — forward it so the session is properly established.
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }
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

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── COMPARISON ── */}
      <ComparisonSection />

      {/* ── PRICING — dark section ── */}
      <PricingSection userTier={tier} />

      {/* ── FINAL CTA ── */}
      <FinalCta showSignup={showTryFree} />

      {/* Footer */}
      <footer className="border-t border-white/10" style={{ backgroundColor: '#080d1a' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-white/40 sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span>© 2026 Intervise</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
