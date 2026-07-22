# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**AI / Machine Learning:**
- Google Gemini (`gemini-2.5-flash`) - Answer feedback generation and grading (8-category rubric, A–F scoring)
  - SDK/Client: `@google/generative-ai` 0.24.1
  - Implementation: `lib/aifeedback.ts` — `generateAnswerFeedback()` function
  - Auth: `GEMINI_API_KEY` env var (server-only, never `NEXT_PUBLIC_`)
  - Called from: `app/api/session/transcribe/route.ts`

- AssemblyAI (v2 REST API) - Post-answer audio transcription
  - SDK/Client: Direct `fetch` calls to `https://api.assemblyai.com/v2` (no official SDK dependency)
  - Implementation: `lib/assemblyai.ts` — `transcribeAudio()` function; upload → request → poll pattern
  - Auth: `ASSEMBLYAI_API_KEY` env var (server-only); file is guarded by `import 'server-only'`
  - Model: `universal-2` speech model
  - Polling: up to 25 polls × 1500ms = ~37.5s (fits Vercel function timeout)
  - Called from: `app/api/session/transcribe/route.ts`

**Bot Protection:**
- hCaptcha - Signup/login bot protection
  - Client component: `@hcaptcha/react-hcaptcha` 2.0.2
  - Server verification: `hcaptcha` 0.2.0 package
  - Auth: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` (public, client-side); secret key configured directly in Supabase Dashboard (Auth → Bot & Abuse Protection), NOT in `.env`

**Analytics:**
- PostHog - Product analytics (both client and server)
  - Client-side: `posthog-js` 1.376.3 (page events, user identification)
  - Server-side: `posthog-node` 5.35.5 via `lib/posthog-server.ts` — `getPostHogClient()`
  - Events captured from API routes: `subscription_activated`, `subscription_charged`, `subscription_cancelled`, `subscription_halted`, `subscription_completed`
  - Auth: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://us.i.posthog.com`)

- Vercel Analytics - Hosting-level analytics
  - Package: `@vercel/analytics` 2.0.1
  - No configuration required beyond import

## Data Storage

**Databases:**
- Supabase Postgres - Primary database (all application data)
  - Tables: `profiles`, `questions`, `sessions`, `answers`, `question_history`
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client/SSR); `SUPABASE_SERVICE_ROLE_KEY` (server-only mutations)
  - DB password: `SUPABASE_DB_PASSWORD` (direct Postgres access/migrations)
  - Client variants:
    - Browser: `lib/supabase/client.ts` — `createBrowserClient()` with anon key
    - Server Components / middleware: `lib/supabase/server.ts` — `createServerClient()` with React `cache()` deduplication
    - API routes / webhooks (RLS bypass): `lib/supabase/service.ts` — `createServiceClient()` with service role key
  - RLS: Enabled; service client bypasses RLS for server-side operations only
  - Schema migrations: `supabase/migrations/001_initial_schema.sql` through `supabase/migrations/019_question_bank_overhaul.sql`

**File Storage:**
- Not applicable — audio blobs are streamed directly to AssemblyAI upload endpoint and are not stored in application storage

**Caching:**
- In-memory only — `lib/ratelimit.ts` uses a `Map<string, number[]>` sliding-window rate limiter
- Note: This is warm-instance only; cold starts reset the window. No distributed cache (Redis/Upstash) is configured.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password + OAuth
  - Implementation: `@supabase/ssr` cookie-based session management
  - Middleware guard: `middleware.ts` — calls `supabase.auth.getUser()` on every non-static request
  - Session refresh: Handled by middleware via `setAll` cookie callback
  - Protected routes: All routes under `/(protected)/` and `/session/`
  - Onboarding guard: Middleware checks `profiles.onboarding_complete` and redirects to `/onboarding` if false
  - Tier access control: Middleware reads `profiles.tier` to gate session paths
  - hCaptcha bot protection: Configured in Supabase Dashboard for signup/login

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or equivalent configured)
- Errors logged to `console.error()` in API routes and lib files

