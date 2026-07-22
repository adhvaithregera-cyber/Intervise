<!-- refreshed: 2026-07-03 -->
# Architecture

**Analysis Date:** 2026-07-03

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                                 │
│  Landing `app/page.tsx`  |  Auth `app/(auth)/`  |  App `app/(protected)/`│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (fetch / form)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router (Vercel Edge)                  │
│                                                                          │
│  middleware.ts — auth guard + onboarding redirect + tier URL control     │
│                                                                          │
│  Server Components (data fetch)  │  Client Components (interactivity)   │
│  `app/(protected)/dashboard/`    │  `app/(protected)/session/live/`     │
│  `app/(protected)/session/       │  `app/(protected)/session/setup/     │
│    report/[id]/page.tsx`         │    setup-client.tsx`                 │
└──────────────┬───────────────────┴──────────────────────────────────────┘
               │ Server Actions / API Routes
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Route Layer                                 │
│  `app/api/session/start/`    `app/api/session/transcribe/`              │
│  `app/api/session/complete/` `app/api/session/name/`                    │
│  `app/api/payments/`         `app/api/dashboard/weakness-summary/`      │
│  `app/api/onboarding/`       `app/api/profile/`                        │
│  `app/api/og/scorecard/[id]/`                                           │
└──────────────┬───────────────────┬─────────────────────────────────────┘
               │                   │
               ▼                   ▼
┌─────────────────────┐  ┌────────────────────────────────────────────────┐
│   lib/ Pure Logic   │  │            External Services                   │
│                     │  │                                                │
│ session.ts          │  │  Supabase Postgres (SSR auth + data)           │
│ questions.ts        │  │  AssemblyAI (audio transcription)              │
│ aifeedback.ts       │  │  Google Gemini API (AI feedback + weakness)    │
│ analysis.ts         │  │  Razorpay (subscriptions / payments)           │
│ weaknesssummary.ts  │  │  PostHog (analytics)                          │
│ scorecard.ts        │  │  Vercel Analytics                              │
│ validation.ts       │  └────────────────────────────────────────────────┘
│ ratelimit.ts        │
│ assemblyai.ts       │
│ razorpay.ts         │
│ utils.ts            │
└─────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Supabase Postgres                                          │
│  profiles · questions · sessions · answers · question_history            │
│  `supabase/migrations/001–019`                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Middleware | Auth guard, onboarding redirect, tier URL control | `middleware.ts` |
| Root Layout | Font (Space Grotesk), PostHog provider, Vercel Analytics | `app/layout.tsx` |
| Landing Page | Marketing, pricing, CTA | `app/page.tsx` |
| Dashboard | Session quota display, recent sessions, progress charts, weakness card | `app/(protected)/dashboard/page.tsx` |
| Session Setup | Difficulty selector, mic permissions | `app/(protected)/session/setup/page.tsx` + `setup-client.tsx` |
| Session Briefing | Format briefing, session creation via API | `app/(protected)/session/briefing/page.tsx` |
| Session Live | Recorder, countdown timer, question loop, per-answer transcription | `app/(protected)/session/live/page.tsx` |
| Session Report | Full report — grade, WPM, fillers, AI feedback (blurred for Free) | `app/(protected)/session/report/[id]/page.tsx` |
| Session Start API | Validates input, calls `createSession()`, returns session + questions | `app/api/session/start/route.ts` |
| Transcribe API | Receives audio blob, calls AssemblyAI, runs analysis + Gemini feedback, stores answer | `app/api/session/transcribe/route.ts` |
| Complete API | Marks session complete, computes `overall_grade`, triggers weakness summary | `app/api/session/complete/route.ts` |
| Payments API | Razorpay subscription creation, webhook, cancel | `app/api/payments/` |
| OG Image API | Generates shareable scorecard PNG via `@vercel/og` | `app/api/og/scorecard/[id]/route.ts` |
| `lib/session.ts` | `createSession()` — quota check, question selection, DB RPC | `lib/session.ts` |
| `lib/questions.ts` | `selectAdaptiveQuestions()` — avoid repeats, shuffle fallback | `lib/questions.ts` |
| `lib/aifeedback.ts` | `generateAnswerFeedback()` — Gemini prompt, 8-category rubric, scoring | `lib/aifeedback.ts` |
| `lib/analysis.ts` | `analyzeAnswer()` — filler detection (10 patterns), WPM calculation | `lib/analysis.ts` |
| `lib/weaknesssummary.ts` | `generateWeaknessSummary()` — Gemini prompt over all session answers | `lib/weaknesssummary.ts` |
| `lib/scorecard.ts` | `computeScorecardStats()`, grade styles, grade-to-colour map | `lib/scorecard.ts` |
| `lib/validation.ts` | Zod schemas for all API inputs — authoritative server-side allowlists | `lib/validation.ts` |
| `lib/ratelimit.ts` | Sliding-window in-memory rate limiter, per-endpoint configs | `lib/ratelimit.ts` |
| `lib/supabase/server.ts` | `createClient()` — SSR Supabase client, request-scoped via `cache()` | `lib/supabase/server.ts` |
| `lib/supabase/client.ts` | Browser Supabase client for Client Components | `lib/supabase/client.ts` |
| `lib/supabase/service.ts` | Service-role client for server-only admin operations | `lib/supabase/service.ts` |
| `types/database.ts` | All DB types: `Profile`, `Question`, `Session`, `Answer`, `AiFeedback`, `Database` | `types/database.ts` |

