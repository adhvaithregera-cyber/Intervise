import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cancelRazorpaySubscription } from '@/lib/razorpay'
import { cancelSubscriptionSchema } from '@/lib/validation'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:cancel-subscription`, RATE_LIMITS.profile)
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

  const parsed = cancelSubscriptionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const immediately = parsed.data.immediately ?? false

  // ── Fetch current subscription from DB ────────────────────────────────────
  const serviceSupabase = createServiceClient()
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('razorpay_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile?.razorpay_subscription_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  if (profile.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'Subscription is not currently active' },
      { status: 400 }
    )
  }

  // ── Cancel with Razorpay ──────────────────────────────────────────────────
  try {
    // cancelAtCycleEnd=true when immediately=false (user keeps access until period end)
    await cancelRazorpaySubscription(
      profile.razorpay_subscription_id,
      !immediately
    )
  } catch (err) {
    console.error('[payments] cancel error:', err)
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again.' },
      { status: 500 }
    )
  }

  // ── Update DB status (tier_expires_at unchanged — kept until period end) ──
  const { error: updateError } = await serviceSupabase
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('id', user.id)
  if (updateError) {
    console.error('[payments] cancel DB update error:', updateError.message)
    // Return ok anyway — Razorpay has cancelled, DB will sync via webhook
  }

  return NextResponse.json({ ok: true })
}
