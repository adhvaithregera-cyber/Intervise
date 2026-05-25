import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createRazorpaySubscription, cancelRazorpaySubscription } from '@/lib/razorpay'
import { createSubscriptionSchema } from '@/lib/validation'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:create-subscription`, RATE_LIMITS.createSubscription)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)) } }
    )
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = createSubscriptionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'plan must be student or pro' }, { status: 400 })
  }

  const { plan, period } = parsed.data
  const planId =
    plan === 'student'
      ? period === 'quarterly'
        ? process.env.RAZORPAY_PLAN_ID_STUDENT_QUARTERLY!
        : process.env.RAZORPAY_PLAN_ID_STUDENT!
      : period === 'quarterly'
        ? process.env.RAZORPAY_PLAN_ID_PRO_QUARTERLY!
        : process.env.RAZORPAY_PLAN_ID_PRO!

  // ── Cancel existing active subscription (upgrade path) ────────────────────
  const serviceSupabase = createServiceClient()
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('razorpay_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  if (
    profile?.razorpay_subscription_id &&
    profile.subscription_status === 'active'
  ) {
    try {
      // Cancel immediately so new subscription starts fresh
      await cancelRazorpaySubscription(profile.razorpay_subscription_id, false)
    } catch (err) {
      // If Razorpay says it's already cancelled/expired/not found, proceed anyway
      const msg = err instanceof Error ? err.message : ''
      const isTerminal = /404|already cancelled|already expired|bad request/i.test(msg)
      if (!isTerminal) {
        console.error('[payments] pre-upgrade cancel failed:', err)
        return NextResponse.json(
          { error: 'Could not cancel existing subscription. Please contact support or try again.' },
          { status: 500 }
        )
      }
      console.warn('[payments] pre-upgrade cancel skipped (terminal state):', msg)
    }
  }

  // ── Create new Razorpay subscription ─────────────────────────────────────
  let subscription: { id: string }
  try {
    subscription = await createRazorpaySubscription(planId)
  } catch (err) {
    console.error('[payments] createRazorpaySubscription error:', err)
    return NextResponse.json(
      { error: 'Failed to create subscription. Please try again.' },
      { status: 500 }
    )
  }

  // ── Store subscription ID in DB (status = pending until webhook activates) ─
  const { error: dbError } = await serviceSupabase
    .from('profiles')
    .update({
      razorpay_subscription_id: subscription.id,
      subscription_status: 'pending',
    })
    .eq('id', user.id)

  if (dbError) {
    console.error('[payments] DB update error:', dbError.message)
    return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 })
  }

  return NextResponse.json({
    subscription_id: subscription.id,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  })
}
