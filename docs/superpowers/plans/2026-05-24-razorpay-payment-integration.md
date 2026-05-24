# Razorpay Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Student (₹199/mo) and Pro (₹499/mo) recurring subscription payments via Razorpay, driving tier management through webhooks with a DB-level expiry safety net.

**Architecture:** Razorpay Subscriptions API handles recurring billing; webhooks are the source of truth for tier changes; `tier_expires_at` is a fallback for missed webhooks cleaned up by a daily pg_cron job. No npm Razorpay SDK — all server-side calls use `fetch` with Basic auth against the Razorpay REST API.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (anon + service role), Razorpay REST API, Razorpay checkout.js (CDN), Zod, Vitest

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `supabase/migrations/012_razorpay_subscription.sql` | Create | Add 3 subscription columns to `profiles` |
| `types/database.ts` | Modify | Add subscription fields to `Profile` type |
| `lib/supabase/service.ts` | Create | Supabase service role client (bypasses RLS) |
| `lib/razorpay.ts` | Create | Razorpay REST API client + webhook sig verification |
| `lib/__tests__/razorpay.test.ts` | Create | Unit tests for webhook signature verification |
| `lib/validation.ts` | Modify | Add `createSubscriptionSchema` + `cancelSubscriptionSchema` |
| `app/api/payments/webhook/route.ts` | Create | Webhook handler — drives all tier changes |
| `app/api/payments/create-subscription/route.ts` | Create | Creates Razorpay subscription, stores ID in DB |
| `app/api/payments/cancel/route.ts` | Create | Cancels active subscription |
| `types/razorpay.d.ts` | Create | `window.Razorpay` TypeScript declaration |
| `hooks/use-razorpay-checkout.ts` | Create | Client-side hook: load checkout.js, open modal |
| `app/(protected)/upgrade/page.tsx` | Create | Upgrade page server component (reads DB tier) |
| `app/(protected)/upgrade/upgrade-cards.tsx` | Create | Client component: plan cards + checkout buttons |
| `components/ui/pricing-section.tsx` | Modify | Accept `userTier` prop; logged-in users get checkout |
| `app/page.tsx` | Modify | Pass `tier` as `userTier` to `PricingSection` |
| `app/(protected)/profile/page.tsx` | Modify | Fetch subscription fields, pass to `ProfileForm` |
| `app/(protected)/profile/profile-form.tsx` | Modify | Show subscription status + cancel button |

---

## Pre-conditions (manual, before running tasks)

1. Create Razorpay account → Dashboard → Plans → create two plans:
   - Student: ₹199/month, plan_id note it
   - Pro: ₹499/month, plan_id note it
2. Create a webhook in Razorpay Dashboard pointing to `https://your-domain/api/payments/webhook` for events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `subscription.completed`. Note the webhook secret.
3. Add to `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   RAZORPAY_PLAN_ID_STUDENT=plan_xxx
   RAZORPAY_PLAN_ID_PRO=plan_xxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
   ```

---

## Task 1: DB Migration + Type Update

**Files:**
- Create: `supabase/migrations/012_razorpay_subscription.sql`
- Modify: `types/database.ts`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/012_razorpay_subscription.sql`:

```sql
-- 012_razorpay_subscription.sql
-- Adds Razorpay subscription tracking columns to profiles.
-- subscription_status: active | cancelled | halted | pending
-- tier_expires_at: used by pg_cron daily downgrade job as safety net

alter table public.profiles
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'cancelled', 'halted', 'pending')),
  add column if not exists tier_expires_at timestamptz;

