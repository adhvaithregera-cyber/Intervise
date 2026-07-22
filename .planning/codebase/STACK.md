# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**
- TypeScript 5.x - All application code (`.ts`, `.tsx`)

**Secondary:**
- SQL - Supabase migration files in `supabase/migrations/`
- CSS (Tailwind utility classes) - Styling via Tailwind v3

## Runtime

**Environment:**
- Node.js v24.15.0

**Package Manager:**
- npm 11.12.1
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.6 - App Router, Server Components, API Routes
- React 19.2.4 - UI rendering (paired with react-dom 19.2.4)

**Testing:**
- Vitest 4.1.6 - Test runner, configured at `vitest.config.ts`
- @testing-library/react 16.3.2 - Component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers
- jsdom 29.1.1 - Browser environment simulation for tests

**Build/Dev:**
- TypeScript compiler - via `tsconfig.json`, `noEmit: true` (Next.js handles bundling)
- PostCSS - via `postcss.config.mjs` (Tailwind + Autoprefixer pipeline)
- @vitejs/plugin-react 6.0.2 - React plugin for Vitest

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.10.3 - SSR-compatible Supabase auth with cookie handling; used in `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/service.ts`, and `middleware.ts`
- `@supabase/supabase-js` 2.105.4 - Core Supabase client; service client in `lib/supabase/service.ts` bypasses RLS for server-only operations
- `@google/generative-ai` 0.24.1 - Gemini AI SDK used in `lib/aifeedback.ts` (`gemini-2.5-flash` model)
- `zod` 4.4.3 - Runtime input validation for all API routes via `lib/validation.ts`
- `server-only` 0.0.1 - Import guard that prevents server-only modules from being bundled into the client (used in `lib/assemblyai.ts`)

**UI / Interaction:**
- `framer-motion` 12.38.0 - Animations; tree-shaken via `optimizePackageImports` in `next.config.ts`
- `lucide-react` 1.16.0 - Icon library; tree-shaken via `optimizePackageImports`
- `recharts` 3.8.1 - Progress charts (WPM, fillers) on dashboard; tree-shaken via `optimizePackageImports`
- `@number-flow/react` 0.6.0 - Animated number transitions
- `clsx` 2.1.1 + `tailwind-merge` 3.6.0 - Combined into `cn()` utility at `lib/utils.ts`

**Analytics / Monitoring:**
- `posthog-js` 1.376.3 - Client-side analytics
- `posthog-node` 5.35.5 - Server-side event capture (used in `lib/posthog-server.ts` and API routes)
- `@vercel/analytics` 2.0.1 - Vercel's built-in analytics

**Auth / Bot Protection:**
- `@hcaptcha/react-hcaptcha` 2.0.2 - CAPTCHA component
- `hcaptcha` 0.2.0 - Server-side hCaptcha token verification

## Configuration

**TypeScript:**
- `tsconfig.json` — `strict: true`, `target: ES2017`, `moduleResolution: bundler`, path alias `@/*` maps to repo root
- Incremental compilation enabled

**Tailwind:**
- `tailwind.config.ts` — Scans `./pages/**`, `./components/**`, `./app/**`
- Custom brand color palette keyed as `brand.50` through `brand.900`
- Custom font family: `Space Grotesk` (primary sans-serif)

**PostCSS:**
- `postcss.config.mjs` — `tailwindcss` + `autoprefixer` plugins only

**Next.js:**
- `next.config.ts` — Security headers on all routes (`X-Frame-Options: DENY`, HSTS, CSP, Permissions-Policy)
- `productionBrowserSourceMaps: false` — Source maps disabled in production
- `optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts']` — Tree-shaking

**Vitest:**
- `vitest.config.ts` — jsdom environment, globals enabled, setup file at `tests/setup.ts`
- Path alias `@` resolves to repo root matching `tsconfig.json`

**Environment:**
- Template at `.env.example`; actual values in `.env.local` (gitignored)
- Public vars prefixed `NEXT_PUBLIC_` (Supabase URL, Supabase anon key, hCaptcha site key, PostHog key/host)
- Server-only vars (no prefix): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `ASSEMBLYAI_API_KEY`, `GEMINI_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_STUDENT`, `RAZORPAY_PLAN_ID_STUDENT_QUARTERLY`, `RAZORPAY_PLAN_ID_PRO`, `RAZORPAY_PLAN_ID_PRO_QUARTERLY`

## Platform Requirements

**Development:**
- Node.js v24.x
- npm v11.x
- `.env.local` with all required env vars populated

**Production:**
- Vercel (deployed at `intervise.in`)
- Supabase project (Postgres + Auth + RLS)
- All env vars set in Vercel dashboard

---

*Stack analysis: 2026-07-03*