## Pattern Overview

**Overall:** Next.js App Router — Server Components for data fetching, Client Components only where interactivity requires it. All mutations go through API routes. Tier logic is always sourced from `profiles.tier` in the DB, never from client state.

**Key Characteristics:**
- Route groups (`(auth)`, `(protected)`) separate public and guarded pages without affecting URL paths
- `middleware.ts` is the single enforcement point for auth, onboarding, and tier URL guards
- Pure business logic in `lib/` is framework-agnostic and unit-testable
- Zod validation at every API boundary — schemas in `lib/validation.ts` are the single source of truth
- In-memory sliding-window rate limiting per `userId:endpoint` in `lib/ratelimit.ts`
- AI features (Gemini) always execute server-side; Free users see blurred output via CSS overlay, not different API behaviour

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle browser interaction
- Location: `app/` (pages), `components/`
- Contains: Server Components (data fetch + render), Client Components (`'use client'` for state/events)
- Depends on: API routes for mutations, `lib/supabase/server.ts` for reads in Server Components
- Used by: End users via browser

**API Layer:**
- Purpose: Handle all mutations and protected data operations
- Location: `app/api/`
- Contains: Route handlers, Zod validation, rate limiting, calls to `lib/` functions
- Depends on: `lib/`, `types/database.ts`, external SDKs
- Used by: Client Components (fetch), middleware

**Business Logic Layer:**
- Purpose: Pure, testable logic — no framework coupling
- Location: `lib/`
- Contains: Session orchestration, question selection, AI feedback generation, text analysis, grading, Supabase client factories
- Depends on: `types/database.ts`, external SDKs (Gemini, AssemblyAI, Razorpay)
- Used by: API routes, occasionally Server Components directly for reads

**Data Layer:**
- Purpose: Postgres schema, RLS policies, and migrations
- Location: `supabase/migrations/`
- Contains: 019 sequential SQL migrations (001–019)
- Depends on: Supabase hosted Postgres
- Used by: `lib/supabase/` client factories

## Data Flow

### Session Creation (setup → briefing → live)

