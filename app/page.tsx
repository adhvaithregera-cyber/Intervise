import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'
import { HeroHighlight } from '@/components/ui/hero-highlight'
import { InterviewComparison } from '@/components/ui/interview-comparison'

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#3D52A0]">
      <Navbar />

      {/* Hero */}
      <HeroHighlight containerClassName="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="mb-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-[#3D52A0]">
            Your next interview is{' '}
            <span style={{ color: '#7091E6' }}>won before it starts.</span>
          </h1>

          <p className="mb-10 max-w-[520px] text-base leading-relaxed text-[#8697C4] sm:text-lg">
            You practised for weeks. You knew your answers cold. Then the interviewer asked one question — and your mind went blank.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#3D52A0] px-8 py-3 text-base font-semibold text-white shadow-md shadow-[#3D52A0]/20 hover:bg-[#2d3d78] transition-colors sm:w-auto"
            >
              Practice for free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-[#ADBBDA] px-8 py-3 text-base font-semibold text-[#3D52A0] hover:border-[#7091E6] hover:text-[#7091E6] transition-colors sm:w-auto"
            >
              See how it works →
            </Link>
          </div>

          {/* Trust line */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ADBBDA]/60 bg-white px-4 py-1.5">
            <span className="text-xs text-[#ADBBDA]">No card needed</span>
            <span className="h-1 w-1 rounded-full bg-[#ADBBDA]" />
            <span className="text-xs text-[#ADBBDA]">2 free sessions</span>
            <span className="h-1 w-1 rounded-full bg-[#ADBBDA]" />
            <span className="text-xs text-[#ADBBDA]">Cancel anytime</span>
          </div>
        </div>
      </HeroHighlight>

      {/* Divider */}
      <div className="border-t border-[#ADBBDA]/40" />

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8697C4]">
            The process
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[#3D52A0] sm:text-4xl">How it works</h2>
          <p className="mb-12 max-w-xl text-[#8697C4]">
            Three phases, back to back. The whole loop takes under 20 minutes.
          </p>

          <div className="space-y-5">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="group grid grid-cols-[auto_1fr] gap-5 rounded-2xl border border-[#ADBBDA] bg-white p-6 shadow-sm hover:border-[#7091E6] hover:shadow-md transition-all sm:gap-8 sm:p-8"
              >
                {/* Left: number + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white transition-transform group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg"
                    style={{ backgroundColor: '#3D52A0' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="mt-4 w-px flex-1"
                      style={{
                        background: 'linear-gradient(to bottom, #ADBBDA, transparent)',
                        minHeight: '1.5rem',
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-lg font-bold text-[#3D52A0] sm:text-xl">{step.title}</h3>
                    <span className="rounded-full border border-[#ADBBDA] bg-[#EDE8F5] px-3 py-0.5 text-xs font-semibold text-[#8697C4]">
                      {step.tag}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-[#8697C4]">{step.description}</p>
                  <ul className="mb-4 space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-[#3D52A0]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7091E6]" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  {step.formats.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.formats.map((f) => (
                        <span
                          key={f}
                          className="rounded-xl border border-[#7091E6]/40 bg-[#7091E6]/10 px-3 py-1 text-xs font-semibold text-[#3D52A0]"
                        >
                          {f}
                        </span>
                      ))}
                      <span className="rounded-xl border border-[#ADBBDA] bg-[#EDE8F5] px-3 py-1 text-xs font-semibold text-[#8697C4]">
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
      <div className="border-t border-[#ADBBDA]/40" />

      {/* Before / After comparison */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8697C4]">
            The transformation
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[#3D52A0] sm:text-4xl">
            Same candidate. Same question.
          </h2>
          <p className="mb-10 max-w-xl text-[#8697C4]">
            Drag the handle to see exactly what changes after one week with Intervise.
          </p>
          <InterviewComparison />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#ADBBDA]/40" />

      {/* Pricing — animated */}
      <PricingSection />

      {/* Divider */}
      <div className="border-t border-[#ADBBDA]/40" />

      {/* Final CTA banner */}
      <section className="bg-[#EDE8F5]/40 px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="mb-4 text-3xl font-bold text-[#3D52A0] sm:text-4xl">
          Your interview is closer than you think.
        </h2>
        <p className="mb-8 text-[#8697C4]">
          Start practising today — free, no card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-xl bg-[#3D52A0] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#3D52A0]/20 hover:bg-[#2d3d78] transition-colors"
        >
          Start FREE
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ADBBDA] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-[#8697C4] sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span>© 2026 Intervise</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#3D52A0] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#ADBBDA]">·</span>
            <Link href="/terms" className="hover:text-[#3D52A0] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
