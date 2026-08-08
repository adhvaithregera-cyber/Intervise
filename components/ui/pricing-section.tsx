'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const NumberFlow = dynamic(() => import('@number-flow/react'), { ssr: false })
import { Mic2, BarChart2, CalendarDays, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRazorpayCheckout } from '@/hooks/use-razorpay-checkout'

const plans = [
  {
    name: 'Free',
    description: 'Start practising today — no commitment, no card.',
    price: 0,
    quarterlyPrice: 0,
    buttonText: 'Get started free',
    popular: false,
    accent: false,
    features: [
      { text: '2 sessions per month', icon: <CalendarDays size={18} /> },
      { text: '5 questions per session', icon: <Mic2 size={18} /> },
      { text: 'Easy difficulty only', icon: <BarChart2 size={18} /> },
    ],
    includes: [
      'Free includes:',
      'Filler word count & breakdown',
      'Words per minute (WPM) score',
      'Overall session grade (A–F)',
      'Identity & Behavioural questions only',
      'AI feedback preview (blurred)',
    ],
  },
  {
    name: 'Student',
    description: 'For anyone serious about landing their next role.',
    price: 199,
    quarterlyPrice: 499,
    buttonText: 'Start Student plan',
    popular: true,
    accent: false,
    features: [
      { text: '12 sessions per month', icon: <CalendarDays size={18} /> },
      { text: 'All 8 question categories', icon: <Mic2 size={18} /> },
      { text: 'Easy + Medium difficulty', icon: <BarChart2 size={18} /> },
    ],
    includes: [
      'Everything in Free, plus:',
      'Full AI feedback — unblurred',
      'Per-answer coaching tips & grammar check',
      'Progress charts (fillers + WPM)',
      '30-day session history',
    ],
  },
  {
    name: 'Pro',
    description: 'Maximum prep power for placement season.',
    price: 349,
    quarterlyPrice: 999,
    buttonText: 'Start Pro plan',
    popular: false,
    accent: false,
    features: [
      { text: '30 sessions per month', icon: <CalendarDays size={18} /> },
      { text: 'Hard + Mixed difficulty', icon: <BarChart2 size={18} /> },
      { text: 'Unlimited session history', icon: <CalendarDays size={18} /> },
    ],
    includes: [
      'Everything in Student, plus:',
      'Hard + Mixed difficulty questions',
      'AI weakness summary',
      'Unlimited session history',
    ],
  },
]

