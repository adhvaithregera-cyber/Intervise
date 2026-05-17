# Intervise — MVP Design Spec
*Created: 2026-05-17*

## Overview

Intervise is a desktop-first web app that coaches people through job interviews by teaching them 8 structured answer formats (STAR, PACE, etc.) and drilling them under real timed pressure. The MVP delivers the core session loop: live voice recording → AssemblyAI transcription → filler count + WPM metrics → report card.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Auth + DB | Supabase (SSR auth, Postgres) |
| Hosting | Vercel (`intervise.vercel.app`) |
| Transcription | AssemblyAI (post-answer blob upload) |
| Vision | MediaPipe FaceMesh (in-browser, Student+ only) |
| Payments | Razorpay (scaffolded, inactive in MVP) |
| AI scoring | Claude Sonnet 4.6 + Haiku (second pass, not MVP) |

---

## Architecture

**Pattern:** Next.js App Router + API Routes (Approach B)  
Server Components for data fetching. API routes for all mutations and AI calls.

**Request flow for a live session answer:**
```
Browser records audio → user taps Done
→ POST /api/session/transcribe (audio blob + session_id)
→ AssemblyAI returns transcript + word timestamps
→ Server computes filler count + WPM
→ Stores result in Supabase answers table
→ Returns metrics to client → next question loads
```

---

## Database Schema

### `profiles`
Auto-created on signup via Supabase trigger.
```sql
id uuid FK → auth.users
full_name text
avatar_url text
tier text DEFAULT 'free'  -- 'free' | 'student' | 'pro'
sessions_limit int DEFAULT 2
sessions_used_this_month int DEFAULT 0
onboarding_complete bool DEFAULT false
role_type text
interview_date date
biggest_weakness text
created_at timestamptz
```

### `questions`
Seeded from 75-question bank (ranked by frequency across 20,918+ real interviews).
```sql
id int PRIMARY KEY
rank int
category_id int
category_name text
question_text text
frequency text  -- 'Universal' | 'Very High' | 'High' | 'Medium' | 'Low'
answer_format text
time_limit_seconds int
notes text
```

### `sessions`
```sql
id uuid PRIMARY KEY
user_id uuid FK → profiles
difficulty text  -- 'easy' | 'medium' | 'mixed'
status text  -- 'in_progress' | 'complete' | 'failed'
tier_at_time text  -- snapshot at session creation, never recomputed
overall_grade text
created_at timestamptz
completed_at timestamptz
```

### `answers`
```sql
id uuid PRIMARY KEY
session_id uuid FK → sessions
question_id int FK → questions
answer_index int
transcript text
transcription_failed bool DEFAULT false
filler_count int
filler_breakdown jsonb  -- {"um": 4, "uh": 2, "like": 1}
wpm int
eye_contact_pct int  -- Student+ only, null for free
duration_seconds int
created_at timestamptz
```

### `question_history`
Drives adaptive question selection.
```sql
id uuid PRIMARY KEY
user_id uuid FK → profiles
question_id int FK → questions
asked_at timestamptz
```

---

## MVP Screens & Routes

| Route | Screen | Auth |
|---|---|---|
| `/` | Landing Page | No |
| `/signup` | Sign Up | No |
| `/login` | Login | No |
| `/onboarding` | 3-question setup | Yes (first login only) |
| `/dashboard` | Home | Yes |
| `/session/setup` | Difficulty + mic permission | Yes |
| `/session/briefing` | Format briefing card | Yes |
| `/session/live` | Live exam mode | Yes |
| `/session/report/[id]` | Report card | Yes |

**Deferred (post-MVP):** `/progress`, `/company-prep`, `/profile`, `/pricing`

### Auth guards
- Supabase SSR middleware on all `/dashboard`, `/session/*`, `/onboarding` routes
- Unauthenticated → redirect to `/login`
- After login: if `onboarding_complete = false` → redirect to `/onboarding`
- `/session/setup`: server checks `sessions_used_this_month >= sessions_limit` → redirect to landing pricing section if exhausted

