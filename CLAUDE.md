# Intervise — Project Context

## What we're building
Desktop-first AI interview coaching web app. Users learn 8 structured answer formats (STAR, PACE, etc.), record voice answers under a countdown timer, and get AI feedback on filler words, WPM, grammar, STAR scores, and more.

## Tech stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v3
- Supabase SSR auth + Postgres (`@supabase/ssr`)
- AssemblyAI — post-answer audio transcription
- OpenAI API — AI answer feedback (8-category rubric via `lib/aifeedback.ts`)
- Google Gemini API (`gemini-2.5-flash`) — weakness summary only (`lib/weaknesssummary.ts`)
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
OPENAI_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
```

## Key files
```
middleware.ts                                        Auth guard
app/page.tsx                                         Landing page
app/(protected)/dashboard/page.tsx                   Session quota, CTA, focus areas, progress charts
app/(protected)/dashboard/focus-areas-card.tsx       Focus Areas display component (all tiers)
app/(protected)/session/setup/setup-client.tsx       Difficulty selector + two-step mic check
app/(protected)/session/briefing/page.tsx            Format briefing + session creation (server)
app/(protected)/session/live/page.tsx                Recorder + countdown timer + question loop
app/(protected)/session/report/[id]/page.tsx         Full report (grade, WPM, fillers, AI feedback)
app/api/session/transcribe/route.ts                  Audio → AssemblyAI → AI feedback → store
app/api/session/complete/route.ts                    Marks session complete, sets overall_grade
lib/aifeedback.ts                                    generateAnswerFeedback() — OpenAI, 8-category rubric
lib/weaknesssummary.ts                               generateWeaknessSummary() — Gemini 2.5 Flash
lib/focusareas.ts                                    detectFocusAreas() — rule-based, no AI
lib/session.ts                                       createSession() — question selection + RPC call
lib/questions.ts                                     selectAdaptiveQuestions() — TDD'd
lib/analysis.ts                                      Filler detection + WPM calculation — TDD'd
lib/scorecard.ts                                     Grade styles + computeScorecardStats()
lib/validation.ts                                    Zod schemas for all API inputs
types/database.ts                                    Profile, Question, Session, Answer, AiFeedback types
supabase/migrations/                                 Schema migrations (001–022)
docs/GRADING.md                                      Full grading rubric + AI feedback schema
```

## DB summary
Tables: `profiles`, `questions`, `sessions`, `answers`, `question_history`

- `profiles.tier`: `free | student | pro`
- Sessions/month: Free=2, Student=12, Pro=30
- Difficulty gating: Free=Easy only, Student=Easy+Medium, Pro=all
- Category pools: Free=Cat 1+2, Student/Pro=All 9 (categories 1–9; category 9 = Weaknesses, split from old Strengths & Weaknesses in migration 019)
- Session history: Free=7 days, Student=30 days, Pro=unlimited

## Pricing
| Plan | Price | Sessions/mo | Key features |
|---|---|---|---|
| Free | ₹0 | 2 | Grade, WPM, fillers, blurred AI feedback (first session shown in full as trial) |
| Student | ₹199/mo or ₹499/qtr | 12 | Full AI feedback, progress charts, shareable scorecard |
| Pro | ₹349/mo or ₹999/qtr | 30 | Hard+Mixed difficulty, resume-based Qs, weekly plan |

## API cost baseline (per session)
- AssemblyAI (`universal-2`): ~$0.04 (6 min audio @ $0.37/hr)
- OpenAI (answer feedback): ~$0.01 (5 answers × ~700 tokens, GPT-4o-mini class)
- Gemini 2.5 Flash (weakness summary): ~$0.001 (single call per session)
- **Total: ~$0.051/session (~₹4.28 at ₹84/$)**
- Student monthly margin at full utilisation: ~74% | Pro monthly: ~63%
- (Older figures of ~79%/~70% were calculated at ₹68/$ — now stale)
- ElevenLabs TTS considered and rejected — adds ~$0.13/session, makes Pro unprofitable at full utilisation. Revisit when revenue supports it.

## Tier rules
- AI feedback always runs for all tiers; Free users see it blurred after their first session
- First session (all tiers): free users see full AI feedback as a one-time trial; a banner explains this and links to upgrade
- Progress charts (WPM, fillers, score trends): Student+ only — blurred teaser shown to Free users
- Focus Areas (weakness detection + advice): **all tiers** — not gated
- Shareable PNG scorecard: all tiers
- Hard + Mixed difficulty: Pro only

## Session setup flow
1. `/session/setup` — difficulty selector + **two-step mic check**:
   - Step 1: "Allow Microphone" button — requests browser permission, marks complete with ✓
   - Step 2: Persistent audio level check — keeps stream alive after permission, shows a live 10-bar volume meter (red → amber → green). Auto-evaluates after 3.5s (or instantly if RMS > 0.08). Result: "Great, we can hear you!" (green) or "We can barely hear you" (amber) + "Try again" / "Proceed anyway". Bar stays visible continuously — never disappears on sound detection.
   - Check stream is stopped in `handleStart()` before navigation; `live/page.tsx` re-acquires a fresh stream independently.
   - `canStart` requires difficulty selected + check state is `pass` or `skipped`.
2. `/session/briefing` — session created server-side here (quota consumed); format briefing shown; "Start Interview" navigates to live.
3. `/session/live` — acquires mic stream fresh, runs session.

## Live session flow
- 3-second blank prep countdown ("Take a breath...") — no question shown
- 8-second reading phase — question shown clearly before recording starts
- Recording begins: question blurs immediately; "Reveal question" button to unblur
- Timer bar counts down; "Done" ends answer early; "End Session" exits after current answer
- No TTS — text only
- Exit session button visible for first 10s of Q1 only (accidental-start escape hatch); calls `/api/session/abandon` which marks session failed + restores quota

## Report page — locked state design
Both gated sections use the same visual pattern: blurred inline preview + absolute overlay (lock icon in gold circle → heading → short descriptor → upgrade button).

- **AI Feedback** (Student gate): blurred skeleton cards showing "✓ Strong / ↑ Improve / → Try this" rows → "Unlock AI Feedback" overlay → "Upgrade to Student →". Free users who haven't used their trial see full feedback instead (first-session logic in `showFullFeedback = isStudent || isFirstCompletedSession`).
- **Progress & Trends** (Pro gate): blurred fake bar chart → "Unlock Progress Tracking" overlay → "Upgrade to Pro →".

## Focus Areas section (dashboard)
Placed between the Recent Sessions grid and the Progress charts. Visible to **all tiers**.

**Detection** (`lib/focusareas.ts`) — rule-based only, no AI:
- Gate: requires ≥ 2 sessions with ≥ 3 answers that have `ai_feedback`
- Computes from `recentAnswers` (last 20 sessions within tier's history window):
  - `avgSkill`, `avgFluency` — from `computeThreeMetrics(fb)` per answer
  - `avgWpm`, `avgFillers` — direct from answer columns (require ≥ 3 samples)
  - Per-category skill avg — requires ≥ 2 categories each with ≥ 2 answers; flags weakest if ≥ 20 pts below overall avg

**Thresholds:**
| Weakness | Condition | Priority |
|---|---|---|
| Skill / structure | avg skill < 40 | HIGH |
| Weak category | weakest category ≥ 20 pts below avg | HIGH |
| Fluency low | avg fluency < 60 | MEDIUM |
| Fillers high | avg fillers > 3 per answer | MEDIUM |
| Pace too fast | avg WPM > 165 | MEDIUM |
| Pace too slow | avg WPM < 110 | MEDIUM |

**Ranking weights (impactScore):**
- Skill: `(40 − avg) × 5`
- Weak category: `gap × 2`
- Fluency: `(60 − avg) × 1.5`
- Fillers: `(avg − 3) × 7`
- Pace: `delta × 0.5`

Skill generally outranks fillers in typical cases (e.g. skill=32 + fillers=6 → skill #1). Top 3 by impactScore are shown.

**Display** (`focus-areas-card.tsx`):
- #1 weakness: large gold-bordered primary card ("Priority Focus" label)
- #2–#3: smaller secondary cards, side-by-side on sm+ screens
- Each card: weakness name, user's actual number, specific advice text
- "Resources & guides · coming soon" placeholder on every card (non-functional)
- Fallbacks: `not_enough_data` (< 2 sessions) / `all_good` (no thresholds triggered)

**Data fetch:** `recentAnswers` query augmented to include `filler_count, wpm, question_id` for all tiers (was previously `session_id, ai_feedback` only). One extra category lookup query runs for all users.

## Conventions
- Server Components for data fetching, Client Components for interactivity
- API routes for all mutations
- Tier logic always read from DB (`profiles.tier`), never trusted from frontend
- TDD for pure logic functions (vitest)
- Commit after every task
- `cn()` from `@/lib/utils` for className merging
- Glassmorphic design: `rgba(8,13,26,0.75)` bg, `blur(20px)`, gold border `rgba(249,193,37,0.18)`

## Claude behaviour
- **Keep CLAUDE.md up to date** — after every significant decision, feature addition, pricing change, or architectural choice made during conversation, update this file to reflect the current state of the product. Do not wait to be asked.

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

## Feature backlog (brainstormed 2026-07-23)
Prioritised list — build in roughly this order:

**Activation (fix post-onboarding drop-off)**
- Guided first session: after onboarding, dashboard detects `sessions_used_this_month === 0` and shows a "Your first session is ready" welcome panel with a single CTA → `/session/briefing?difficulty=easy`. Skips setup page.
- Empty state onboarding CTA: checklist card (Created account ✅ → First session ⬜ → See report ⬜) shown until all done.
- Interview countdown widget: if `interview_date` is set in profile, show "Your interview is in N days — do X more sessions."

**Content & Curriculum**
- Company-specific question banks: tag questions with `company_tag` + `role_tag`; Student+ filter in session setup.
- Format guide cards ("The Playbook"): static in-app written guides for each of the 8 answer formats (STAR, PACE, etc.) with worked examples. Free tier, no DB needed.
- Answer of the day: daily high-scoring example answer shown on dashboard.

**Deeper AI coaching**
- Weakness drill mode: after 3+ sessions, identify lowest-scoring component → auto-target those questions; highlight the targeted metric in the report.
- Model answer / answer rewrite: AI generates ideal version of your answer side-by-side after submission. Student+.
- Streaks + email reminders: daily streak counter + inactivity email after 2 days. Strong retention mechanic.
- Post-session coaching chat: chat with AI about your specific answers after viewing report. Pro.
- Focus Areas "Resources & guides" links: wire up real guides/targeted-practice once content exists (currently "coming soon" placeholders on every focus-area card).

**Growth / viral**
- Enhanced share card: add company name + QR code to existing shareable PNG.
- Referral program: give a friend 1 free session, get 1 yourself.
- Session transcript replay: full annotated transcript with filler words highlighted, STAR components labelled. Student+.

**Long-term / big bets**
- AI voice mock interviewer: TTS speaks question, VAD listens, asks follow-ups. Pro.
- Video recording + body language analysis. Pro.
- B2B campus placement portal for college placement cells.
