# Intervise — Project Context

## What we're building
Desktop-first AI interview coaching web app. Users learn 8 structured answer formats (STAR, PACE, etc.), record voice answers under a countdown timer, and get instant feedback on filler words and WPM. MVP = full session loop without Claude scoring.

## Tech stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v3
- Supabase SSR auth + Postgres (`@supabase/ssr`)
- AssemblyAI — post-answer audio transcription
- MediaPipe FaceMesh — in-browser eye contact (Student+ only)
- Razorpay — payments (scaffolded, inactive in MVP)
- Vercel — hosting (`intervise.vercel.app`)
- Vitest + @testing-library/react — unit tests

## Key env vars (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_DB_PASSWORD=<your-db-password>
ASSEMBLYAI_API_KEY=<not set yet>
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
| `/session/setup` | Yes | Plan B Task 5 |
| `/session/briefing` | Yes | Plan B Task 6 |
| `/session/live` | Yes | Plan B Task 7 |
| `/session/report/[id]` | Yes | Plan B Task 8 |

## Key files
```
proxy.ts                          Auth guard (Next.js 16 "proxy" convention)
app/layout.tsx                    Root layout (Inter font, metadata)
app/page.tsx                      Landing page
app/(auth)/layout.tsx             Centered card, no navbar
app/(auth)/signup/page.tsx        Email + Google OAuth signup
app/(auth)/login/page.tsx         Email + Google OAuth login
app/auth/callback/route.ts        OAuth code exchange
app/(protected)/layout.tsx        Navbar + main wrapper
app/(protected)/onboarding/       3-step wizard (role, date, weakness)
app/(protected)/dashboard/        Session quota, CTA, recent sessions
app/api/onboarding/route.ts       POST: saves profile, sets onboarding_complete
lib/supabase/client.ts            Browser Supabase client
lib/supabase/server.ts            Server Supabase client (async cookies)
lib/questions.ts                  selectAdaptiveQuestions() — TDD'd
lib/utils.ts                      cn() helper
types/database.ts                 Profile, Question, Session, Answer types
components/ui/button.tsx          Button (primary/outline/ghost, sm/md/lg)
components/ui/card.tsx            Card (optional tinted prop)
components/ui/badge.tsx           Badge (brand/gray/green/red/amber)
components/layout/navbar.tsx      Async server component navbar
supabase/migrations/001_*.sql     5 tables + RLS + trigger + RPC
supabase/seed.sql                 75 questions seeded
```

## DB tables
`profiles`, `questions`, `sessions`, `answers`, `question_history`
- `profiles.tier`: `free | student | pro`
- Tier limits: Free=2 sessions/mo, Student=10, Pro=30
- Adaptive question selection: unasked first, fallback to asked pool

## Pricing
| Plan | Price | Sessions |
|---|---|---|
| Free | ₹0 | 2/mo |
| Student | ₹149/mo | 10/mo |
| Pro | ₹499/mo | 30/mo |

## Plan B — remaining tasks
1. `lib/analysis.ts` — filler detection + WPM (TDD)
2. `lib/assemblyai.ts` — transcription client
3. `app/api/session/start/route.ts` — create session row
4. `app/api/session/transcribe/route.ts` — upload audio → AssemblyAI → store answer
5. `app/(protected)/session/setup/page.tsx` — difficulty + mic permission
6. `app/(protected)/session/briefing/page.tsx` — format briefing card
7. `app/(protected)/session/live/page.tsx` — recorder + timer + question loop
8. `app/(protected)/session/report/[id]/page.tsx` — report card
9. Wire session routes + session ID URL flow

## Conventions
- One task at a time, user confirms before each
- Server Components for data fetching, Client Components for interactivity
- API routes for all mutations
- Tier logic always from DB, never computed on frontend
- TDD for pure logic functions (vitest)
- Commit after every task
- `cn()` from `@/lib/utils` for className merging

## Next up
Plan B Task 1: `lib/analysis.ts` — filler word detection + WPM calculation (TDD with vitest)