---

## Session Flow & AI Pipeline

### Question selection (adaptive)
1. Query `questions` where `category_id IN (1, 2)` (Cat 1: Identity & Background, Cat 2: Behavioural) — free tier
2. Exclude `question_ids` already in `question_history` for this user
3. If fewer than 3 unasked remain → fill with random from full Cat 1+2 pool
4. Shuffle the 3 selected → insert into `question_history` at session start

### Per-answer pipeline
1. Show question + countdown timer (`time_limit_seconds` from DB)
2. MediaRecorder captures audio (webm/opus)
3. User taps "Done" OR timer hits 0
4. Audio blob → `POST /api/session/transcribe`
5. AssemblyAI returns transcript + word timestamps
6. Server computes:
   - `filler_count`: scan for "um", "uh", "like", "you know", "basically"
   - `filler_breakdown`: per-word counts as JSON
   - `wpm`: word_count / duration_seconds * 60
7. Upsert into `answers` table
8. Return metrics → client loads next question

### MediaPipe (Student+ only, in-browser)
- Runs FaceMesh during recording
- Samples eye contact every 500ms, averages across answer duration
- `eye_contact_pct` sent alongside audio blob in POST body
- Video never leaves the device

### Grading
A placeholder formula will be implemented for MVP and refined after live testing. The grade (A–F) is stored as `overall_grade` on the session.

### Report card (MVP)
- **Free:** letter grade + total filler count + filler breakdown + WPM
- **Student+:** + eye contact %
- **STAR scoring + ideal answer:** blurred with "coming soon" overlay (Claude pipeline is second pass)

---

## Feature Gates

| Feature | Free | Student | Pro |
|---|---|---|---|
| Sessions/month | 2 | 10 | 30 |
| Questions/session | 3 | 5 | 5–8 |
| Categories | 1 + 2 | All 8 | All 8 + company |
| Filler count | count only | full breakdown | full breakdown |
| WPM | yes | yes + gauge | yes + trend |
| Eye contact (MediaPipe) | no | yes | yes |
| STAR scoring (Claude) | blurred | yes | yes |
| Ideal answer (Claude) | blurred | yes | yes |
| Session history | 7 days | 30 days | Unlimited |
| Progress charts | no | no | yes |
| Company question sets | no | no | yes |
| Difficulty | Easy only | Easy/Med | All + Hard |

Tier logic always read from DB (`profiles.tier`), never computed on frontend.

---

## Project Structure

```
intervise/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── session/
│   │       ├── setup/page.tsx
│   │       ├── briefing/page.tsx
│   │       ├── live/page.tsx
│   │       └── report/[id]/page.tsx
│   ├── api/
│   │   ├── session/
│   │   │   ├── start/route.ts
│   │   │   └── transcribe/route.ts
│   │   └── onboarding/route.ts
│   ├── page.tsx                    (landing)
│   └── layout.tsx
├── components/
│   ├── ui/                         (Button, Card, Badge, Timer, Waveform)
│   ├── session/                    (QuestionCard, AudioRecorder, FormatCard)
│   └── report/                     (GradeCircle, FillerBreakdown, MetricCard)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── assemblyai.ts
│   └── questions.ts
├── middleware.ts
└── supabase/
    ├── migrations/
    └── seed.sql
```

---

## Pricing (Razorpay — deferred)

| Tier | Price | Sessions |
|---|---|---|
| Free | ₹0 / forever | 2 |
| Student | ₹149 / month | 10 |
| Pro | ₹499 / month | 30 |

Razorpay integration scaffolded (env vars, webhook route stub) but inactive in MVP. Billing resets on anniversary date, not calendar month.

---

## Design

- **Primary colour:** Purple
- **Target device:** Desktop-first, responsive
- **Domain:** `intervise.vercel.app` (intervise.in when acquired)
- **GitHub repo:** `Intervise` (adhvaith.regera@gmail.com)
