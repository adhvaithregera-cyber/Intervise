# Razorpay Payment Integration Design

## Goal

Enable Student (₹199/mo) and Pro (₹499/mo) recurring subscription payments via Razorpay, with automatic tier management driven by webhooks and a DB-level expiry guard.

## Architecture

```
User → /upgrade page  OR  landing page /pricing section
  → POST /api/payments/create-subscription  (creates Razorpay subscription, stores ID)
  → Razorpay Checkout modal (client-side razorpay.js / checkout.js)
  → User pays

Razorpay → POST /api/payments/webhook
  subscription.activated  → set tier + tier_expires_at (service role)
  subscription.charged    → extend tier_expires_at by 31 days
  subscription.cancelled  → set subscription_status = 'cancelled' (tier_expires_at unchanged)
  subscription.halted     → set tier = 'free' (payment failed after all retries)
  subscription.completed  → set tier = 'free', clear subscription fields

Upgrade flow (Student → Pro):
  → POST /api/payments/cancel (cancel current subscription immediately)
  → POST /api/payments/create-subscription with plan = 'pro'
  → User pays → webhook activates Pro tier

Tier enforcement:
  → pg_cron daily job downgrades expired subscriptions
```

## Database Changes

New columns on `profiles` table (migration `009_razorpay_subscription.sql`):

```sql
razorpay_subscription_id  text        null
subscription_status       text        null  -- active | cancelled | halted | pending
tier_expires_at           timestamptz null
```

pg_cron daily job:
```sql
UPDATE profiles
SET tier = 'free',
    razorpay_subscription_id = null,
    subscription_status = null,
    tier_expires_at = null
WHERE tier_expires_at < now()
  AND tier != 'free';
```

Razorpay Plans (created once in Razorpay dashboard, IDs stored in env vars):
- `RAZORPAY_PLAN_ID_STUDENT` — ₹199/month recurring
- `RAZORPAY_PLAN_ID_PRO` — ₹499/month recurring

## New Env Vars

```
RAZORPAY_KEY_ID=          (already scaffolded)
RAZORPAY_KEY_SECRET=      (already scaffolded)
RAZORPAY_WEBHOOK_SECRET=  (new — from Razorpay dashboard webhook settings)
RAZORPAY_PLAN_ID_STUDENT= (new — Razorpay plan ID for ₹199/mo)
RAZORPAY_PLAN_ID_PRO=     (new — Razorpay plan ID for ₹499/mo)
NEXT_PUBLIC_RAZORPAY_KEY_ID= (new — public key for client-side checkout.js)
```

## API Routes

### `POST /api/payments/create-subscription`
- Auth required (`supabase.auth.getUser()`)
- Body: `{ plan: 'student' | 'pro' }`
- If user has an active subscription: cancel it first via Razorpay API, then create new
- Creates Razorpay subscription via REST API (no SDK — use `fetch` with Basic auth)
- Stores `razorpay_subscription_id` + `subscription_status = 'pending'` on profile
- Returns: `{ subscription_id: string, key_id: string }`

### `POST /api/payments/cancel`
- Auth required
- Body: `{ immediately?: boolean }` — `false` by default (cancel at period end)
- Calls Razorpay cancel subscription API
- Sets `subscription_status = 'cancelled'` on profile
- Returns: `{ ok: true }`

### `POST /api/payments/webhook`
- No user auth — Razorpay server-to-server
- Uses service role key for all DB writes
- Signature verification:
  ```ts
  const sig = req.headers.get('x-razorpay-signature')
  const rawBody = await req.text()
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  if (sig !== expected) return 401
  ```
- Webhook events and actions:

| Event | Action |
|---|---|
| `subscription.activated` | `tier = plan`, `subscription_status = 'active'`, `tier_expires_at = now() + 31 days` |
| `subscription.charged` | `tier_expires_at = now() + 31 days` |
| `subscription.cancelled` | `subscription_status = 'cancelled'` (tier_expires_at unchanged) |
| `subscription.halted` | `tier = 'free'`, `subscription_status = 'halted'`, `tier_expires_at = null` |
| `subscription.completed` | `tier = 'free'`, `subscription_status = null`, `tier_expires_at = null`, `razorpay_subscription_id = null` |

## Shared Checkout Hook

`hooks/use-razorpay-checkout.ts` — client-side hook used by both `/upgrade` and the landing page pricing section:

```ts
function useRazorpayCheckout() {
  async function startCheckout(plan: 'student' | 'pro') {
    // 1. POST /api/payments/create-subscription
    // 2. Load checkout.js script if not already loaded
    // 3. Open Razorpay modal with subscription_id
    // 4. on payment.success → router.push('/dashboard?upgraded=1')
    // 5. on payment.failed → show error
  }
  return { startCheckout }
}
```

## `/upgrade` Page

Route: `app/(protected)/upgrade/page.tsx` (server component)

- Reads user's current tier from DB
- Renders two glassmorphic plan cards: Student (₹199/mo) and Pro (₹499/mo)
- Feature list matches landing page pricing section
- CTA states:
  - Current plan → disabled "Current plan" button
  - Available plan → active "Upgrade to Student/Pro" button
  - Downgrade not offered inline — link to "Manage subscription" on Profile page
- Small print: "Cancel anytime. Access continues until your billing period ends."
- Client wrapper (`upgrade-cards.tsx`) calls `useRazorpayCheckout()`

## Landing Page Pricing Section

File: `components/ui/pricing-section.tsx`

- Becomes a client component (or gains a thin client wrapper)
- Logged-in users: CTA button calls `useRazorpayCheckout()` directly, opens modal inline
- Logged-out users: CTA redirects to `/signup?plan=student` or `/signup?plan=pro`
- After signup/login, redirect to `/upgrade?plan=pro` to complete checkout

## Profile Page — Subscription Management

`app/(protected)/profile/profile-form.tsx`:

- Add a "Subscription" section showing current tier + `tier_expires_at` (if cancelled)
- "Cancel subscription" button → calls `POST /api/payments/cancel` → shows confirmation dialog
- Cancellation message: "Your plan stays active until [date]."

## Razorpay SDK Approach

No npm SDK — use `fetch` with HTTP Basic auth (key_id:key_secret) against Razorpay REST API directly. This avoids adding a Node.js-only package that complicates Next.js edge/serverless bundling.

Razorpay API base: `https://api.razorpay.com/v1`

## What Does NOT Change

- `profiles.tier` DB trigger — still the source of truth; only service role writes change it
- Existing tier-gating logic in API routes — unchanged, just add `tier_expires_at` check
- All other profile fields, session logic, AI feedback pipeline

## Verification

1. `npx tsc --noEmit` — no type errors
2. Webhook signature verification rejects tampered payloads
3. `subscription.activated` event sets correct tier in DB
4. `subscription.cancelled` leaves tier active until `tier_expires_at`
5. pg_cron job downgrades expired profiles
6. `/upgrade` page shows correct CTA states per current tier
7. Landing page pricing section opens checkout for logged-in users
8. Upgrade from Student → Pro cancels old subscription and creates new one
