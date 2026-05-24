'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface UseRazorpayCheckoutOptions {
  onError?: (message: string) => void
}

/**
 * Shared hook for initiating Razorpay subscription checkout.
 * Loads checkout.js from CDN (cached after first load), calls create-subscription,
 * then opens the Razorpay modal.
 *
 * Usage:
 *   const { startCheckout } = useRazorpayCheckout({ onError: setError })
 *   await startCheckout('student')
 */
export function useRazorpayCheckout({ onError }: UseRazorpayCheckoutOptions = {}) {
  const router = useRouter()

  const startCheckout = useCallback(
    async (plan: 'student' | 'pro') => {
      // 1. Create subscription server-side
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        onError?.(
          (data as { error?: string }).error ?? 'Failed to start checkout. Please try again.'
        )
        return
      }

      const { subscription_id, key_id } = (await res.json()) as {
        subscription_id: string
        key_id: string
      }

      // 2. Load Razorpay checkout.js (noop if already loaded)
      await loadRazorpayScript()

      // 3. Open Razorpay modal
      const planLabel =
        plan === 'student' ? 'Student Plan – ₹199/mo' : 'Pro Plan – ₹499/mo'

      const rzp = new window.Razorpay({
        key: key_id,
        subscription_id,
        name: 'Intervise',
        description: planLabel,
        handler: () => {
          // Payment successful — webhook will activate tier asynchronously
          router.push('/dashboard?upgraded=1')
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying — nothing to do
          },
        },
        theme: { color: '#F9C125' },
      })

      rzp.on('payment.failed', (response) => {
        onError?.(response.error.description ?? 'Payment failed. Please try again.')
      })

      rzp.open()
    },
    [router, onError]
  )

  return { startCheckout }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.head.appendChild(script)
  })
}
