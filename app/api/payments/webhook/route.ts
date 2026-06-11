import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyRazorpayWebhookSignature,
  planIdToTier,
} from '@/lib/razorpay'
import { getPostHogClient } from '@/lib/posthog-server'

// Razorpay requires the raw body for HMAC verification.
// Do NOT call request.json() before request.text().
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting request')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get('x-razorpay-signature') ?? ''

  if (
    !verifyRazorpayWebhookSignature(
      rawBody,
      sig,
      webhookSecret
    )
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    event: string
    payload?: {
      subscription?: { entity?: { id?: string; plan_id?: string } }
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event
  const entity = event.payload?.subscription?.entity
  if (!entity?.id) {
    // Not a subscription event we care about — acknowledge and skip
    return NextResponse.json({ ok: true })
  }

  const subscriptionId = entity.id
  const planId = entity.plan_id ?? ''

  const supabase = createServiceClient()
  const posthog = getPostHogClient()
  // tier_expires_at = now + 31 days (covers billing month with a 1-day buffer)
  const expires = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

  switch (eventType) {
    case 'subscription.activated': {
      const tier = planIdToTier(planId)
      if (!tier) {
        console.error('[webhook] unknown plan_id on activation:', planId)
        await posthog.shutdown()
        return NextResponse.json({ error: 'Unknown plan' }, { status: 500 })
      }
      const { data: profile, error, count } = await supabase
        .from('profiles')
        .update({ tier, subscription_status: 'active', tier_expires_at: expires }, { count: 'exact' })
        .eq('razorpay_subscription_id', subscriptionId)
        .select('id')
        .single()
      if (error) console.error('[webhook] activated update error:', error.message)
      if (!error && count === 0) {
        console.error('[webhook] activated: no profile matched subscription_id', subscriptionId)
        await posthog.shutdown()
        return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
      }
      if (profile?.id) {
        posthog.capture({ distinctId: profile.id, event: 'subscription_activated', properties: { tier, plan_id: planId } })
      }
      break
    }

    case 'subscription.charged': {
      const { data: profile, error, count } = await supabase
        .from('profiles')
        .update({ tier_expires_at: expires }, { count: 'exact' })
        .eq('razorpay_subscription_id', subscriptionId)
        .select('id, tier')
        .single()
      if (error) console.error('[webhook] charged update error:', error.message)
      if (!error && count === 0) {
        console.error('[webhook] charged: no profile matched subscription_id', subscriptionId)
        await posthog.shutdown()
        return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
      }
      if (profile?.id) {
        posthog.capture({ distinctId: profile.id, event: 'subscription_charged', properties: { tier: profile.tier } })
      }
      break
    }

    case 'subscription.cancelled': {
      // Tier stays active until tier_expires_at — only update status
      const { data: profile, error, count } = await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' }, { count: 'exact' })
        .eq('razorpay_subscription_id', subscriptionId)
        .select('id, tier')
        .single()
      if (error) console.error('[webhook] cancelled update error:', error.message)
      if (!error && count === 0) console.error('[webhook] cancelled: no profile matched subscription_id', subscriptionId)
      if (profile?.id) {
        posthog.capture({ distinctId: profile.id, event: 'subscription_cancelled', properties: { tier: profile.tier } })
      }
      break
    }

    case 'subscription.halted': {
      // Payment failed after all retries — drop to free immediately
      const { data: profile, error, count } = await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_status: 'halted',
          tier_expires_at: null,
        }, { count: 'exact' })
        .eq('razorpay_subscription_id', subscriptionId)
        .select('id')
        .single()
      if (error) console.error('[webhook] halted update error:', error.message)
      if (!error && count === 0) {
        console.error('[webhook] halted: no profile matched subscription_id', subscriptionId)
        await posthog.shutdown()
        return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
      }
      if (profile?.id) {
        posthog.capture({ distinctId: profile.id, event: 'subscription_halted' })
      }
      break
    }

    case 'subscription.completed': {
      // Subscription ran its course — clear everything
      const { data: profile, error, count } = await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_status: null,
          tier_expires_at: null,
          razorpay_subscription_id: null,
        }, { count: 'exact' })
        .eq('razorpay_subscription_id', subscriptionId)
        .select('id')
        .single()
      if (error) console.error('[webhook] completed update error:', error.message)
      if (!error && count === 0) console.error('[webhook] completed: no profile matched subscription_id', subscriptionId)
      if (profile?.id) {
        posthog.capture({ distinctId: profile.id, event: 'subscription_completed' })
      }
      break
    }

    default:
      // Unhandled event type — acknowledge so Razorpay doesn't retry
      break
  }

  await posthog.shutdown()
  return NextResponse.json({ ok: true })
}
