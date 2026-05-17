import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      'See your filler word count, words per minute, and overall grade the moment you finish. Improve with every session.',
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
      'Words per minute',
      'Easy difficulty only',
      '7-day history',
    ],
    cta: 'Get started free',
    href: '/signup',
    variant: 'outline' as const,
    tinted: false,
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
      'WPM gauge',
      'Eye contact analysis',
      'All 8 question categories',
      'Easy + Medium difficulty',
      '30-day history',
    ],
    cta: 'Start Student plan',
    href: '/signup',
    variant: 'primary' as const,
    tinted: true,
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
      'Company-specific question sets',
      'All difficulty levels',
      'Unlimited history',
    ],
    cta: 'Start Pro plan',
    href: '/signup',
    variant: 'outline' as const,
    tinted: false,
  },
]

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Badge variant="brand" className="mb-6">
          AI-powered interview coaching
        </Badge>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          Stop winging interviews.
          <br />
          <span className="text-brand-600">Start answering like a pro.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
          Intervise drills you on real interview questions using 8 structured answer formats — under
          timed pressure, with instant feedback on filler words and speaking pace.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Practice for free</Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="ghost">
              See how it works
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">How it works</h2>
          <div className="grid grid-cols-3 gap-8">
            {steps.map((step) => (
              <Card key={step.number}>
                <p className="mb-3 text-4xl font-bold text-brand-200">{step.number}</p>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Simple pricing</h2>
          <p className="mb-12 text-center text-gray-600">
            Start free. Upgrade when you need more sessions.
          </p>
          <div className="grid grid-cols-3 gap-8 items-start">
            {plans.map((plan) => (
              <Card key={plan.name} tinted={plan.tinted} className="flex flex-col">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    {plan.badge && <Badge variant="brand">{plan.badge}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 text-brand-600 font-bold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button variant={plan.variant} fullWidth>
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Intervise. Built for placement season.
      </footer>
    </>
  )
}
