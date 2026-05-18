import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { InterviewComparison } from '@/components/ui/interview-comparison'
import { CategoryStrip } from '@/components/ui/category-strip'
import { HowItWorks } from '@/components/ui/how-it-works'
import { ComparisonSection } from '@/components/ui/comparison-section'
import { FinalCta } from '@/components/ui/final-cta'
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
    <div className="min-h-screen text-[#1C0A00]">
      <Navbar />

      {/* ── HERO — solid orange + radial glow centred on headline ── */}
      <section
        className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pb-32 sm:px-6"
        style={{ backgroundColor: '#E07A2F' }}
      >
        {/* Radial golden glow centred on the text */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 75% 60% at 50% 44%, rgba(249,193,37,0.50) 0%, rgba(249,193,37,0.15) 45%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-32">
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F9C125]" />
            AI-powered interview coaching
          </span>

          <h1 className="mb-5 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your next interview<br />
            <span className="text-[#1C0A00]">is won before it starts.</span>
          </h1>

          <p className="mb-8 max-w-[520px] text-base leading-relaxed text-white/80 sm:text-lg">
            You practised for weeks. You knew your answers cold. Then the interviewer asked one question — and your mind went blank.
          </p>

          {/* Stat cards */}
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {[
              { value: '8', label: 'Answer formats' },
              { value: 'A–F', label: 'Instant grade' },
              { value: 'WPM', label: 'Speed tracked' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl bg-white/25 px-7 py-3.5 backdrop-blur-sm"
              >
                <span className="text-xl font-black text-white">{s.value}</span>
                <span className="text-[11px] text-white/75">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs — "See how it works" is primary dark, "Practice for free" is secondary */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#1C0A00] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-black/25 hover:bg-black transition-colors sm:w-auto"
            >
              See how it works
            </Link>
            {showTryFree && (
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors sm:w-auto"
              >
                Practice for free →
              </Link>
            )}
          </div>

          {/* Trust pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {['No card needed', '2 free sessions', 'Cancel anytime'].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Short downward fade into dark category strip — no upward gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to bottom, transparent, #1C0A00)' }}
        />
      </section>

      {/* Category strip — dark band */}
      <CategoryStrip />

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── COMPARISON ── */}
      <ComparisonSection />

      {/* ── PRICING — dark section ── */}
      <PricingSection />

      {/* ── FINAL CTA ── */}
      <FinalCta showSignup={showTryFree} />

      {/* Footer */}
      <footer className="border-t border-white/10" style={{ backgroundColor: '#1C0A00' }}>
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
