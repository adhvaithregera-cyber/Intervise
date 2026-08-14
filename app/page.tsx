import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Intervise – AI Interview Coaching',
  description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure. Prepare smarter for your next job interview.',
  alternates: { canonical: 'https://intervise.in' },
}

import { LandingShell } from '@/components/ui/landing-shell'
import { Navbar, NavbarSkeleton } from '@/components/layout/navbar'
import { createClient, getUser } from '@/lib/supabase/server'

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Intervise',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  url: 'https://intervise.in',
  description: 'AI-powered interview coaching. Practice structured answers, get instant feedback on pace, filler words, and answer structure.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'INR' },
    { '@type': 'Offer', name: 'Student', price: '199', priceCurrency: 'INR' },
    { '@type': 'Offer', name: 'Pro', price: '349', priceCurrency: 'INR' },
  ],
}

// Neutral fallback — rendered immediately as the Suspense fallback so the
// browser receives full HTML (including the LCP h1) without waiting on DB queries.
// Uses NavbarSkeleton (no Login/Signup, no avatar) and LandingShell with isLoading
// (skeleton CTA buttons) so logged-in users don't see a false logged-out state.
const NEUTRAL_FALLBACK = (
  <>
    <NavbarSkeleton />
    <LandingShell sessionHref="/signup" userTier={null} hasCompletedSession={false} isLoading />
  </>
)

// Resolves auth state and swaps in the personalised Navbar + shell.
// getUser() and createClient() are both React cache()-wrapped so they share
// one network round-trip even if called from multiple server components.
async function AuthenticatedContent() {
  const user = await getUser()

  if (!user) {
    // Not logged in — render real logged-out state (Login/Signup in navbar, public CTAs).
    // NEUTRAL_FALLBACK (isLoading=true) is only for the initial Suspense shell before
    // this component runs; returning it here would leave grey skeleton boxes permanently.
    return (
      <>
        <Navbar prefetched={null} />
        <LandingShell sessionHref="/signup" userTier={null} hasCompletedSession={false} />
      </>
    )
  }

  const supabase = await createClient()
  const [profileResult, sessionResult] = await Promise.all([
    supabase.from('profiles').select('full_name, tier').eq('id', user.id).single(),
    supabase.from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'complete'),
  ])

  const tier = profileResult.data?.tier ?? 'free'
  const hasCompletedSession = (sessionResult.count ?? 0) > 0
  const initials = getInitials(profileResult.data?.full_name, user.email)

  return (
    <>
      <Navbar prefetched={{ initials, tier }} />
      <LandingShell
        sessionHref="/session/setup"
        userTier={tier}
        hasCompletedSession={hasCompletedSession}
      />
    </>
  )
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen text-white">
        <Suspense fallback={NEUTRAL_FALLBACK}>
          <AuthenticatedContent />
        </Suspense>
      </div>
    </>
  )
}
