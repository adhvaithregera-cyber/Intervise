'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import NumberFlow from '@number-flow/react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal'

const plans = [
  {
    name: 'Free',
    description: 'Try it out, no card required.',
    price: 0,
    yearlyPrice: 0,
    buttonText: 'Get started free',
    popular: false,
    features: [
      'Free includes:',
      '2 sessions / month',
      '3 questions per session',
      'Filler word count',
      'WPM score',
      'Easy difficulty only',
    ],
  },
  {
    name: 'Student',
    description: 'Best value for serious job seekers.',
    price: 149,
    yearlyPrice: 1490,
    buttonText: 'Start Student plan',
    popular: true,
    features: [
      'Everything in Free, plus:',
      '10 sessions / month',
      '5 questions per session',
      'Full filler breakdown',
      'Eye contact analysis',
      'All 8 question categories',
    ],
  },
  {
    name: 'Pro',
    description: 'Full access for placement season.',
    price: 499,
    yearlyPrice: 4990,
    buttonText: 'Start Pro plan',
    popular: false,
    features: [
      'Everything in Student, plus:',
      '30 sessions / month',
      '5–8 questions per session',
      'Progress trend charts',
      'Company question sets',
      'All difficulty levels',
    ],
  },
]

// Monthly/yearly toggle
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
        style={{ backgroundColor: '#E07A2F', border: '1px solid #F9C125' }}
      >
        {['Monthly', 'Yearly'].map((label, i) => {
          const val = String(i)
          const active = selected === val
          return (
            <button
              key={label}
              onClick={() => handle(val)}
              className={cn(
                'relative z-10 h-9 rounded-full px-6 text-sm font-semibold transition-colors',
                active ? 'text-[#E07A2F]' : 'text-white/70 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="switch"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#FEFDF0' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Scroll-triggered reveal wrapper
function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' })

  function togglePeriod(value: string) {
    setIsYearly(Number(value) === 1)
  }

  return (
    <section
      id="pricing"
      className="py-24 overflow-hidden"
      style={{ background: 'none' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading — word-by-word reveal on scroll */}
        <div ref={headingRef} className="mb-6">
          <ScrollReveal delay={0}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Pricing</p>
          </ScrollReveal>
          <h2 className="mb-4 text-4xl font-bold text-white overflow-hidden">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.12}
              staggerFrom="first"
              containerClassName="flex-wrap"
              transition={{ type: 'spring', stiffness: 250, damping: 40, delay: headingInView ? 0.1 : 999 }}
              autoStart={headingInView}
            >
              Simple pricing
            </VerticalCutReveal>
          </h2>
          <ScrollReveal delay={0.25}>
            <p className="text-white/70">Start free. Upgrade when you need more sessions.</p>
          </ScrollReveal>
        </div>

        {/* Toggle */}
        <ScrollReveal delay={0.35} className="mb-14">
          <PricingSwitch onSwitch={togglePeriod} />
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={0.15 * index + 0.4}>
              <div
                className={cn(
                  'flex h-full flex-col rounded-2xl border p-8 transition-all duration-300',
                  plan.popular
                    ? 'shadow-2xl shadow-[#F9C125]/40'
                    : 'border-[#A0622A] bg-white shadow-sm hover:shadow-lg hover:border-[#F9C125]'
                )}
                style={
                  plan.popular
                    ? { backgroundColor: '#E07A2F', borderColor: '#F9C125', boxShadow: '0 0 40px 8px rgba(112,145,230,0.35)' }
                    : {}
                }
              >
                {/* Badge row — always present for equal height */}
                <div className="mb-6 h-7">
                  {plan.popular && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                      style={{ backgroundColor: 'rgba(112,145,230,0.3)' }}
                    >
                      Most popular
                    </span>
                  )}
                </div>

                <h3 className={`mb-1 text-xl font-bold ${plan.popular ? 'text-white' : 'text-[#E07A2F]'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-5 text-sm ${plan.popular ? 'text-[#A0622A]' : 'text-[#A0622A]'}`}>
                  {plan.description}
                </p>

                {/* Animated price */}
                <div className="mb-6 flex items-baseline gap-1">
                  <span className={`text-sm ${plan.popular ? 'text-[#A0622A]' : 'text-[#A0622A]'}`}>₹</span>
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-[#E07A2F]'}`}>
                    <NumberFlow value={isYearly ? plan.yearlyPrice : plan.price} />
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-sm ${plan.popular ? 'text-[#A0622A]' : 'text-[#A0622A]'}`}>
                      /{isYearly ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href="/signup"
                  className={cn(
                    'mb-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all',
                    plan.popular
                      ? 'bg-white text-[#E07A2F] hover:bg-[#FEFDF0]'
                      : 'border-2 border-[#E07A2F] text-[#E07A2F] hover:bg-[#E07A2F] hover:text-white'
                  )}
                >
                  {plan.buttonText}
                </Link>

                {/* Features */}
                <div className={`border-t pt-6 ${plan.popular ? 'border-[#F9C125]/40' : 'border-[#A0622A]'}`}>
                  <p className={`mb-3 text-sm font-semibold ${plan.popular ? 'text-white' : 'text-[#E07A2F]'}`}>
                    {plan.features[0]}
                  </p>
                  <ul className="space-y-2">
                    {plan.features.slice(1).map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: plan.popular ? '#F9C125' : '#A0622A' }}
                        />
                        <span className={`text-sm ${plan.popular ? 'text-[#FEFDF0]' : 'text-[#A0622A]'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
