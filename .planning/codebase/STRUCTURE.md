# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
intervise/
├── app/                          # Next.js App Router — all pages and API routes
│   ├── (auth)/                   # Route group: public auth pages (no layout wrapper)
│   │   ├── login/                # Login page
│   │   └── signup/               # Signup page
│   ├── (protected)/              # Route group: authenticated pages (middleware enforced)
│   │   ├── dashboard/            # Main hub — quota, recent sessions, charts, weakness
│   │   ├── onboarding/           # First-time user profile collection
│   │   ├── profile/              # Profile edit
│   │   ├── session/              # Interview session flow
│   │   │   ├── setup/            # Difficulty selector + mic permissions
│   │   │   ├── briefing/         # Format briefing + session creation
│   │   │   ├── live/             # Recorder, countdown timer, question loop
│   │   │   └── report/[id]/      # Full post-session report
│   │   ├── unauthorized/         # Tier access denied page
│   │   └── upgrade/              # Upgrade / pricing page
│   ├── api/                      # API route handlers (all mutations)
│   │   ├── session/
│   │   │   ├── start/            # POST — create session + select questions
│   │   │   ├── transcribe/       # POST — audio → transcript → AI feedback → store
│   │   │   ├── complete/         # POST — grade session, trigger weakness summary
│   │   │   └── name/             # POST — rename session
│   │   ├── payments/
│   │   │   ├── create-subscription/  # POST — Razorpay subscription creation
│   │   │   ├── webhook/              # POST — Razorpay webhook (signature verified)
│   │   │   └── cancel/               # POST — cancel subscription
│   │   ├── dashboard/
│   │   │   └── weakness-summary/     # POST — on-demand weakness summary generation
│   │   ├── og/
│   │   │   └── scorecard/[id]/       # GET — shareable scorecard OG image (PNG)
│   │   ├── onboarding/               # POST — save onboarding profile data
│   │   └── profile/                  # POST — update profile fields
│   ├── auth/
│   │   └── callback/                 # Supabase OAuth code exchange
│   ├── privacy/                      # Privacy policy page
│   ├── terms/                        # Terms of service page
│   ├── globals.css                   # Tailwind base + custom global styles
│   ├── layout.tsx                    # Root layout — font, PostHog, Vercel Analytics
│   ├── not-found.tsx                 # 404 page
│   ├── page.tsx                      # Landing / marketing page
│   └── sitemap.ts                    # Next.js sitemap generator
├── components/                   # Shared React components
│   ├── layout/                   # Layout components (nav, shell)
│   ├── session/                  # Session-specific components
│   │   └── share-scorecard.tsx   # Scorecard share / download button
│   └── ui/                       # UI primitives and landing section components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── fade-in.tsx
│       ├── hero-section.tsx
│       ├── pricing-section.tsx
│       └── ...                   # Other landing page sections
├── hooks/                        # Custom React hooks
│   └── use-razorpay-checkout.ts  # Razorpay checkout hook
├── lib/                          # Pure business logic — no React coupling
│   ├── supabase/
│   │   ├── server.ts             # SSR Supabase client (request-scoped via cache())
│   │   ├── client.ts             # Browser Supabase client
│   │   └── service.ts            # Service-role client for admin operations
│   ├── aifeedback.ts             # generateAnswerFeedback() — Gemini, 8-category rubric
│   ├── analysis.ts               # analyzeAnswer() — filler detection, WPM
│   ├── assemblyai.ts             # transcribeAudio() — AssemblyAI integration
│   ├── questions.ts              # selectAdaptiveQuestions() — avoid repeats, shuffle
│   ├── ratelimit.ts              # checkRateLimit() — sliding-window in-memory limiter
│   ├── razorpay.ts               # Razorpay SDK helpers
│   ├── scorecard.ts              # computeScorecardStats(), GRADE_STYLE map
│   ├── session.ts                # createSession() — quota check, question fetch, DB insert
│   ├── utils.ts                  # cn() className merger (clsx + tailwind-merge)
│   ├── validation.ts             # Zod schemas for all API inputs
│   ├── weaknesssummary.ts        # generateWeaknessSummary() — Gemini over session answers
│   ├── posthog-server.ts         # Server-side PostHog client
│   └── __tests__/                # Unit tests for lib/ functions
├── types/
│   ├── database.ts               # All DB types: Profile, Question, Session, Answer, AiFeedback, Database
│   ├── razorpay.d.ts             # Razorpay global type declarations
│   └── speech.d.ts               # Web Speech API type declarations
├── tests/
│   └── components/
│       └── session/              # Component-level tests
├── supabase/
│   └── migrations/               # Sequential SQL migrations (001–019)
│       ├── 001_*.sql             # Initial schema
│       ├── ...
│       └── 019_question_bank_overhaul.sql
├── public/                       # Static assets
│   ├── screenshots/              # App screenshots (used in landing)
│   └── og-image.png              # Default OpenGraph image
├── docs/                         # Internal documentation
│   ├── GRADING.md                # Full grading rubric + AI feedback schema
│   └── superpowers/              # GSD planning docs
├── .planning/
│   └── codebase/                 # Codebase map documents (this directory)
├── middleware.ts                  # Auth guard + onboarding redirect + tier URL control
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS v3 configuration
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Vitest test runner configuration
└── package.json                   # Dependencies and scripts
```

## Directory Purposes

**`app/(auth)/`:**
- Purpose: Public authentication pages — login and signup
- Contains: Server Components with Supabase auth form logic
- Key files: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

**`app/(protected)/`:**
- Purpose: All pages requiring authentication — enforced by `middleware.ts`
- Contains: Dashboard, session flow (setup → briefing → live → report), profile, upgrade, onboarding
- Key files: `app/(protected)/dashboard/page.tsx`, `app/(protected)/session/live/page.tsx`

**`app/api/`:**
- Purpose: All data mutations — no mutations should happen in Server Components
- Contains: Next.js Route Handlers (`route.ts`), each with Zod validation, rate limiting, auth check
- Key files: `app/api/session/start/route.ts`, `app/api/session/transcribe/route.ts`, `app/api/session/complete/route.ts`

**`lib/`:**
- Purpose: Pure, framework-agnostic business logic — safe to unit test without Next.js
- Contains: AI integration, text analysis, session orchestration, Supabase client factories, validation schemas, rate limiter
- Key files: `lib/aifeedback.ts`, `lib/session.ts`, `lib/analysis.ts`, `lib/validation.ts`

**`lib/supabase/`:**
- Purpose: Three Supabase client factories for different execution contexts
- `server.ts` — SSR client used in Server Components and API routes (cookie-based, request-scoped)
- `client.ts` — browser client used in Client Components
- `service.ts` — service-role client for admin/bypass-RLS operations (server-only)

**`components/ui/`:**
- Purpose: Reusable UI primitives and landing page section components
- Contains: `button.tsx`, `badge.tsx`, `card.tsx`, `fade-in.tsx`, landing sections

**`components/session/`:**
- Purpose: Session-specific shared components
- Contains: `share-scorecard.tsx` (scorecard share/download)

**`components/layout/`:**
- Purpose: App shell layout components (navigation etc.)

**`hooks/`:**
- Purpose: Custom React hooks used in Client Components
- Key files: `hooks/use-razorpay-checkout.ts`

**`types/`:**
- Purpose: TypeScript type definitions — single source of truth for DB shapes
- Key files: `types/database.ts` (all DB types + `Database` interface)

**`supabase/migrations/`:**
- Purpose: Ordered SQL migration files applied via Supabase CLI
- Contains: 019 migrations (001 = initial schema through 019 = question bank overhaul)
- Generated: No — hand-authored
- Committed: Yes

**`lib/__tests__/`:**
- Purpose: Unit tests for pure `lib/` functions
- Generated: No
- Key coverage: `lib/analysis.ts`, `lib/questions.ts`

## Key File Locations

**Entry Points:**
- `middleware.ts`: Auth + onboarding + tier guard — runs before every non-static request
- `app/layout.tsx`: Root HTML shell, font, analytics providers
- `app/page.tsx`: Landing/marketing page (public)
- `app/auth/callback/`: Supabase OAuth callback handler

**Configuration:**
- `next.config.ts`: Next.js config (image domains, etc.)
- `tailwind.config.ts`: Tailwind CSS v3 theme extensions
- `tsconfig.json`: TypeScript path aliases (`@/` → project root)
- `vitest.config.ts`: Test runner config

**Core Logic:**
- `lib/session.ts`: `createSession()` — the main session orchestration function
- `lib/aifeedback.ts`: `generateAnswerFeedback()` — 8-category Gemini rubric
- `lib/analysis.ts`: `analyzeAnswer()` — WPM + filler word detection
- `lib/validation.ts`: All Zod schemas — single source of truth for API input shapes
- `lib/ratelimit.ts`: `checkRateLimit()` — per-endpoint sliding-window limiter

**Type Definitions:**
- `types/database.ts`: `Profile`, `Question`, `Session`, `Answer`, `AiFeedback`, `QuestionHistory`, `Database`

**Testing:**
- `lib/__tests__/`: Unit tests for pure lib functions
- `tests/components/session/`: Component-level tests
- `vitest.config.ts`: Runner configuration

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Client Component variants: `[name]-client.tsx` (e.g., `setup-client.tsx`, `charts-client.tsx`)
- API routes: `route.ts` (Next.js convention)
- Lib modules: `camelCase.ts` (e.g., `aifeedback.ts`, `weaknesssummary.ts`, `ratelimit.ts`)
- UI components: `kebab-case.tsx` (e.g., `share-scorecard.tsx`, `fade-in.tsx`)

**Directories:**
- Route groups: `(groupname)` — parentheses, lowercase (e.g., `(auth)`, `(protected)`)
- Dynamic segments: `[param]` — e.g., `report/[id]/`
- Feature directories: `lowercase` (e.g., `session/`, `payments/`)

**Exports:**
- Named exports preferred for lib functions: `export function createSession(...)`
- Default exports for page/layout components: `export default function DashboardPage(...)`

## Where to Add New Code

**New protected page:**
- Implementation: `app/(protected)/[feature-name]/page.tsx`
- Client sub-components: `app/(protected)/[feature-name]/[component]-client.tsx`
- Keep data fetching in the Server Component (`page.tsx`); extract interactive parts to `*-client.tsx`

**New API route:**
- Implementation: `app/api/[area]/[action]/route.ts`
- Always: auth check → rate limit (`lib/ratelimit.ts`) → Zod validation (`lib/validation.ts`) → business logic
- Add rate limit config entry to `RATE_LIMITS` in `lib/ratelimit.ts`
- Add Zod schema to `lib/validation.ts`

**New pure business logic:**
- Implementation: `lib/[featurename].ts`
- Unit tests: `lib/__tests__/[featurename].test.ts`
- Keep free of Next.js imports — use standard Node.js / TypeScript only

**New DB type:**
- Add to `types/database.ts` following the existing `Profile` / `Session` / `Answer` pattern
- Add migration: `supabase/migrations/[NNN]_[description].sql` (increment NNN)

**New shared UI component:**
- Reusable primitive: `components/ui/[component-name].tsx`
- Session-specific: `components/session/[component-name].tsx`
- Layout: `components/layout/[component-name].tsx`
- Use `cn()` from `lib/utils.ts` for conditional className merging

**New hook:**
- Implementation: `hooks/use-[feature-name].ts`

**New Gemini AI feature:**
- Implement in `lib/` (e.g., a new `lib/[feature]ai.ts`)
- Use `new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)` and model `gemini-2.5-flash`
- Call from an API route, not from a Server Component render

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes — by `/gsd:map-codebase`
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning artifacts (phase plans, specs)
- Generated: Yes
- Committed: Yes

**`supabase/migrations/`:**
- Purpose: Sequential SQL schema migrations
- Generated: No — hand-authored
- Committed: Yes
- Naming: `[NNN]_[description].sql` where NNN is zero-padded (e.g., `019_...`)

**`public/`:**
- Purpose: Static assets served at root URL
- Generated: No (screenshots and OG image are hand-placed)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-07-03*