-- Daily pg_cron job: downgrade profiles whose subscription has expired.
-- Run once in Supabase SQL editor after migration (pg_cron must be enabled):
--
-- SELECT cron.schedule(
--   'downgrade-expired-subscriptions',
--   '0 2 * * *',
--   $$
--     UPDATE public.profiles
--     SET tier = 'free',
--         razorpay_subscription_id = null,
--         subscription_status = null,
--         tier_expires_at = null
--     WHERE tier_expires_at < now()
--       AND tier != 'free';
--   $$
-- );
```

- [ ] **Step 2: Apply the migration**

Run in Supabase SQL editor (or via Supabase CLI if configured):
```
-- Paste and run the contents of 012_razorpay_subscription.sql
```

Verify by running `SELECT razorpay_subscription_id, subscription_status, tier_expires_at FROM public.profiles LIMIT 1;` — should return three `null` columns.

- [ ] **Step 3: Update `types/database.ts` — add fields to `Profile` type**

Open `types/database.ts`. The `Profile` type currently ends at `created_at: string`. Add three new fields:

```ts
export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  tier: Tier
  sessions_limit: number
  sessions_used_this_month: number
  onboarding_complete: boolean
  age: number | null
  role_type: string | null
  interview_date: string | null
  biggest_weakness: string | null
  razorpay_subscription_id: string | null
  subscription_status: 'active' | 'cancelled' | 'halted' | 'pending' | null
  tier_expires_at: string | null
  created_at: string
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/012_razorpay_subscription.sql types/database.ts
git commit -m "feat: add razorpay subscription columns to profiles + DB types"
```

---

## Task 2: Supabase Service Role Client

**Files:**
- Create: `lib/supabase/service.ts`

The webhook route and payment routes must write to `profiles.tier` and subscription fields using the service role key — the DB trigger blocks `authenticated` role from changing `tier`. This is a simple utility, no test needed (it's just a thin wrapper).

- [ ] **Step 1: Create `lib/supabase/service.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use only in server-side code (API routes, webhooks).
 * Never expose this to the client.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/service.ts
git commit -m "feat: add supabase service role client"
```

---

## Task 3: Razorpay REST Client + Webhook Signature Verification

**Files:**
- Create: `lib/razorpay.ts`
- Create: `lib/__tests__/razorpay.test.ts`

This module wraps all server-side Razorpay API calls in typed functions and exports the pure signature verification function for testing.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/razorpay.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { verifyRazorpayWebhookSignature } from '../razorpay'

describe('verifyRazorpayWebhookSignature', () => {
  const secret = 'test-webhook-secret-abc123'
  const body = JSON.stringify({ event: 'subscription.activated', id: 'sub_test' })
  const validSig = createHmac('sha256', secret).update(body).digest('hex')

  it('returns true when signature matches body + secret', () => {
    expect(verifyRazorpayWebhookSignature(body, validSig, secret)).toBe(true)
  })

  it('returns false when body has been tampered with', () => {
    const tampered = body + ' '
    expect(verifyRazorpayWebhookSignature(tampered, validSig, secret)).toBe(false)
  })

  it('returns false when signature is wrong', () => {
    expect(verifyRazorpayWebhookSignature(body, 'deadbeef1234', secret)).toBe(false)
  })

  it('returns false when secret is wrong', () => {
    expect(verifyRazorpayWebhookSignature(body, validSig, 'wrong-secret')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/__tests__/razorpay.test.ts
```

Expected: 4 failures (module not found).

- [ ] **Step 3: Create `lib/razorpay.ts`**

```ts
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
      total_count: 120, // up to 10 years; Razorpay renews until cancelled
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/__tests__/razorpay.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/razorpay.ts lib/__tests__/razorpay.test.ts
git commit -m "feat: razorpay REST client + webhook signature verification (TDD)"
```

---

## Task 4: Validation Schemas

**Files:**
- Modify: `lib/validation.ts`

Add two schemas to the existing validation file — one for `POST /api/payments/create-subscription` and one for `POST /api/payments/cancel`.

- [ ] **Step 1: Add schemas to `lib/validation.ts`**

Append to the end of `lib/validation.ts` (after the `transcribeTextSchema` block):

```ts
// ─── Payments ────────────────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  plan: z.enum(['student', 'pro']),
})

export const cancelSubscriptionSchema = z.object({
  /** If true, cancel immediately. If false (default), cancel at end of billing period. */
  immediately: z.boolean().optional(),
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/validation.ts
git commit -m "feat: add payment validation schemas"
```

---

## Task 5: Webhook Route

**Files:**
- Create: `app/api/payments/webhook/route.ts`

This route receives Razorpay server-to-server events and drives all tier changes. Uses service role key for DB writes — never user auth.

Webhook payload structure from Razorpay:
```json
{
  "event": "subscription.activated",
  "payload": {
    "subscription": {
      "entity": {
        "id": "sub_xxx",
        "plan_id": "plan_xxx"
      }
    }
  }
}
```

