'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { useRazorpayCheckout } from '@/hooks/use-razorpay-checkout'

const PLANS = [
  {
    key: 'student' as const,
    name: 'Student',
    price: '₹199 / month',
    popular: true,
    features: [
      '12 sessions per month',
      'Full AI feedback (all categories)',
      'All 8 question categories',
      'Easy + Medium difficulty',
      '2 AI-generated questions per session',
      'Shareable scorecard PNG',
    ],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '₹499 / month',
    popular: false,
    features: [
      '30 sessions per month',
      'Full AI feedback (all categories)',
      'All difficulty levels',
      '3 AI-generated questions + 8 tokens/month',
      'Progress trend charts',
      'Weakness summary + weekly AI plan',
      'Company-specific question sets (coming soon)',
    ],
  },
]

const CARD_BASE: React.CSSProperties = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '1rem',
}

export function UpgradeCards({ currentTier }: { currentTier: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'student' | 'pro' | null>(null)
  const { startCheckout } = useRazorpayCheckout({ onError: setError })

  async function handleCheckout(plan: 'student' | 'pro') {
    setError(null)
    setLoading(plan)
    await startCheckout(plan)
    setLoading(null)
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.key
          return (
            <div
              key={plan.key}
              className="flex flex-col p-7"
              style={
                plan.popular
                  ? {
                      ...CARD_BASE,
                      border: '1px solid rgba(249,193,37,0.45)',
                      boxShadow: '0 0 48px 4px rgba(249,193,37,0.14)',
                    }
                  : {
                      ...CARD_BASE,
                      border: '1px solid rgba(249,193,37,0.20)',
                    }
              }
            >
              {plan.popular && (
                <span
                  className="mb-4 inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: '#F9C125', color: '#080d1a' }}
                >
                  Most popular
                </span>
              )}

              <h2 className="mb-1 text-2xl font-bold text-white">{plan.name}</h2>
              <p className="mb-7 text-lg font-semibold text-[#F9C125]">{plan.price}</p>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 'rgba(249,193,37,0.15)',
                        border: '1px solid rgba(249,193,37,0.35)',
                      }}
                    >
                      <CheckCheck className="h-3 w-3 text-[#F9C125]" />
                    </span>
                    <span className="text-sm text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl py-3 text-sm font-bold text-white/35"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  Current plan
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loading !== null}
                  className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: '#F9C125', color: '#080d1a' }}
                >
                  {loading === plan.key ? 'Loading…' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-white/35">
        Cancel anytime. Access continues until your billing period ends.
      </p>

      {currentTier !== 'free' && (
        <p className="text-center text-xs text-white/25">
          To downgrade or cancel, visit your{' '}
          <a
            href="/profile"
            className="text-[#F9C125]/60 hover:text-[#F9C125] transition-colors underline underline-offset-2"
          >
            Profile page
          </a>
          .
        </p>
      )}
    </div>
  )
}