function PricingSwitch({ onSwitch }: { onSwitch: (value: string) => void }) {
  const [selected, setSelected] = useState('0')
  function handle(value: string) {
    setSelected(value)
    onSwitch(value)
  }
  return (
    <div className="flex justify-center">
      <div className="glass-card inline-flex p-1 gap-1 rounded-2xl">
        {['Monthly', 'Quarterly (3 months)'].map((label, i) => {
          const val = String(i)
          const active = selected === val
          return (
            <button
              key={label}
              onClick={() => handle(val)}
              className={cn(
                'relative z-10 transition-all',
                active
                  ? 'rounded-xl bg-[#F9C125] text-[#080d1a] font-semibold px-4 py-1.5 text-sm'
                  : 'rounded-xl text-white/60 px-4 py-1.5 text-sm hover:text-white/80 transition-colors'
              )}
            >
              <span className="flex items-center gap-2">
                {label}
                {i === 1 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                    Save up to 16%
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '-60px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        filter: visible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s, filter 0.5s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

export default function PricingSection({ userTier }: { userTier?: string | null } = {}) {
  const [isQuarterly, setIsQuarterly] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { startCheckout } = useRazorpayCheckout({ onError: setCheckoutError })

  function togglePeriod(value: string) { setIsQuarterly(Number(value) === 1) }

  async function handleCheckout(plan: 'student' | 'pro') {
    const period = isQuarterly ? 'quarterly' : 'monthly'
    import('posthog-js').then(({ default: posthog }) => posthog.capture('checkout_initiated', { plan, period }))
    setCheckoutError(null)
    setCheckoutLoading(plan)
    await startCheckout(plan, period)
    setCheckoutLoading(null)
  }

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-24"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Subtle gold radial glow centred */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(249,193,37,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {checkoutError && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-center text-sm text-red-400"
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            {checkoutError}
          </div>
        )}
        {/* Heading */}
        <div className="mb-10 text-center">
          <FadeUp delay={0}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Pricing</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              Invest in your next offer.
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mx-auto max-w-md text-white/55">
              One week of Intervise practice beats months of hoping for the best.
            </p>
          </FadeUp>
        </div>

        {/* Toggle */}
        <FadeUp delay={0.3} className="mb-12">
          <PricingSwitch onSwitch={togglePeriod} />
        </FadeUp>

        {/* Cards */}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(249,193,37,0.05) 0%, transparent 70%)' }}
          />
          <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, index) => (
            <FadeUp key={plan.name} delay={0.15 * index + 0.4}>
              <div
                className="glass-card flex h-full flex-col rounded-2xl p-7 transition-all duration-300"
                style={
                  plan.popular
                    ? { border: '1px solid rgba(249,193,37,0.40)', boxShadow: '0 0 32px rgba(249,193,37,0.10)' }
                    : undefined
                }
              >
                {/* Badge row */}
                <div className="mb-5 h-6">
                  {plan.popular && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                      style={{ backgroundColor: '#F9C125', color: '#080d1a' }}
                    >
                      Most popular
                    </span>
                  )}
                </div>

                <h3 className={cn('mb-1 text-2xl font-bold', plan.popular ? 'text-white' : 'text-white/90')}>
                  {plan.name}
                </h3>
                <p className={cn('mb-5 text-sm', plan.popular ? 'text-white/75' : 'text-white/45')}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-1">
                  <span className={cn('text-sm', plan.popular ? 'text-white/60' : 'text-white/40')}>₹</span>
                  <span className="text-5xl font-bold text-white">
                    <NumberFlow value={isQuarterly ? plan.quarterlyPrice : plan.price} />
                  </span>
                  {plan.price > 0 && (
                    <span className={cn('text-sm', plan.popular ? 'text-white/60' : 'text-white/40')}>
                      /{isQuarterly ? 'qtr' : 'mo'}
                    </span>
                  )}
                </div>

                {/* CTA */}
                {plan.price === 0 ? (
                  // Free plan — always link to signup
                  <Link
                    href="/signup"
                    className={cn(
                      'mb-7 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all',
                      'text-white hover:bg-white/8'
                    )}
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {plan.buttonText}
                  </Link>
                ) : userTier === plan.name.toLowerCase() ? (
                  // Logged in + this IS their current plan
                  <button
                    disabled
                    className="mb-7 w-full cursor-not-allowed rounded-xl py-3 text-sm font-bold text-white/35"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    Current plan
                  </button>
                ) : userTier != null ? (
                  // Logged in + this is an available plan — open checkout
                  <button
                    onClick={() => handleCheckout(plan.name.toLowerCase() as 'student' | 'pro')}
                    disabled={checkoutLoading !== null}
                    className={cn(
                      'mb-7 w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50',
                      plan.popular
                        ? 'bg-[#F9C125] text-[#080d1a] hover:bg-[#F9C125]/85'
                        : 'text-white hover:bg-white/8'
                    )}
                    style={plan.popular ? {} : { border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {checkoutLoading === plan.name.toLowerCase() ? 'Loading…' : plan.buttonText}
                  </button>
                ) : (
                  // Logged out — redirect to signup with plan pre-selected
                  <Link
                    href={`/signup?plan=${plan.name.toLowerCase()}`}
                    className={cn(
                      'mb-7 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all',
                      plan.popular
                        ? 'bg-[#F9C125] text-[#080d1a] hover:bg-[#F9C125]/85'
                        : 'text-white hover:bg-white/8'
                    )}
                    style={plan.popular ? {} : { border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {plan.buttonText}
                  </Link>
                )}

                {/* Features */}
                <ul className="mb-6 space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3">
                      <span className={plan.popular ? 'text-[#F9C125]' : 'text-white/35'}>
                        {f.icon}
                      </span>
                      <span className={cn('text-sm', plan.popular ? 'text-white/85' : 'text-white/65')}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Includes */}
                <div
                  className="mt-auto border-t pt-5"
                  style={{ borderColor: plan.popular ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)' }}
                >
                  <p className={cn('mb-3 text-xs font-bold uppercase tracking-widest', plan.popular ? 'text-[#F9C125]' : 'text-white/35')}>
                    {plan.includes[0]}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.includes.slice(1).map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={
                            plan.popular
                              ? { backgroundColor: 'rgba(249,193,37,0.2)', border: '1px solid rgba(249,193,37,0.4)' }
                              : { backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }
                          }
                        >
                          <CheckCheck className={cn('h-3 w-3', plan.popular ? 'text-[#F9C125]' : 'text-white/50')} />
                        </span>
                        <span className={cn('text-sm', plan.popular ? 'text-white/80' : 'text-white/55')}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>
          ))}
          </div>
        </div>
      </div>

      {/* Downward fade into CTA section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #080d1a)' }}
      />
    </section>
  )
}