- [ ] **Step 1: Create directory and route file**

Create `app/api/payments/webhook/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyRazorpayWebhookSignature,
  planIdToTier,
} from '@/lib/razorpay'

// Razorpay requires the raw body for HMAC verification.
// Do NOT call request.json() before request.text().
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('x-razorpay-signature') ?? ''

  if (
    !verifyRazorpayWebhookSignature(
      rawBody,
      sig,
      process.env.RAZORPAY_WEBHOOK_SECRET!
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
  // tier_expires_at = now + 31 days (covers billing month with a 1-day buffer)
  const expires = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

  switch (eventType) {
    case 'subscription.activated': {
      const tier = planIdToTier(planId)
      if (!tier) {
        console.error('[webhook] unknown plan_id on activation:', planId)
        break
      }
      const { error } = await supabase
        .from('profiles')
        .update({ tier, subscription_status: 'active', tier_expires_at: expires })
        .eq('razorpay_subscription_id', subscriptionId)
      if (error) console.error('[webhook] activated update error:', error.message)
      break
    }

    case 'subscription.charged': {
      const { error } = await supabase
        .from('profiles')
        .update({ tier_expires_at: expires })
        .eq('razorpay_subscription_id', subscriptionId)
      if (error) console.error('[webhook] charged update error:', error.message)
      break
    }

    case 'subscription.cancelled': {
      // Tier stays active until tier_expires_at — only update status
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('razorpay_subscription_id', subscriptionId)
      if (error) console.error('[webhook] cancelled update error:', error.message)
      break
    }

    case 'subscription.halted': {
      // Payment failed after all retries — drop to free immediately
      const { error } = await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_status: 'halted',
          tier_expires_at: null,
        })
        .eq('razorpay_subscription_id', subscriptionId)
      if (error) console.error('[webhook] halted update error:', error.message)
      break
    }

    case 'subscription.completed': {
      // Subscription ran its course — clear everything
      const { error } = await supabase
        .from('profiles')
        .update({
          tier: 'free',
          subscription_status: null,
          tier_expires_at: null,
          razorpay_subscription_id: null,
        })
        .eq('razorpay_subscription_id', subscriptionId)
      if (error) console.error('[webhook] completed update error:', error.message)
      break
    }

    default:
      // Unhandled event type — acknowledge so Razorpay doesn't retry
      break
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/webhook/route.ts
git commit -m "feat: razorpay webhook handler for subscription lifecycle events"
```

---

## Task 6: Create-Subscription API Route

**Files:**
- Create: `app/api/payments/create-subscription/route.ts`

Called by the client-side checkout hook. Returns `{ subscription_id, key_id }` for Razorpay checkout.js. If the user already has an active subscription, it is cancelled first (upgrade flow).

- [ ] **Step 1: Create `app/api/payments/create-subscription/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createRazorpaySubscription, cancelRazorpaySubscription } from '@/lib/razorpay'
import { createSubscriptionSchema } from '@/lib/validation'

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { plan } = parsed.data
  const planId =
    plan === 'student'
      ? process.env.RAZORPAY_PLAN_ID_STUDENT!
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
      // Non-fatal: log and continue — old subscription may already be gone
      console.error('[payments] pre-upgrade cancel failed:', err)
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/create-subscription/route.ts
git commit -m "feat: create-subscription API route"
```

---

## Task 7: Cancel API Route

**Files:**
- Create: `app/api/payments/cancel/route.ts`

Called from the Profile page "Cancel subscription" button. Cancels at cycle end by default (user keeps tier until `tier_expires_at`).

- [ ] **Step 1: Create `app/api/payments/cancel/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cancelRazorpaySubscription } from '@/lib/razorpay'
import { cancelSubscriptionSchema } from '@/lib/validation'

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  await serviceSupabase
    .from('profiles')
    .update({ subscription_status: 'cancelled' })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/payments/cancel/route.ts
git commit -m "feat: cancel subscription API route"
```

---

## Task 8: Razorpay Types + useRazorpayCheckout Hook

**Files:**
- Create: `types/razorpay.d.ts`
- Create: `hooks/use-razorpay-checkout.ts`

