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
    features: [
      '2 sessions / month',
      '3 questions per session',
      'Filler word count',
      'WPM score',
      'Easy difficulty only',
    ],
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
    features: [
      '10 sessions / month',
      '5 questions per session',
      'Full filler breakdown',
      'Eye contact analysis',
      'All 8 categories',
      'Easy + Medium difficulty',
    ],
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
    features: [
      '30 sessions / month',
      '5–8 questions per session',
      'Everything in Student',
      'Progress trend charts',
      'Company question sets',
      'All difficulty levels',
    ],
    cta: 'Start Pro plan',
    href: '/signup',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero — light cyan radial gradient */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(6,182,212,0.12) 0%, rgba(248,250,252,0) 65%), #f8fafc',
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-40 text-center">
          <h1 className="mx-auto max-w-3xl text-6xl font-bold leading-[1.1] tracking-tight text-slate-900">
            Your next interview is{' '}
            <span className="text-brand-500">won before it starts.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg text-slate-500 leading-relaxed">
            Structured answer formats. Timed pressure. Instant feedback on filler words and
            speaking pace.
          </p>

          {/* Glassmorphic CTA bar */}
          <div className="mt-12 inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/60 px-3 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-md">
            <Link href="/signup">
              <Button size="lg" className="px-7">
                Practice for free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="ghost" className="px-7">
                See how it works →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-3 text-center text-4xl font-bold text-slate-900">How it works</h2>
        <p className="mb-16 text-center text-slate-500">Three steps. No fluff.</p>
        <div className="grid grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
            >
              <p className="mb-5 text-5xl font-bold text-brand-200">{step.number}</p>
              <h3 className="mb-3 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-3 text-center text-4xl font-bold text-slate-900">Simple pricing</h2>
        <p className="mb-16 text-center text-slate-500">
          Start free. Upgrade when you need more sessions.
        </p>
        <div className="grid grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 transition-all ${
                plan.highlight
                  ? 'border-brand-400 bg-white shadow-lg shadow-brand-100'
                  : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {/* Glassmorphic accent strip on highlighted plan */}
              {plan.highlight && (
                <div className="mb-6 -mx-8 -mt-8 rounded-t-2xl bg-gradient-to-r from-brand-400 to-brand-500 px-8 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                  {plan.badge && !plan.highlight && <Badge variant="brand">{plan.badge}</Badge>}
                </div>
                <p className="text-sm text-slate-400 mb-5">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="text-brand-500 font-bold mt-0.5 shrink-0">✓</span>
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
      <div className="border-t border-slate-200 bg-white">
        <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Intervise. Built for placement season.
        </footer>
      </div>
    </div>
  )
}
