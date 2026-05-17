import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import PricingSection from '@/components/ui/pricing-section'

const steps = [
  {
    number: '01',
    title: 'Learn the format',
    tag: 'Before you speak',
    description:
      'Most candidates fail not because they don\'t know the answer — but because they don\'t know how to structure it. Every question in Intervise is paired with a briefing card that shows you exactly which format to use.',
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
      'A real interview doesn\'t pause for you to collect your thoughts. Intervise doesn\'t either. Once you start, a countdown timer runs. Your mic records. You answer as if the interviewer is right there.',
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
      'The moment your answer ends, your audio is transcribed and analysed. No waiting. You\'ll see exactly where you lost points — and what to fix before your next session.',
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
    <div className="min-h-screen" style={{ backgroundColor: '#EDE8F5' }}>
      <Navbar />

      {/* Hero — full viewport, centered */}
      <section
        className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden text-center"
        style={{
          background: 'linear-gradient(160deg, #EDE8F5 0%, #ADBBDA 40%, #7091E6 100%)',
        }}
      >
        {/* Hook */}
        <h1 className="mb-12 max-w-3xl px-6 text-5xl font-bold leading-tight tracking-tight">
          <span style={{ color: '#ffffff', textShadow: '0 2px 24px rgba(255,255,255,0.2)' }}>
            Your next interview is{' '}
          </span>
          <span style={{ color: '#3D52A0' }}>
            won before it starts.
          </span>
        </h1>

        {/* Glassmorphic CTA bar */}
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 px-3 py-3 shadow-xl shadow-[#3D52A0]/15 backdrop-blur-md">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl bg-[#3D52A0] px-8 py-3 text-base font-semibold text-white shadow-md shadow-[#3D52A0]/30 hover:bg-[#2d3d78] transition-colors"
          >
            Practice for free
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center rounded-xl px-8 py-3 text-base font-semibold text-[#3D52A0] hover:bg-white/40 transition-colors"
          >
            See how it works →
          </Link>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent, #EDE8F5)' }}
        />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24" style={{ background: 'linear-gradient(180deg, #EDE8F5 0%, white 60%, #EDE8F5 100%)' }}>
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8697C4]">The process</p>
          <h2 className="mb-4 text-4xl font-bold text-[#3D52A0]">How it works</h2>
          <p className="mb-16 max-w-xl text-[#8697C4]">
            Three phases, back to back. The whole loop takes under 20 minutes.
          </p>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="group grid grid-cols-[auto_1fr] gap-8 rounded-2xl border border-[#ADBBDA] bg-white p-8 shadow-sm hover:border-[#7091E6] hover:shadow-lg transition-all"
              >
                {/* Left: number + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #3D52A0, #7091E6)' }}
                  >
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-4 w-px flex-1 bg-gradient-to-b from-[#ADBBDA] to-transparent" style={{ minHeight: '2rem' }} />
                  )}
                </div>

                {/* Right: content */}
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#3D52A0]">{step.title}</h3>
                    <span className="rounded-full border border-[#ADBBDA] bg-[#EDE8F5] px-3 py-0.5 text-xs font-semibold text-[#8697C4]">
                      {step.tag}
                    </span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-[#8697C4]">{step.description}</p>

                  {/* Detail bullets */}
                  <ul className="mb-5 space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-[#3D52A0]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7091E6]" />
                        {d}
                      </li>
                    ))}
                  </ul>

                  {/* Format chips */}
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

      {/* Pricing — animated section */}
      <PricingSection />

      {/* Footer */}
      <footer className="border-t border-[#ADBBDA] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-[#8697C4]">
          © {new Date().getFullYear()} Intervise. Built for placement season.
        </div>
      </footer>
    </div>
  )
}