The hook loads Razorpay's CDN checkout.js, calls `/api/payments/create-subscription`, then opens the modal. Used by both the `/upgrade` page and the landing page pricing section.

- [ ] **Step 1: Create `types/razorpay.d.ts`**

```ts
interface RazorpayOptions {
  key: string
  subscription_id: string
  name?: string
  description?: string
  handler?: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  theme?: {
    color?: string
  }
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  on(event: 'payment.failed', handler: (response: { error: { description: string } }) => void): void
  open(): void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor
  }
}

export {}
```

- [ ] **Step 2: Create `hooks/use-razorpay-checkout.ts`**

```ts
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add types/razorpay.d.ts hooks/use-razorpay-checkout.ts
git commit -m "feat: razorpay type declarations + useRazorpayCheckout hook"
```

---

## Task 9: /upgrade Page

**Files:**
- Create: `app/(protected)/upgrade/page.tsx`
- Create: `app/(protected)/upgrade/upgrade-cards.tsx`

The server component reads the current tier from DB and passes it to the client component. The client component renders two glassmorphic plan cards with checkout buttons.

- [ ] **Step 1: Create `app/(protected)/upgrade/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { UpgradeCards } from './upgrade-cards'

export default async function UpgradePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.tier ?? 'free'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-white">Upgrade your plan</h1>
      <p className="mb-10 text-sm text-white/50">
        Choose the plan that fits your prep goals. Cancel anytime.
      </p>
      <UpgradeCards currentTier={currentTier} />
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(protected)/upgrade/upgrade-cards.tsx`**

```tsx
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
          <a href="/profile" className="text-[#F9C125]/60 hover:text-[#F9C125] transition-colors underline underline-offset-2">
            Profile page
          </a>
          .
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(protected\)/upgrade/page.tsx app/\(protected\)/upgrade/upgrade-cards.tsx
git commit -m "feat: /upgrade page with glassmorphic plan cards and Razorpay checkout"
```

---

## Task 10: Landing Page Pricing Section — Logged-In Checkout

**Files:**
- Modify: `components/ui/pricing-section.tsx`
- Modify: `app/page.tsx`

`app/page.tsx` already fetches `tier` when the user is logged in. Pass it as `userTier` to `PricingSection`. Inside `PricingSection`, logged-in users get checkout buttons; logged-out users get `/signup?plan=X` links. Free plan CTA always links to `/signup`.

- [ ] **Step 1: Update `app/page.tsx` — pass `userTier` to `PricingSection`**

In `app/page.tsx`, find line 43: `<PricingSection />` and change it to:

```tsx
<PricingSection userTier={tier} />
```

The `tier` variable is already computed at line 15–22 of the file (`null` when logged out, `'free'|'student'|'pro'` when logged in).

- [ ] **Step 2: Update `components/ui/pricing-section.tsx` — add `userTier` prop and checkout logic**

This file is already a `'use client'` component. Make the following changes:

**a) Add imports at the top** (after the existing imports):

```tsx
import { useState } from 'react'  // already imported — skip if present
import { useRazorpayCheckout } from '@/hooks/use-razorpay-checkout'
```

**b) Update the `PricingSection` function signature** from:

```tsx
export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  function togglePeriod(value: string) { setIsYearly(Number(value) === 1) }
```

to:

```tsx
export default function PricingSection({ userTier }: { userTier?: string | null } = {}) {
  const [isYearly, setIsYearly] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { startCheckout } = useRazorpayCheckout({ onError: setCheckoutError })

  function togglePeriod(value: string) { setIsYearly(Number(value) === 1) }

  async function handleCheckout(plan: 'student' | 'pro') {
    setCheckoutError(null)
    setCheckoutLoading(plan)
    await startCheckout(plan)
    setCheckoutLoading(null)
  }
```

**c) Add error banner** — inside the `<section>` element, right after the opening `<div className="relative z-10 ...">` tag and before the `{/* Heading */}` comment, add:

```tsx
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
```

**d) Replace the CTA `<Link>` block** (around line 243–258 in the original file) with conditional logic:

