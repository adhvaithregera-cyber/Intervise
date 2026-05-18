import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { InterviewComparison } from '@/components/ui/interview-comparison'
import { CategoryStrip } from '@/components/ui/category-strip'
import { createClient } from '@/lib/supabase/server'

const steps = [
  {
    number: '01',
    title: 'Learn the format',
    tag: 'Before you speak',
    description:
      "Most candidates fail not because they don't know the answer — but because they don't know how to structure it. Every question in Intervise is paired with a briefing card that shows you exactly which format to use.",
    details: [
      'Choose from 8 proven frameworks: STAR, PACE, SOAR, CAR, PREP, and more',
      'Each format has a colour-coded breakdown of what to say in each section',
      'You see the briefing card before the timer starts — never cold-called',
    ],
    formats: ['STAR', 'PACE', 'SOAR', 'CAR', 'PREP'],
  },
  {
    number: '02',
    title: 'Answer under real pressure',
    tag: 'Live recording',
    description:
      "A real interview doesn't pause for you to collect your thoughts. Intervise doesn't either. Once you start, a countdown timer runs. Your mic records. You answer as if the interviewer is right there.",
    details: [
      'Countdown timer matches the actual time limit for each question type',
      'Your audio is recorded via your browser — nothing leaves your device during the session',
      'Tap Done early or let the timer run out — both trigger the next step',
    ],
    formats: [],
  },
  {
    number: '03',
    title: 'Get instant feedback',
    tag: 'Your report',
    description:
      "The moment your answer ends, your audio is transcribed and analysed. No waiting. You'll see exactly where you lost points — and what to fix before your next session.",
    details: [
      'Filler word count with full breakdown: "um" vs "uh" vs "like" vs "basically"',
      'Words per minute — so you know if you\'re rushing or dragging',
      'Overall grade (A–F) based on your performance across all answers',
    ],
    formats: [],
  },
]

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
  const showTryFree = !user || tier !== 'free'

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

          {/* Stat cards — placed high, right after headline block */}
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

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {showTryFree && (
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1C0A00] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-black/25 hover:bg-black transition-colors sm:w-auto"
              >
                Practice for free →
              </Link>
            )}
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/50 bg-white/15 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors sm:w-auto"
            >
              See how it works
            </Link>
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

        {/* Gradient fade into shade-2 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, #E88535)' }}
        />
      </section>

      {/* Category strip on shade-2 orange */}
      <div className="border-y border-white/20" style={{ backgroundColor: '#E88535' }}>
        <CategoryStrip />
      </div>

      {/* ── HOW IT WORKS — shade 2 ── */}
      <section
        id="how-it-works"
        className="relative py-20 sm:py-24"
        style={{ backgroundColor: '#E88535' }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">The process</p>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">How it works</h2>
          <p className="mb-12 max-w-xl text-white/70">Three phases, back to back. The whole loop takes under 20 minutes.</p>

          <div className="space-y-5">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="group grid grid-cols-[auto_1fr] gap-5 rounded-2xl border border-white/25 bg-white/15 p-6 backdrop-blur-sm hover:bg-white/25 transition-all sm:gap-8 sm:p-8"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black text-[#E07A2F] transition-transform group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg"
                    style={{ backgroundColor: '#FEFDF0' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-4 w-px flex-1 bg-white/30" style={{ minHeight: '1.5rem' }} />
                  )}
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-lg font-bold text-white sm:text-xl">{step.title}</h3>
                    <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white/80">{step.tag}</span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-white/70">{step.description}</p>
                  <ul className="mb-4 space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-white/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  {step.formats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.formats.map((f) => (
                        <span key={f} className="rounded-xl bg-[#F9C125]/30 px-3 py-1 text-xs font-semibold text-white">
                          {f}
                        </span>
                      ))}
                      <span className="rounded-xl bg-white/15 px-3 py-1 text-xs font-semibold text-white/70">+3 more</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Fade into shade 3 */}
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, #D97228)' }} />
      </section>

      {/* ── COMPARISON — shade 3 ── */}
      <section className="relative py-20 sm:py-24" style={{ backgroundColor: '#D97228' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">The transformation</p>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Same candidate. Same question.</h2>
          <p className="mb-10 max-w-xl text-white/70">Drag the handle to see exactly what changes after one week with Intervise.</p>
          <InterviewComparison />
        </div>
        {/* Fade into shade 4 */}
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, #CB6820)' }} />
      </section>

      {/* ── PRICING — shade 4 ── */}
      <div style={{ backgroundColor: '#CB6820' }}>
        <PricingSection />
      </div>

      {/* ── FINAL CTA — shade 5 ── */}
      <section className="px-4 py-20 text-center sm:px-6 sm:py-24" style={{ backgroundColor: '#BF601A' }}>
        <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
          Your interview is closer than you think.
        </h2>
        <p className="mb-8 text-white/70">Start practising today — free, no card required.</p>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-xl bg-[#1C0A00] px-10 py-4 text-base font-bold text-white shadow-lg shadow-black/25 hover:bg-black transition-colors"
        >
          Start FREE →
        </Link>
      </section>

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
