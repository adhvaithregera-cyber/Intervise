'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import NumberFlow from '@number-flow/react'
import { motion, useInView } from 'framer-motion'
import { Mic2, BarChart2, CalendarDays, Eye, Layers, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    description: 'Start practising today — no commitment, no card.',
    price: 0,
    yearlyPrice: 0,
    buttonText: 'Get started free',
    popular: false,
    features: [
      { text: '2 sessions per month', icon: <CalendarDays size={18} /> },
      { text: '3 questions per session', icon: <Mic2 size={18} /> },
      { text: 'Easy difficulty only', icon: <Layers size={18} /> },
    ],
    includes: [
      'Free includes:',
      'Filler word count',
      'Words per minute score',
      'Overall session grade (A–F)',
      'Access to STAR format',
    ],
  },
  {
    name: 'Student',
    description: 'For anyone serious about landing their next role.',
    price: 149,
    yearlyPrice: 1490,
    buttonText: 'Start Student plan',
    popular: true,
    features: [
      { text: '10 sessions per month', icon: <CalendarDays size={18} /> },
      { text: '5 questions per session', icon: <Mic2 size={18} /> },
      { text: 'All 8 question categories', icon: <Layers size={18} /> },
    ],
    includes: [
      'Everything in Free, plus:',
      'Full filler word breakdown',
      'Eye contact analysis (in-browser)',
      'Behavioural + technical questions',
      'All 8 answer formats',
    ],
  },
  {
    name: 'Pro',
    description: 'Maximum prep power for placement season.',
    price: 499,
    yearlyPrice: 4990,
    buttonText: 'Start Pro plan',
    popular: false,
    features: [
      { text: '30 sessions per month', icon: <CalendarDays size={18} /> },
      { text: '5–8 questions per session', icon: <Mic2 size={18} /> },
      { text: 'All difficulty levels', icon: <BarChart2 size={18} /> },
    ],
    includes: [
      'Everything in Student, plus:',
      'Progress trend charts',
      'Company-specific question sets',
      'Eye contact trend over time',
      'Priority support',
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
      <div
        className="relative flex w-fit rounded-full p-1"
        style={{ backgroundColor: 'rgba(28,10,0,0.35)', border: '1px solid rgba(249,193,37,0.4)' }}
      >
        {['Monthly', 'Yearly'].map((label, i) => {
          const val = String(i)
          const active = selected === val
          return (
            <button
              key={label}
              onClick={() => handle(val)}
              className={cn(
                'relative z-10 h-10 rounded-full px-6 text-sm font-semibold transition-colors',
                active ? 'text-[#1C0A00]' : 'text-white/70 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="switch"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#F9C125' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {label}
                {i === 1 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Save 17%
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
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  function togglePeriod(value: string) {
    setIsYearly(Number(value) === 1)
  }

  return (
    <section id="pricing" className="relative overflow-hidden py-24" style={{ background: 'none' }}>
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(28,10,0,0.45) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-10 text-center">
          <FadeUp delay={0}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Pricing</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              Invest in your next offer.
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mx-auto max-w-md text-white/70">
              One week of Intervise practice beats months of hoping for the best.
            </p>
          </FadeUp>
        </div>

        {/* Toggle */}
        <FadeUp delay={0.3} className="mb-12">
          <PricingSwitch onSwitch={togglePeriod} />
        </FadeUp>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, index) => (
            <FadeUp key={plan.name} delay={0.15 * index + 0.4}>
              <div
                className={cn(
                  'flex h-full flex-col rounded-2xl border p-7 transition-all duration-300',
                  plan.popular
                    ? 'border-[#F9C125] shadow-2xl'
                    : 'border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/15 hover:border-white/35'
                )}
                style={plan.popular ? { backgroundColor: '#1C0A00', boxShadow: '0 0 48px 8px rgba(249,193,37,0.20)' } : {}}
              >
                {/* Badge row */}
                <div className="mb-5 h-6">
                  {plan.popular && (
                    <span className="rounded-full bg-[#F9C125] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1C0A00]">
                      Most popular
                    </span>
                  )}
                </div>

                <h3 className={cn('mb-1 text-2xl font-bold', plan.popular ? 'text-[#F9C125]' : 'text-white')}>
                  {plan.name}
                </h3>
                <p className="mb-5 text-sm text-white/60">{plan.description}</p>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-1">
                  <span className={cn('text-sm', plan.popular ? 'text-[#F9C125]/70' : 'text-white/50')}>₹</span>
                  <span className={cn('text-5xl font-bold', plan.popular ? 'text-white' : 'text-white')}>
                    <NumberFlow value={isYearly ? plan.yearlyPrice : plan.price} />
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-white/50">/{isYearly ? 'yr' : 'mo'}</span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href="/signup"
                  className={cn(
                    'mb-7 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all',
                    plan.popular
                      ? 'bg-[#F9C125] text-[#1C0A00] hover:bg-[#FFD84D] shadow-lg shadow-[#F9C125]/30'
                      : 'border border-white/30 text-white hover:bg-white/15'
                  )}
                >
                  {plan.buttonText}
                </Link>

                {/* Key features with icons */}
                <ul className="mb-6 space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3">
                      <span className={cn('shrink-0', plan.popular ? 'text-[#F9C125]' : 'text-white/50')}>
                        {f.icon}
                      </span>
                      <span className="text-sm text-white/80">{f.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Includes list */}
                <div className={cn('border-t pt-5 mt-auto', plan.popular ? 'border-[#F9C125]/20' : 'border-white/15')}>
                  <p className={cn('mb-3 text-xs font-bold uppercase tracking-widest', plan.popular ? 'text-[#F9C125]' : 'text-white/50')}>
                    {plan.includes[0]}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.includes.slice(1).map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5">
                        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', plan.popular ? 'border-[#F9C125]/40 bg-[#F9C125]/10' : 'border-white/20 bg-white/10')}>
                          <CheckCheck className={cn('h-3 w-3', plan.popular ? 'text-[#F9C125]' : 'text-white/60')} />
                        </span>
                        <span className="text-sm text-white/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