Find this block:
```tsx
{/* CTA */}
<Link
  href="/signup"
  className={cn(
    'mb-7 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all',
    plan.popular
      ? 'bg-[#F9C125] text-[#080d1a] hover:bg-[#F9C125]/85'
      : 'text-white hover:bg-white/8'
  )}
  style={
    plan.popular
      ? {}
      : { border: '1px solid rgba(255,255,255,0.15)' }
  }
>
  {plan.buttonText}
</Link>
```

Replace it with:

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual smoke test**

Run `npm run dev` and:
- Visit `/` while logged out → pricing CTAs show links to `/signup?plan=student` etc.
- Visit `/` while logged in as a Free user → Student and Pro buttons should trigger checkout; Free shows "Get started free" link.
- Visit `/` while logged in as Student → Student shows "Current plan" (disabled), Pro shows checkout button.

- [ ] **Step 5: Commit**

```bash
git add components/ui/pricing-section.tsx app/page.tsx
git commit -m "feat: pricing section supports logged-in checkout via Razorpay"
```

---

## Task 11: Profile Page — Subscription Management

**Files:**
- Modify: `app/(protected)/profile/page.tsx`
- Modify: `app/(protected)/profile/profile-form.tsx`

Show subscription status and a "Cancel subscription" button in the existing Subscription card. The server component (`page.tsx`) fetches subscription fields; `ProfileForm` renders the UI.

- [ ] **Step 1: Update `app/(protected)/profile/page.tsx` — fetch subscription fields**

Find line 12:
```tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, tier, sessions_used_this_month, sessions_limit, role_type, interview_date, biggest_weakness')
  .eq('id', user.id)
  .single()
```

Change the `.select(...)` to also include the subscription fields:

```tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, age, tier, sessions_used_this_month, sessions_limit, role_type, interview_date, biggest_weakness, subscription_status, tier_expires_at, razorpay_subscription_id')
  .eq('id', user.id)
  .single()
```

Then update the `<ProfileForm>` call to pass the new props (add after `sessionsLimit`):

```tsx
<ProfileForm
  fullName={profile.full_name}
  email={user.email ?? ''}
  initialAge={profile.age ?? null}
  initialRoleType={profile.role_type}
  initialInterviewDate={profile.interview_date}
  initialBiggestWeakness={profile.biggest_weakness}
  tier={profile.tier ?? 'free'}
  sessionsUsed={profile.sessions_used_this_month}
  sessionsLimit={profile.sessions_limit}
  subscriptionStatus={profile.subscription_status ?? null}
  tierExpiresAt={profile.tier_expires_at ?? null}
  hasActiveSubscription={!!profile.razorpay_subscription_id && profile.subscription_status === 'active'}
/>
```

- [ ] **Step 2: Update `app/(protected)/profile/profile-form.tsx` — add subscription management UI**

**a) Add new props to the `Props` type** (after `sessionsLimit: number`):

```ts
type Props = {
  fullName: string | null
  email: string
  initialAge: number | null
  initialRoleType: string | null
  initialInterviewDate: string | null
  initialBiggestWeakness: string | null
  tier: string
  sessionsUsed: number
  sessionsLimit: number
  subscriptionStatus: string | null
  tierExpiresAt: string | null
  hasActiveSubscription: boolean
}
```

**b) Update the destructuring in `ProfileForm`** to include the new props:

```tsx
export function ProfileForm({
  fullName,
  email,
  initialAge,
  initialRoleType,
  initialInterviewDate,
  initialBiggestWeakness,
  tier,
  sessionsUsed,
  sessionsLimit,
  subscriptionStatus,
  tierExpiresAt,
  hasActiveSubscription,
}: Props) {
```

**c) Add cancellation state** after the existing `useState` declarations (after `const [saveMsg, ...]`):

```tsx
const [cancelling, setCancelling] = useState(false)
const [cancelMsg, setCancelMsg] = useState<string | null>(null)
const [showCancelConfirm, setShowCancelConfirm] = useState(false)
```

**d) Add `handleCancel` function** after `handlePasswordChange`:

```tsx
async function handleCancel() {
  setCancelling(true)
  setCancelMsg(null)
  const res = await fetch('/api/payments/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ immediately: false }),
  })
  setCancelling(false)
  setShowCancelConfirm(false)
  if (res.ok) {
    setCancelMsg('Subscription cancelled. Your plan remains active until the billing period ends.')
  } else {
    const data = await res.json().catch(() => ({}))
    setCancelMsg((data as { error?: string }).error ?? 'Failed to cancel. Please try again.')
  }
}
```

