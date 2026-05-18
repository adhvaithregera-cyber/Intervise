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
    <div className="min-h-screen bg-[#FEFDF0] text-[#1C1200]">
      <Navbar />

      {/* Hero — full-height warm gradient */}
      <section
        className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #E07A2F 0%, #F9C125 55%, #FEFDF0 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[#E07A2F]/30 blur-2xl" />
          <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/30 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            AI-powered interview coaching
          </span>

          <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your next interview<br />
            <span className="text-[#1C1200]">is won before it starts.</span>
          </h1>

          <p className="mb-10 max-w-[520px] text-base leading-relaxed text-white/80 sm:text-lg">
            You practised for weeks. You knew your answers cold. Then the interviewer asked one question — and your mind went blank.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {showTryFree && (
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1C1200] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-black/20 hover:bg-black transition-colors sm:w-auto"
              >
                Practice for free →
              </Link>
            )}
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/60 bg-white/20 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors sm:w-auto"
            >
              See how it works
            </Link>
          </div>

          {/* Trust pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {['No card needed', '2 free sessions', 'Cancel anytime'].map((t) => (
              <span key={t} className="rounded-full bg-white/25 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {t}
              </span>
            ))}
          </div>

          {/* Floating stat cards */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {[
              { value: '8', label: 'Answer formats' },
              { value: 'A–F', label: 'Instant grade' },
              { value: 'WPM', label: 'Speed tracked' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-2xl bg-white/30 px-6 py-4 backdrop-blur-sm">
                <span className="text-2xl font-black text-white">{s.value}</span>
                <span className="text-xs text-white/80">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, transparent, #FEFDF0)' }} />
      </section>

      {/* Category strip — bleeds from hero into How It Works */}
      <div className="relative z-10 -mt-6 border-y border-[#6BA3C8]/40">
        <CategoryStrip />
      </div>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#FEFDF0] py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6BA3C8]">
            The process
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[#E07A2F] sm:text-4xl">How it works</h2>
          <p className="mb-12 max-w-xl text-[#6BA3C8]">
            Three phases, back to back. The whole loop takes under 20 minutes.
          </p>

          <div className="space-y-5">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="group grid grid-cols-[auto_1fr] gap-5 rounded-2xl border border-[#6BA3C8] bg-white p-6 shadow-sm hover:border-[#F9C125] hover:shadow-md transition-all sm:gap-8 sm:p-8"
              >
                {/* Left: number + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white transition-transform group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg"
                    style={{ backgroundColor: '#E07A2F' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="mt-4 w-px flex-1"
                      style={{
                        background: 'linear-gradient(to bottom, #6BA3C8, transparent)',
                        minHeight: '1.5rem',
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-lg font-bold text-[#E07A2F] sm:text-xl">{step.title}</h3>
                    <span className="rounded-full border border-[#6BA3C8] bg-[#FEFDF0] px-3 py-0.5 text-xs font-semibold text-[#6BA3C8]">
                      {step.tag}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-[#6BA3C8]">{step.description}</p>
                  <ul className="mb-4 space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-[#E07A2F]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  {step.formats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.formats.map((f) => (
                        <span
                          key={f}
                          className="rounded-xl border border-[#F9C125]/40 bg-[#F9C125]/10 px-3 py-1 text-xs font-semibold text-[#E07A2F]"
                        >
                          {f}
                        </span>
                      ))}
                      <span className="rounded-xl border border-[#6BA3C8] bg-[#FEFDF0] px-3 py-1 text-xs font-semibold text-[#6BA3C8]">
                        +3 more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#6BA3C8]/40" />

      {/* Before / After comparison */}
      <section className="bg-[#FEFDF0] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6BA3C8]">
            The transformation
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[#E07A2F] sm:text-4xl">
            Same candidate. Same question.
          </h2>
          <p className="mb-10 max-w-xl text-[#6BA3C8]">
            Drag the handle to see exactly what changes after one week with Intervise.
          </p>
          <InterviewComparison />
        </div>
      </section>

      {/* Gradient bridge into Pricing */}
      <div className="h-16 bg-[#FEFDF0]" />

      {/* Pricing — animated */}
      <PricingSection />

      {/* Divider */}
      <div className="border-t border-[#6BA3C8]/40" />

      {/* Final CTA banner */}
      <section className="bg-[#FEFDF0]/40 px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="mb-4 text-3xl font-bold text-[#E07A2F] sm:text-4xl">
          Your interview is closer than you think.
        </h2>
        <p className="mb-8 text-[#6BA3C8]">
          Start practising today — free, no card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-xl bg-[#E07A2F] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#E07A2F]/20 hover:bg-[#C96A1A] transition-colors"
        >
          Start FREE
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#6BA3C8] bg-[#FEFDF0]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-[#6BA3C8] sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span>© 2026 Intervise</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#E07A2F] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#6BA3C8]">·</span>
            <Link href="/terms" className="hover:text-[#E07A2F] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