1. User selects difficulty on `app/(protected)/session/setup/setup-client.tsx` (Client Component)
2. Briefing page (`app/(protected)/session/briefing/page.tsx`) POST to `app/api/session/start/route.ts`
3. `start` route validates input with `sessionStartSchema` (`lib/validation.ts`), calls `createSession()` (`lib/session.ts`)
4. `createSession()` checks quota from `profiles.sessions_used_this_month`, fetches cached questions via `getCachedQuestions()` (`lib/session.ts`), calls `selectAdaptiveQuestions()` (`lib/questions.ts`)
5. Session row inserted in DB; session ID + questions returned to client
6. Client navigates to `app/(protected)/session/live/page.tsx` with session ID in sessionStorage

### Per-Answer Transcription Flow

1. `app/(protected)/session/live/page.tsx` (Client Component) records audio with MediaRecorder
2. On answer end, audio Blob POST to `app/api/session/transcribe/route.ts`
3. Rate limit checked (`lib/ratelimit.ts`), tier verified from DB
4. `transcribeAudio()` (`lib/assemblyai.ts`) sends audio to AssemblyAI, returns transcript
5. `analyzeAnswer()` (`lib/analysis.ts`) computes WPM + filler breakdown from transcript
6. `generateAnswerFeedback()` (`lib/aifeedback.ts`) sends transcript + question metadata to Gemini with 8-category rubric, returns structured `AiFeedback`
7. Answer row stored in `answers` table with transcript, WPM, filler counts, `ai_feedback` JSON

### Session Completion

1. Live page POST to `app/api/session/complete/route.ts` with `session_id`
2. Complete route loads all answers for session, computes `overall_grade` (AI score preferred; WPM/filler heuristic fallback)
3. `generateWeaknessSummary()` (`lib/weaknesssummary.ts`) calls Gemini with all answer summaries; result stored on `profiles.weakness_summary`
4. Session row updated: `status = 'complete'`, `overall_grade` set, `completed_at` timestamp
5. Client redirects to `app/(protected)/session/report/[id]/page.tsx`

### Report Display

1. `report/[id]/page.tsx` (Server Component) fetches session + answers from Supabase
2. AI feedback displayed per answer; Free tier sees `ai_feedback` field behind CSS blur overlay
3. Shareable scorecard PNG generated on demand at `app/api/og/scorecard/[id]/route.ts`

**State Management:**
- No global client state store (no Redux/Zustand)
- Session flow state passed via `sessionStorage` between live page questions
- Server Components read DB directly; Client Components receive data as props or fetch from API routes
- Supabase session cookie managed by `@supabase/ssr` — refreshed via middleware

## Key Abstractions

**`AiFeedback` type:**
- Purpose: Structured Gemini response for a single answer — grade (A–F), score (0–100), component scores, delivery scores, coaching tip
- File: `types/database.ts` (type), `lib/aifeedback.ts` (generation)
- Pattern: Stored as JSONB in `answers.ai_feedback`; typed end-to-end via `AiFeedback`

**`createSession()` result union:**
- Purpose: Discriminated union — success returns `{ sessionId, questions, tier }`, failure returns `{ error: string }`
- File: `lib/session.ts`
- Pattern: Callers must narrow on `'error' in result` before using session fields

**Glassmorphic design tokens:**
- Purpose: Visual consistency — dark navy glass cards used across all app screens
- Pattern: Inline style objects (not Tailwind classes) with values:
  - Background: `rgba(8,13,26,0.75)`
  - Backdrop filter: `blur(16px)` or `blur(20px)`
  - Border: `rgba(249,193,37,0.18)` to `rgba(249,193,37,0.20)` (gold)
- Examples: `app/(protected)/dashboard/page.tsx` (`CARD_STYLE`), `app/(protected)/session/live/page.tsx` (`glassCard`), `app/(protected)/session/report/[id]/page.tsx` (`PANEL`)

**Tier gating:**
- Free: 2 sessions/month, Easy difficulty only, categories 1–2, AI feedback visible with CSS blur
- Student: 12 sessions/month, Easy + Medium, all 8 categories, full AI feedback
- Pro: 30 sessions/month, all difficulties (Hard + Mixed), all 8 categories, weakness summary card
- Enforcement: `middleware.ts` (URL-level), API routes (operation-level), Server Components (render-level)