**e) Replace the existing Subscription card** (the `{/* Subscription */}` block at the bottom of the `return`) with:

```tsx
{/* Subscription */}
<div style={CARD_STYLE}>
  <div className="p-6">
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">
      Subscription
    </h2>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-base font-bold text-white">{TIER_LABEL[tier] ?? tier} Plan</p>
        <p className="mt-1 text-sm text-[#F9C125]/70">{TIER_SESSIONS[tier]}</p>
        {subscriptionStatus === 'cancelled' && tierExpiresAt && (
          <p className="mt-2 text-xs text-amber-400">
            Cancelled — access continues until{' '}
            {new Date(tierExpiresAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        {subscriptionStatus === 'halted' && (
          <p className="mt-2 text-xs text-red-400">
            Payment failed — subscription halted. Please renew via the{' '}
            <a href="/upgrade" className="underline underline-offset-2 hover:text-red-300">
              upgrade page
            </a>
            .
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Used this month</p>
        <p className="text-2xl font-bold text-white">
          {sessionsUsed}{' '}
          <span className="text-sm font-normal text-white/50">/ {sessionsLimit}</span>
        </p>
      </div>
    </div>

    {/* Upgrade link for free users */}
    {tier === 'free' && (
      <div className="mt-4">
        <a
          href="/upgrade"
          className="inline-block rounded-lg bg-[#F9C125] px-4 py-2 text-xs font-bold text-[#080d1a] hover:brightness-110 transition-all"
        >
          Upgrade plan
        </a>
      </div>
    )}

    {/* Cancel button for active subscribers */}
    {hasActiveSubscription && !showCancelConfirm && (
      <div className="mt-4">
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="text-xs font-semibold text-white/40 hover:text-red-400 transition-colors"
        >
          Cancel subscription
        </button>
      </div>
    )}

    {/* Confirmation dialog */}
    {showCancelConfirm && (
      <div
        className="mt-4 rounded-xl p-4 space-y-3"
        style={{
          backgroundColor: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
        }}
      >
        <p className="text-sm text-white/80">
          Are you sure? Your plan will stay active until the end of the current billing period.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-all"
          >
            {cancelling ? 'Cancelling…' : 'Yes, cancel'}
          </button>
          <button
            onClick={() => setShowCancelConfirm(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            Keep subscription
          </button>
        </div>
      </div>
    )}

    {cancelMsg && (
      <p
        className={`mt-3 text-xs ${cancelMsg.startsWith('Subscription cancelled') ? 'text-green-400' : 'text-red-400'}`}
      >
        {cancelMsg}
      </p>
    )}
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual smoke test**

Run `npm run dev`, log in as a free user and visit `/profile`:
- Subscription card shows "Free Plan", "2 sessions / month", and an "Upgrade plan" link.
- No cancel button visible (no active subscription).

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/\(protected\)/profile/page.tsx app/\(protected\)/profile/profile-form.tsx
git commit -m "feat: profile page subscription management with cancel flow"
```

---

## Final Verification Checklist

After all tasks complete, manually verify:

1. `npx tsc --noEmit` — zero type errors
2. `npx vitest run` — all tests pass (including new `razorpay.test.ts`)
3. **Webhook tamper rejection:** Use `curl` with a wrong `x-razorpay-signature` header → expect HTTP 401
4. **Create subscription:** POST `/api/payments/create-subscription` with `{ plan: 'student' }` while logged in → expect `{ subscription_id, key_id }` in response
5. **Landing page logged-out:** Visit `/` while logged out → pricing CTAs link to `/signup?plan=X`
6. **Landing page logged-in (free):** Visit `/` while logged in → Student/Pro CTAs open Razorpay modal
7. **/upgrade page:** Visit `/upgrade` → two plan cards render; current tier shows "Current plan" (disabled)
8. **Profile page:** Visit `/profile` → Subscription card shows current plan + usage; "Upgrade plan" link for free users
9. **pg_cron job:** Run the `cron.schedule(...)` SQL in Supabase SQL editor to install the daily downgrade job
