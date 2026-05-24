import { createHmac } from 'crypto'

const RAZORPAY_BASE = 'https://api.razorpay.com/v1'

function razorpayAuth(): string {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64')
  return `Basic ${credentials}`
}

/**
 * Verifies a Razorpay webhook signature.
 * rawBody must be the exact bytes received — do NOT parse as JSON first.
 * Pure function: safe to unit test.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return signature === expected
}

/**
 * Creates a Razorpay subscription for the given plan.
 * Returns the subscription object including its `id`.
 */
export async function createRazorpaySubscription(
  planId: string
): Promise<{ id: string }> {
  const res = await fetch(`${RAZORPAY_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: razorpayAuth(),
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay createSubscription failed ${res.status}: ${text}`)
  }

  return res.json() as Promise<{ id: string }>
}

/**
 * Cancels a Razorpay subscription.
 * cancelAtCycleEnd=true → cancel at end of current billing period (default).
 * cancelAtCycleEnd=false → cancel immediately.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean
): Promise<void> {
  const res = await fetch(
    `${RAZORPAY_BASE}/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: razorpayAuth(),
      },
      body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay cancelSubscription failed ${res.status}: ${text}`)
  }
}

/**
 * Maps a Razorpay plan ID to an app tier.
 * Returns null if the plan ID is unknown.
 */
export function planIdToTier(planId: string): 'student' | 'pro' | null {
  if (planId === process.env.RAZORPAY_PLAN_ID_STUDENT) return 'student'
  if (planId === process.env.RAZORPAY_PLAN_ID_PRO) return 'pro'
  return null
}
