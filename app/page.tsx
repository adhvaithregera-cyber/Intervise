import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const steps = [
  {
    number: '01',
    title: 'Learn the format',
    description:
      'Each question comes with a briefing card showing the exact answer structure — STAR, PACE, and 6 others — before the clock starts.',
  },
  {
    number: '02',
    title: 'Answer under real pressure',
    description:
      'Record your voice answer within a countdown timer, just like a real interview. No pauses, no retries.',
  },
  {
    number: '03',
    title: 'Get instant feedback',
    description:
      'See your filler word count, words per minute, and overall grade the moment you finish.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Try it out, no card required.',
    badge: null,
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
    badge: 'Most popular',
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
    badge: null,
    features: ['30 sessions / month', '5–8 questions per session', 'Everything in Student', 'Progress trend charts', 'Company question sets', 'All difficulty levels'],
    cta: 'Start Pro plan',
    href: '/signup',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero — gradient background */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%), #000000',
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-40 text-center">
          <Badge variant="brand" className="mb-8 px-4 py-1 text-xs tracking-widest uppercase">
            AI-powered interview coaching
          </Badge>

          <h1 className="mx-auto max-w-4xl text-6xl font-extrabold leading-[1.08] tracking-tight">
            Your next interview is{' '}
            <br />
            <span className="text-brand-400">won before it starts.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg text-zinc-400 leading-relaxed">
            Intervise drills you on real questions using 8 structured answer formats — under timed
            pressure, with instant feedback on filler words and speaking pace.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3 text-base font-semibold">
                Practice for free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="ghost" className="px-8 py-3 text-base">
                See how it works →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-3 text-center text-4xl font-bold text-white">How it works</h2>
        <p className="mb-16 text-center text-zinc-500">Three steps. No fluff.</p>
        <div className="grid grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-8 hover:border-brand-500/30 transition-colors"
            >
              <p className="mb-5 text-5xl font-bold text-brand-500/25">{step.number}</p>
              <h3 className="mb-3 text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-3 text-center text-4xl font-bold text-white">Simple pricing</h2>
        <p className="mb-16 text-center text-zinc-500">Start free. Upgrade when you need more sessions.</p>
        <div className="grid grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-xl border p-8 transition-colors ${
                plan.highlight
                  ? 'border-brand-500/60 bg-brand-500/5'
                  : 'border-white/5 bg-white/[0.03] hover:border-white/10'
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                  {plan.badge && <Badge variant="brand">{plan.badge}</Badge>}
                </div>
                <p className="text-sm text-zinc-600 mb-5">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-zinc-500 text-sm">{plan.period}</span>}
                </div>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                    <span className="text-brand-400 font-bold mt-0.5 shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button variant={plan.highlight ? 'primary' : 'outline'} fullWidth>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-white/5">
        <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-zinc-700">
          © {new Date().getFullYear()} Intervise. Built for placement season.
        </footer>
      </div>
    </div>
  )
}