**Logs:**
- `console.error()` for error paths throughout `lib/assemblyai.ts`, `lib/razorpay.ts`, and API routes
- Prefixed log format used: `[assemblyai]`, `[webhook]` — e.g., `console.error('[assemblyai] upload HTTP ${status}:', body)`
- PostHog server events serve as a lightweight audit trail for subscription lifecycle

## CI/CD & Deployment

**Hosting:**
- Vercel (`intervise.in`)
- Production URL: `https://intervise.in`

**CI Pipeline:**
- Not detected (no `.github/workflows/` or similar config found)

**Function Limits:**
- `app/api/session/transcribe/route.ts` sets `export const maxDuration = 120` to accommodate AssemblyAI polling (up to 37.5s)

## Payments

**Payment Provider:**
- Razorpay - Subscription billing (live in production)
  - Client: Direct `fetch` calls to `https://api.razorpay.com/v1` (no official SDK dependency)
  - Implementation: `lib/razorpay.ts`
    - `createRazorpaySubscription(planId)` — creates a subscription (120-cycle max, quantity 1)
    - `cancelRazorpaySubscription(subscriptionId, cancelAtCycleEnd)` — cancel at end of period or immediately
    - `verifyRazorpayWebhookSignature(rawBody, signature, secret)` — HMAC-SHA256 timing-safe comparison
    - `planIdToTier(planId)` — maps plan IDs to app tiers (`student` | `pro`)
  - Auth: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (Basic Auth header), `RAZORPAY_WEBHOOK_SECRET` (webhook HMAC)
  - Plan IDs: `RAZORPAY_PLAN_ID_STUDENT`, `RAZORPAY_PLAN_ID_STUDENT_QUARTERLY`, `RAZORPAY_PLAN_ID_PRO`, `RAZORPAY_PLAN_ID_PRO_QUARTERLY`
  - Client-side checkout: Razorpay JS loaded from `https://cdn.razorpay.com` (whitelisted in CSP)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/payments/webhook` (`app/api/payments/webhook/route.ts`) — Razorpay subscription lifecycle events
  - Handled events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `subscription.completed`
  - Signature verification: HMAC-SHA256 via `verifyRazorpayWebhookSignature()` on raw request body
  - IP-level rate limit: 60 requests/minute per IP (guards against signature-flood attacks)
  - On `subscription.halted`: immediately downgrades user tier to `free`
  - On `subscription.cancelled`: keeps tier active until `tier_expires_at`
  - All lifecycle events emit PostHog server-side analytics events

- `/auth/callback` (`app/auth/`) — Supabase OAuth callback; also handles `?code=` redirect from site root in `middleware.ts`

**Outgoing:**
- AssemblyAI webhooks: Not used. The implementation uses synchronous polling (`lib/assemblyai.ts`) instead of webhooks.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project REST endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (bypasses RLS; server-only)
- `SUPABASE_DB_PASSWORD` — Direct Postgres password for migrations
- `ASSEMBLYAI_API_KEY` — AssemblyAI REST API key (server-only)
- `GEMINI_API_KEY` — Google Gemini API key (server-only)
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — hCaptcha publishable site key
- `RAZORPAY_KEY_ID` — Razorpay API key ID (server-only)
- `RAZORPAY_KEY_SECRET` — Razorpay API key secret (server-only)
- `RAZORPAY_WEBHOOK_SECRET` — Razorpay webhook HMAC secret (server-only)
- `RAZORPAY_PLAN_ID_STUDENT` — Razorpay plan ID for Student monthly
- `RAZORPAY_PLAN_ID_STUDENT_QUARTERLY` — Razorpay plan ID for Student quarterly
- `RAZORPAY_PLAN_ID_PRO` — Razorpay plan ID for Pro monthly
- `RAZORPAY_PLAN_ID_PRO_QUARTERLY` — Razorpay plan ID for Pro quarterly
- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog ingest host (defaults to `https://us.i.posthog.com`)

**Secrets location:**
- `.env.local` (gitignored) for local development
- Vercel environment variables dashboard for production
- hCaptcha secret key is stored in Supabase Dashboard only — not in `.env`

---

*Integration audit: 2026-07-03*
