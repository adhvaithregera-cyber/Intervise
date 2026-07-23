# Intervise — Project Context

## What we're building
Desktop-first AI interview coaching web app. Users learn 8 structured answer formats (STAR, PACE, etc.), record voice answers under a countdown timer, and get AI feedback on filler words, WPM, grammar, STAR scores, and more.

## Tech stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v3
- Supabase SSR auth + Postgres (`@supabase/ssr`)
- AssemblyAI — post-answer audio transcription
- Google Gemini API (`gemini-2.5-flash`) — AI feedback + question generation
- Razorpay — payments (live)
- Vercel — hosting (`intervise.in`)
- Vitest + @testing-library/react — unit tests

## Key env vars (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
ASSEMBLYAI_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
```

## Key files
```
middleware.ts                              Auth guard
app/page.tsx                               Landing page
app/(protected)/dashboard/page.tsx         Session quota, CTA, progress charts
app/(protected)/session/setup/             Difficulty selector + mic permissions
app/(protected)/session/briefing/          Format briefing + session creation
app/(protected)/session/live/              Recorder + countdown timer + question loop
app/(protected)/session/report/[id]/       Full report (grade, WPM, fillers, AI feedback)
app/api/session/transcribe/route.ts        Audio → AssemblyAI → AI feedback → store
app/api/session/complete/route.ts          Marks session complete, sets overall_grade
lib/aifeedback.ts                          generateAnswerFeedback() — Gemini, 8-category rubric
lib/session.ts                             createSession() — question selection + RPC call
lib/questions.ts                           selectAdaptiveQuestions() — TDD'd
lib/analysis.ts                            Filler detection + WPM calculation — TDD'd
lib/scorecard.ts                           Grade styles + computeScorecardStats()
lib/validation.ts                          Zod schemas for all API inputs
types/database.ts                          Profile, Question, Session, Answer, AiFeedback types
supabase/migrations/                       Schema migrations (001–015)
docs/GRADING.md                            Full grading rubric + AI feedback schema
```

## DB summary
Tables: `profiles`, `questions`, `sessions`, `answers`, `question_history`

- `profiles.tier`: `free | student | pro`
- Sessions/month: Free=2, Student=12, Pro=30
- Difficulty gating: Free=Easy only, Student=Easy+Medium, Pro=all
- Category pools: Free=Cat 1+2, Student/Pro=All 8
- Session history: Free=7 days, Student=30 days, Pro=unlimited

## Pricing
| Plan | Price | Sessions/mo | Key features |
|---|---|---|---|
| Free | ₹0 | 2 | Grade, WPM, fillers, blurred AI feedback |
| Student | ₹199 | 12 | Full AI feedback, progress charts, shareable scorecard |
| Pro | ₹499 | 30 | Hard+Mixed difficulty, resume-based Qs, weekly plan |

## Tier rules
- AI feedback always runs; Free users see it with CSS blur overlay
- Progress charts (WPM, fillers): Student+ only
- Shareable PNG scorecard: all tiers
- Hard + Mixed difficulty: Pro only

## Conventions
- Server Components for data fetching, Client Components for interactivity
- API routes for all mutations
- Tier logic always read from DB (`profiles.tier`), never trusted from frontend
- TDD for pure logic functions (vitest)
- Commit after every task
- `cn()` from `@/lib/utils` for className merging
- Glassmorphic design: `rgba(8,13,26,0.75)` bg, `blur(20px)`, gold border `rgba(249,193,37,0.18)`

## UI / Layout rules (strict)
- **No scroll** — every page must fit within the viewport. Use `h-screen` or `h-[calc(100vh-Xrem)]` + `overflow-hidden`. Only allow internal scroll inside a bounded container (e.g. a card's content region) when absolutely unavoidable. Never let the outer page scroll.
- **Fill the screen** — pages should use all available space. Avoid small centred cards floating in a sea of empty background. Cards and panels should stretch to fill remaining height/width.
- **Minimise scroll everywhere** — tighten spacing, reduce padding, keep content compact so that even content-heavy steps/pages don't require scrolling.

## Footer component (`components/ui/minimal-footer.tsx`)
**TODO — Social links to be added:**
- Currently only Instagram: `https://www.instagram.com/intervisehq/`
- All footer links (About, Blog, Help Center, Support, etc.) are placeholders (`#`)
- When you have Twitter, LinkedIn, GitHub, Facebook handles, update the component
- **Reminder:** Ask Claude to update social links when you have the handles

## Upcoming milestones
- M7: Pro dashboard cards (weakness summary + weekly AI plan)
- M9: Resume-based question gen (JD+CV, Pro)
