import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'

const steps = [
  {
    number: '01',
    title: 'Learn the format',
    description:
      'Each question comes with a briefing card showing the exact answer structure — STAR, PACE, and 6 others — before the clock starts.',
  },
  {
    number: '02',
    title: 'Answer under pressure',
    description:
      'Record your voice within a countdown timer, just like a real interview. No pauses, no retries.',
  },
  {
    number: '03',
    title: 'Get instant feedback',
    description:
      'Filler word count, words per minute, and an overall grade — the moment you finish.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Try it out, no card required.',
    features: ['2 sessions / month', '3 questions per session', 'Filler word count', 'WPM score', 'Easy difficulty only'],
    cta: 'Get started free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Student',
    price: '₹149',
    period: '/mo',
    description: 'For serious job seekers.',
    features: ['10 sessions / month', '5 questions per session', 'Full filler breakdown', 'Eye contact analysis', 'All 8 categories', 'Easy + Medium difficulty'],
    cta: 'Start Student plan',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/mo',
    description: 'For placement season crunch.',
    features: ['30 sessions / month', '5–8 questions per session', 'Everything in Student', 'Progress trend charts', 'Company question sets', 'All difficulty levels'],
    cta: 'Start Pro plan',
    href: '/signup',
    highlight: false,
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
          <span style={{ color: '#3D52A0' }}>Your next interview is </span>
          <span
            className="relative"
            style={{
              color: '#ffffff',
              textShadow: '0 2px 24px rgba(61,82,160,0.25)',
            }}
          >
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
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8697C4]">The process</p>
        <h2 className="mb-16 text-4xl font-bold text-[#3D52A0]">How it works</h2>
        <div className="grid grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group rounded-2xl border border-[#ADBBDA] bg-white p-8 shadow-sm hover:border-[#7091E6] hover:shadow-md transition-all"
            >
              <p className="mb-5 text-5xl font-bold text-[#ADBBDA] group-hover:text-[#7091E6] transition-colors">
                {step.number}
              </p>
              <h3 className="mb-3 text-base font-semibold text-[#3D52A0]">{step.title}</h3>
              <p className="text-sm text-[#8697C4] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24"
        style={{ background: 'linear-gradient(180deg, #EDE8F5 0%, white 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8697C4]">Pricing</p>
          <h2 className="mb-4 text-4xl font-bold text-[#3D52A0]">Simple pricing</h2>
          <p className="mb-16 text-[#8697C4]">Start free. Upgrade when you need more sessions.</p>

          <div className="grid grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-8 transition-all ${
                  plan.highlight
                    ? 'border-[#7091E6] bg-[#3D52A0] shadow-xl shadow-[#3D52A0]/20'
                    : 'border-[#ADBBDA] bg-white shadow-sm hover:shadow-md hover:border-[#7091E6]'
                }`}
              >
                {plan.highlight && (
                  <span className="mb-6 self-start rounded-full bg-[#7091E6]/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                    Most popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className={`mb-1 text-base font-semibold ${plan.highlight ? 'text-white' : 'text-[#3D52A0]'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mb-5 text-sm ${plan.highlight ? 'text-[#ADBBDA]' : 'text-[#8697C4]'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-[#3D52A0]'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlight ? 'text-[#ADBBDA]' : 'text-[#8697C4]'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-3 text-sm ${plan.highlight ? 'text-[#EDE8F5]' : 'text-[#8697C4]'}`}>
                      <span className={`font-bold mt-0.5 shrink-0 ${plan.highlight ? 'text-[#7091E6]' : 'text-[#3D52A0]'}`}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-[#3D52A0] hover:bg-[#EDE8F5]'
                      : 'border-2 border-[#3D52A0] text-[#3D52A0] hover:bg-[#3D52A0] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ADBBDA] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-[#8697C4]">
          © {new Date().getFullYear()} Intervise. Built for placement season.
        </div>
      </footer>
    </div>
  )
}
