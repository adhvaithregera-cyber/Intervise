import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intervise – AI Interview Coaching',
  description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure. Prepare smarter for your next job interview.',
  alternates: { canonical: 'https://intervise.in' },
}

import { LandingShell } from '@/components/ui/landing-shell'
import { Navbar } from '@/components/layout/navbar'
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

export default async function LandingPage() {
  const user = await getUser()
  let tier: string | null = null
  let hasCompletedSession = false
  let prefetched: { initials: string; tier: string } | null = null

  if (user) {
    const supabase = await createClient()
    const [profileResult, sessionResult] = await Promise.all([
      supabase.from('profiles').select('full_name, tier').eq('id', user.id).single(),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'complete'),
    ])
    tier = profileResult.data?.tier ?? 'free'
    hasCompletedSession = (sessionResult.count ?? 0) > 0
    prefetched = {
      initials: getInitials(profileResult.data?.full_name, user.email),
      tier: tier,
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen text-white">
        <Navbar prefetched={prefetched} />
        <LandingShell sessionHref={user ? '/session/setup' : '/signup'} userTier={tier} hasCompletedSession={hasCompletedSession} />
      </div>
    </>
  )
}
