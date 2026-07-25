import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intervise – AI Interview Coaching',
  description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure. Prepare smarter for your next job interview.',
  alternates: { canonical: 'https://intervise.in' },
}

import { LandingShell } from '@/components/ui/landing-shell'
import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let tier: string | null = null
  let hasCompletedSession = false
  if (user) {
    const [profileResult, sessionResult] = await Promise.all([
      supabase.from('profiles').select('tier').eq('id', user.id).single(),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'complete'),
    ])
    tier = profileResult.data?.tier ?? 'free'
    hasCompletedSession = (sessionResult.count ?? 0) > 0
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen text-white">
        <Navbar />
        <LandingShell sessionHref={user ? '/session/setup' : '/signup'} userTier={tier} hasCompletedSession={hasCompletedSession} />
      </div>
    </>
  )
}
