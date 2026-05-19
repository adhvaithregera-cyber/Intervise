# Intervise — Project Context

## What we're building
Desktop-first AI interview coaching web app. Users learn 8 structured answer formats (STAR, PACE, etc.), record voice answers under a countdown timer, and get AI feedback on filler words, WPM, grammar, STAR scores, and more.

## Tech stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v3
- Supabase SSR auth + Postgres (`@supabase/ssr`)
- AssemblyAI — post-answer audio transcription
- Anthropic Claude API (`claude-haiku-4-5-20251001`) — AI feedback + question generation
- MediaPipe FaceMesh — in-browser eye contact (Student+ only, future)
- Razorpay — payments (scaffolded, inactive)
- Resend — transactional email sequences
- Vercel — hosting (`intervise-ashen.vercel.app`)
- Vitest + @testing-library/react — unit tests

## Key env vars (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
ASSEMBLYAI_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
```

## Routes
| Route | Auth | Status |
|---|---|---|
| `/` | No | Done |
| `/signup` | No | Done |
| `/login` | No | Done |
| `/auth/callback` | No | Done |
| `/onboarding` | Yes | Done |
| `/dashboard` | Yes | Done |
| `/session/setup` | Yes | Done |
| `/session/briefing` | Yes | Done |
| `/session/live` | Yes | Done |
| `/session/report/[id]` | Yes | Done |
| `/progress` | Yes | Planned (Pro only) |

## Key files
```
middleware.ts                              Auth guard (Next.js 16 middleware)
app/layout.tsx                             Root layout (Inter font, metadata)
app/page.tsx                               Landing page
app/(auth)/layout.tsx                      Centered card, no navbar
app/(auth)/signup/page.tsx                 Email + Google OAuth signup + hCaptcha
app/(auth)/login/page.tsx                  Email + Google OAuth login + hCaptcha
app/auth/callback/route.ts                 OAuth code exchange
app/(protected)/layout.tsx                 Navbar + main wrapper (orange gradient bg)
app/(protected)/onboarding/page.tsx        4-step wizard (name/age, role, date/weakness, preferences)
app/(protected)/dashboard/page.tsx         Session quota, CTA, recent sessions
app/(protected)/session/setup/             Difficulty selector + mic/camera permissions
app/(protected)/session/briefing/          Format briefing card before session starts
app/(protected)/session/live/              Recorder + countdown timer + question loop
app/(protected)/session/report/[id]/       Full report dashboard (grade, WPM, fillers, Q&A cards)
app/api/onboarding/route.ts                POST: saves profile, sets onboarding_complete
app/api/session/start/route.ts             POST: creates session row, selects questions
app/api/session/transcribe/route.ts        POST: audio → AssemblyAI → store answer + run AI feedback
app/api/session/complete/route.ts          POST: marks session complete, generates session summary
lib/supabase/client.ts                     Browser Supabase client
lib/supabase/server.ts                     Server Supabase client (async cookies)
lib/questions.ts                           selectAdaptiveQuestions() — TDD'd
lib/analysis.ts                            filler detection + WPM calculation — TDD'd
lib/assemblyai.ts                          AssemblyAI transcription client
lib/utils.ts                               cn() helper
lib/ratelimit.ts                           In-memory rate limiter
lib/validation.ts                          Zod schemas for all API inputs
types/database.ts                          Profile, Question, Session, Answer types
components/ui/button.tsx                   Button (primary/outline/ghost, sm/md/lg)
components/ui/card.tsx                     Card (optional tinted prop)
components/ui/badge.tsx                    Badge (brand/gray/green/red/amber)
components/ui/fade-in.tsx                  FadeIn animation wrapper
components/layout/navbar.tsx               Async server component navbar
supabase/migrations/                       All schema migrations (001–008)
supabase/seed.sql                          75 questions seeded across 8 categories
```

## DB tables
See `docs/DATABASE.md` for full schema. Summary:

`profiles`, `questions`, `sessions`, `answers`, `question_history`

- `profiles.tier`: `free | student | pro`
- Sessions/month: Free=2, Student=12, Pro=30
- Session history: Free=7 days, Student=30 days, Pro=unlimited
- Difficulty gating: Free=Easy only, Student=Easy+Medium, Pro=Easy+Medium+Hard+Mixed
- Question counts per session: Free=5 (DB only), Student=5 DB + 2 AI, Pro=5 DB + 3 AI
- Full personalisation tokens: Pro only, 8/month (all 5 questions AI-generated)
- Category pools: Free=Cat 1+2, Student/Pro=All 8
- Adaptive question selection: unasked first, fallback to asked pool

## Pricing
| Plan | Price | Sessions/mo | Key features |
|---|---|---|---|
| Free | ₹0 | 2 | Grade, WPM, fillers, blurred STAR scores |
| Student | ₹199 | 12 | Full AI feedback, shareable scorecard, 2 AI Qs/session |
| Pro | ₹499 | 30 | Progress charts, weekly plan, resume-based Qs, 3 AI Qs + 8 tokens/mo |

## Feature → Tier Matrix (source of truth)
See `docs/DATABASE.md` for the full matrix. Key rules:
- AI feedback always runs; Free users see STAR scores / ideal answer with CSS blur overlay
- WPM gauge: Slow (<110) / Ideal (110–160) / Fast (>160) — all tiers
- Eye contact % and head stability: Student+ (future, MediaPipe)
- Progress trend charts (WPM, fillers, format compliance): Pro only → `/progress`
- Weakness pattern summary + weekly AI plan: Pro only, shown as dashboard cards
- Shareable PNG scorecard: Student+
- Resume-based question gen (JD+CV): Pro only
- Email sequences (D0, D2, D5, D14): all tiers via Resend

## Conventions
- One task at a time, user confirms before each milestone
- Server Components for data fetching, Client Components for interactivity
- API routes for all mutations
- Tier logic always read from DB (`profiles.tier`), never computed or trusted from frontend
- TDD for pure logic functions (vitest)
- Commit after every task
- `cn()` from `@/lib/utils` for className merging
- Glassmorphic design: `rgba(28,10,0,0.75)` bg, `blur(20px)`, gold border `rgba(249,193,37,0.18)`
- Orange gradient background in protected layout: `#E07A2F` base + radial gold glow

## Upcoming milestones (in order)
1. ~~M1: CLAUDE.md + DATABASE.md docs~~ ✅
2. M2: Structural tier fixes (question counts, category pools, difficulty gating)
3. M3: WPM gauge label (Slow/Ideal/Fast) on report
4. M4: AI feedback pipeline (Claude API, per-answer + session summary)
5. M5: AI question personalisation (Student: 2 AI Qs, Pro: 3 AI Qs + tokens)
6. M6: Progress charts page (Pro, Recharts)
7. M7: Pro dashboard cards (weakness summary + weekly AI plan)
8. M8: Shareable score card PNG (@vercel/og)
9. M9: Resume-based question gen (JD+CV, Pro)
10. M10: Email sequences (Resend, D0/D2/D5/D14)