## Entry Points

**Root layout:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Space Grotesk font, PostHog analytics provider, Vercel Analytics

**Middleware:**
- Location: `middleware.ts`
- Triggers: All requests except `_next/static`, `_next/image`, `favicon.ico`, `api/`, and static assets
- Responsibilities: Auth check via Supabase SSR, onboarding redirect, tier URL guard, auth page redirect for logged-in users

**Auth callback:**
- Location: `app/auth/callback/`
- Triggers: Supabase OAuth redirect with `?code=` param
- Responsibilities: Exchange code for session, redirect to dashboard or onboarding

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop on Vercel serverless functions; no worker threads
- **Global state:** `lib/ratelimit.ts` holds a module-level `Map` (`windows`) — resets on cold start; not shared across Vercel function instances or regions
- **Question cache:** `getCachedQuestions()` in `lib/session.ts` uses Next.js `unstable_cache` with 1-hour revalidation; bypasses RLS using service role key — server-only
- **Circular imports:** None detected
- **Tier source of truth:** Always `profiles.tier` from DB; never trust frontend-supplied tier values
- **Free-tier AI:** Gemini always runs for all tiers; Free users see results with CSS `filter: blur(...)` overlay — no separate code path in `aifeedback.ts`

## Anti-Patterns

### Passing tier from frontend

**What happens:** Client POSTs `{ difficulty, tier }` and server trusts the tier field.
**Why it's wrong:** Users can forge their tier and unlock paid features.
**Do this instead:** Always read `profiles.tier` from Supabase inside the API route, as done in `app/api/session/start/route.ts` via `createSession()` in `lib/session.ts`.

### Adding rate-limit state to a shared module

**What happens:** Storing per-user counters in module-level variables beyond `lib/ratelimit.ts`.
**Why it's wrong:** Vercel serverless instances are ephemeral and not shared — state is invisible across concurrent instances.
**Do this instead:** Keep rate limiting in `lib/ratelimit.ts` and note its warm-instance limitation; for strict enforcement, migrate to Upstash Redis as documented in `lib/ratelimit.ts` comments.

### Mutating data in Server Components

**What happens:** Calling `supabase.from(...).insert(...)` directly inside a Server Component's render.
**Why it's wrong:** Server Components re-render on every request; side effects belong in API routes.
**Do this instead:** Issue a `fetch` to the relevant `app/api/` route handler, or use a Server Action.

## Error Handling

**Strategy:** API routes return typed JSON error objects with HTTP status codes. Client Components display error state inline.

**Patterns:**
- API routes return `{ error: string }` on failure with appropriate 4xx/5xx status
- `createSession()` returns a discriminated union with `{ error: 'quota_exceeded' | 'difficulty_not_allowed' | ... }` — no thrown exceptions
- `analyzeAnswer()` returns `null` WPM when there are too few words rather than throwing
- Transcription failures are stored as `transcription_failed: true` on the answer row — session can still complete
- Zod parse failures use `safeParse` and return `{ error, details }` with HTTP 400

## Cross-Cutting Concerns

**Logging:** No structured logging framework — relies on Vercel function logs (`console.error` for unexpected failures). PostHog captures custom events client-side.
**Validation:** Zod schemas in `lib/validation.ts` applied at every API route entry point. MIME-type and size checks for audio uploads in `lib/validation.ts` (`ALLOWED_AUDIO_MIME_TYPES`, `MAX_AUDIO_SIZE_BYTES`).
**Authentication:** Supabase SSR (`@supabase/ssr`) — cookie-based session managed by middleware. `createClient()` in `lib/supabase/server.ts` is request-scoped via React `cache()`.
**Analytics:** PostHog via `components/posthog-provider.tsx` + `lib/posthog-server.ts`; Vercel Analytics in root layout.

---

*Architecture analysis: 2026-07-03*
