# Intervise — Plan A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 15 project, set up Supabase schema + seed data, implement auth middleware, and build all screens through Dashboard (Landing → Sign Up/Login → Onboarding → Dashboard).

**Architecture:** Next.js 15 App Router with TypeScript and Tailwind. Server Components for data fetching, API Routes for mutations. Supabase SSR for auth (cookie-based sessions). Auth middleware guards all protected routes and redirects to onboarding if `onboarding_complete = false`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (`@supabase/ssr`), Lucide React, Vitest, @testing-library/react

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.env.local`, `.env.example`, `.gitignore`

- [ ] **Step 1: Run create-next-app in the project directory**

```bash
cd "C:/Users/Adhvaith/OneDrive/Desktop/Intervise"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --yes
```

Expected: Next.js 15 project scaffolded with TypeScript + Tailwind + App Router.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge
```

Expected: packages added to node_modules.

- [ ] **Step 3: Create .env.local with placeholder values**

Create `C:/Users/Adhvaith/OneDrive/Desktop/Intervise/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Create `C:/Users/Adhvaith/OneDrive/Desktop/Intervise/.env.example` with the same content (committed to git as documentation).

- [ ] **Step 4: Add .env.local to .gitignore**

Open `.gitignore` and verify `.env.local` is listed. If not, add it:
```
.env.local
```

- [ ] **Step 5: Update tailwind.config.ts to add custom purple palette**

Replace the contents of `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 with default Next.js page. Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Set up Vitest for testing

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `tests/lib/.gitkeep`

- [ ] **Step 1: Install testing dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

Open `package.json` and add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write a smoke test to verify setup**

Create `tests/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run tests to verify setup works**

```bash
npm test
```

Expected output:
```
✓ tests/smoke.test.ts (1)
  ✓ test setup > works

Test Files  1 passed (1)
Tests       1 passed (1)
```

- [ ] **Step 7: Delete smoke test and commit**

```bash
rm tests/smoke.test.ts
git add -A
git commit -m "feat: add Vitest testing setup"
```

---

### Task 3: Database schema migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table (auto-created on user signup via trigger)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'student', 'pro')),
  sessions_limit integer not null default 2,
  sessions_used_this_month integer not null default 0,
  onboarding_complete boolean not null default false,
  role_type text,
  interview_date date,
  biggest_weakness text,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- questions table (seeded separately)
create table public.questions (
  id integer primary key,
  rank integer not null,
  category_id integer not null,
  category_name text not null,
  question_text text not null,
  frequency text not null,
  answer_format text not null,
  time_limit_seconds integer not null default 60,
  notes text not null default ''
);

-- sessions table
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'mixed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'complete', 'failed')),
  tier_at_time text not null,
  overall_grade text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- answers table
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id integer references public.questions(id) not null,
  answer_index integer not null,
  transcript text,
  transcription_failed boolean not null default false,
  filler_count integer,
  filler_breakdown jsonb,
  wpm integer,
  eye_contact_pct integer,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);

-- question_history table (drives adaptive selection)
create table public.question_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id integer references public.questions(id) not null,
  asked_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.answers enable row level security;
alter table public.question_history enable row level security;

-- profiles: users can only read/update their own row
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- sessions: users can only see their own sessions
create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);

-- answers: users can only see answers belonging to their sessions
create policy "Users can view own answers" on public.answers
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy "Users can insert own answers" on public.answers
  for insert with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- question_history: users can only see their own history
create policy "Users can view own history" on public.question_history
  for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.question_history
  for insert with check (auth.uid() = user_id);

-- questions: public read (no auth required)
create policy "Questions are publicly readable" on public.questions
  for select using (true);
```

- [ ] **Step 2: Run this SQL in Supabase dashboard**

Go to your Supabase project → SQL Editor → paste the entire file → Run.

Expected: All tables created with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add database schema migrations"
```

---

### Task 4: Seed 75 questions

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create seed.sql**

Create `supabase/seed.sql`:
```sql
insert into public.questions (id, rank, category_id, category_name, question_text, frequency, answer_format, time_limit_seconds, notes)
values
(1, 1, 1, 'Identity & Background', 'Tell me about yourself', 'Universal', 'Present → Past → Future. 60–90 seconds. No CV walkthrough.', 90, 'Asked in 93%+ of all interviews. Always the opener.'),
(2, 2, 1, 'Identity & Background', 'Walk me through your resume / background', 'Universal', 'Present → Past → Future. Narrative arc, not chronology.', 90, 'Second most common opener. Often used interchangeably with Q1.'),
(6, 6, 2, 'Behavioural', 'Tell me about a time you showed leadership', 'Universal', 'STAR — Action section must show personal initiative, not team.', 120, 'Top behavioural question across all industries and roles.'),
(7, 7, 2, 'Behavioural', 'Describe a time you dealt with a difficult situation', 'Universal', 'STAR — emphasise your personal action, not the situation itself.', 120, 'Appears in virtually every behavioural interview.'),
(21, 21, 3, 'Strengths & Weaknesses', 'What is your greatest strength?', 'Universal', 'Name it → Prove it (one example) → Connect it to this role.', 60, 'Asked in ~90% of interviews. Most candidates give generic answers.'),
(22, 22, 3, 'Strengths & Weaknesses', 'What is your greatest weakness?', 'Universal', 'Name real weakness → Show awareness → Show action → Show progress.', 60, 'Most mishandled question.'),
(28, 28, 4, 'Motivation & Fit', 'Why do you want to work here?', 'Universal', 'Them (specific research) → You (matching skill) → Together (goal).', 60, 'Zero tolerance for generic answers. Research is mandatory.'),
(29, 29, 4, 'Motivation & Fit', 'Why are you interested in this role?', 'Universal', 'Them → You → Together. Tie role to your development goals.', 60, 'Distinct from why this company — focus on the JD specifically.'),
(37, 37, 5, 'Future & Ambition', 'Where do you see yourself in 5 years?', 'Universal', 'Near-term (this role) → Long-term (direction) → Bridge to this job.', 60, 'Loyalty and ambition test.'),
(65, 65, 8, 'Closing Questions', 'Do you have any questions for us?', 'Universal', 'Always have 3: Role question, Team question, Growth question.', 60, '38% of candidates say No — instant red flag.'),
(66, 66, 8, 'Closing Questions', 'What does success look like in this role in 90 days?', 'Universal', 'Ask this to show you are already thinking about delivering value.', 60, 'Best closing question. Shows orientation and ambition.'),
(3, 3, 1, 'Identity & Background', 'How would you describe yourself in three words?', 'Very High', 'Name 3 words → one specific example for each → tie to role.', 60, 'Common screening question. Tests self-awareness instantly.'),
(4, 4, 1, 'Identity & Background', 'What makes you unique compared to other candidates?', 'Very High', '1 specific differentiator → proof → relevance to role.', 60, 'Tests confidence and self-positioning.'),
(8, 8, 2, 'Behavioural', 'Tell me about a time you failed', 'Very High', 'STAR — Result must be the LEARNING. Be honest, not defensive.', 90, 'Tests self-awareness and growth mindset.'),
(9, 9, 2, 'Behavioural', 'Tell me about a time you worked in a team', 'Very High', 'STAR — distinguish your role from the team role clearly.', 90, 'Cross-industry. Tests collaboration and communication.'),
(10, 10, 2, 'Behavioural', 'Describe a conflict with a coworker and how you resolved it', 'Very High', 'STAR — show empathy AND resolution. No blame. Focus on outcome.', 90, 'Directly tests emotional intelligence.'),
(11, 11, 2, 'Behavioural', 'Tell me about a time you met a tight deadline', 'Very High', 'STAR — show prioritisation and execution under pressure.', 90, 'Very common in fast-paced roles.'),
(23, 23, 3, 'Strengths & Weaknesses', 'What are you working on improving right now?', 'Very High', 'Name weakness honestly → Specific action you are taking today.', 60, 'Softer version of weakness question. Still needs honesty.'),
(24, 24, 3, 'Strengths & Weaknesses', 'How would your manager describe you?', 'Very High', 'Name 2–3 traits → one evidence example each → add self-aware note.', 60, 'Tests self-awareness from external perspective.'),
(30, 30, 4, 'Motivation & Fit', 'Why should we hire you?', 'Very High', '3 specific reasons with evidence. Direct, confident, no hedging.', 60, 'Tests confidence and self-positioning.'),
(31, 31, 4, 'Motivation & Fit', 'Why are you leaving your current job?', 'Very High', 'Forward-looking and positive only. NEVER badmouth. Growth framing.', 60, 'Trap question. Any negativity about previous employer = rejection.'),
(32, 32, 4, 'Motivation & Fit', 'What do you know about our company?', 'Very High', '3 specific facts (product, mission, recent news) + why they matter.', 60, 'Research question. Blanks = instant disqualification.'),
(38, 38, 5, 'Future & Ambition', 'What are your long-term career goals?', 'Very High', 'Near-term mastery → long-term direction → why this role bridges them.', 60, 'Show ambition without implying you will leave in 6 months.'),
(44, 44, 6, 'Situational', 'What would you do if you missed a deadline?', 'Very High', 'PACE — Prioritise (notify), Act (recover plan), Communicate, Evaluate.', 90, 'Tests accountability and professional communication.'),
(45, 45, 6, 'Situational', 'How would you handle a difficult colleague?', 'Very High', 'PACE — empathy first, direct conversation, escalation as last resort.', 90, 'Emotional intelligence test.'),
(46, 46, 6, 'Situational', 'What would you do if you disagreed with a decision?', 'Very High', 'PACE — raise concerns through right channel, commit once decided.', 90, 'Tests professionalism and constructive dissent.'),
(54, 54, 7, 'Curveball / Pressure', 'What is your biggest failure?', 'Very High', 'Pause → honest failure → learning → what you would do differently.', 90, 'Do not deflect. Real failure + real growth = strong answer.'),
(67, 67, 8, 'Closing Questions', 'What is the biggest challenge the team is facing right now?', 'Very High', 'Shows you are thinking about their problems, not just your opportunity.', 60, 'Signals strategic thinking and genuine interest.'),
(71, 71, 8, 'Closing Questions', 'What are the next steps in the process?', 'Very High', 'Always ask this. Shows professionalism and follow-through.', 30, 'Mandatory closing question. Sets timeline expectations.'),
(5, 5, 1, 'Identity & Background', 'Tell me something that is not on your resume', 'High', 'Relevant personal project, skill, or insight. Keep professional.', 60, 'Used to test personality fit and hidden depth.'),
(12, 12, 2, 'Behavioural', 'Give me an example of a time you showed initiative', 'High', 'STAR — Action must be self-directed, not assigned.', 90, 'Tests proactiveness and ownership.'),
(13, 13, 2, 'Behavioural', 'Tell me about a time you had to adapt to a major change', 'High', 'STAR — show flexibility and positive framing of the change.', 90, 'Common post-2020 given remote/hybrid shifts.'),
(14, 14, 2, 'Behavioural', 'Describe a time you disagreed with your manager', 'High', 'STAR — show respectful pushback AND ultimate alignment.', 90, 'Tests professional maturity.'),
(15, 15, 2, 'Behavioural', 'Tell me about your biggest professional achievement', 'High', 'STAR — Result must be quantified. Use I, not we.', 90, 'Strong differentiator question. Most candidates under-prepare.'),
(16, 16, 2, 'Behavioural', 'Tell me about a time you made a mistake', 'High', 'STAR — Result is the action taken to fix it + learning.', 90, 'Sister question to Tell me about a failure.'),
(17, 17, 2, 'Behavioural', 'Describe a time you had to learn something quickly', 'High', 'STAR — Show learning process, not just outcome.', 90, 'Common in dynamic or fast-growth companies.'),
(25, 25, 3, 'Strengths & Weaknesses', 'How would your colleagues describe you?', 'High', 'Name 2–3 traits → peer-relevant examples → honest self-reflection.', 60, 'Tests peer relationships and self-image accuracy.'),
(26, 26, 3, 'Strengths & Weaknesses', 'What skills are you still developing?', 'High', 'Name specifically → action you are taking → evidence of progress.', 60, 'Professional growth question. None is a wrong answer.'),
(33, 33, 4, 'Motivation & Fit', 'What attracted you to this industry?', 'High', 'Personal story → professional alignment → why now.', 60, 'Tests genuine motivation vs opportunistic application.'),
(34, 34, 4, 'Motivation & Fit', 'How does this role align with your career goals?', 'High', 'Them → You → Together. Specific, not generic.', 60, 'Tests role fit and longevity signal.'),
(35, 35, 4, 'Motivation & Fit', 'What type of work environment do you thrive in?', 'High', 'Describe environment → match to what you know about this company.', 60, 'Culture fit screening question.'),
(36, 36, 4, 'Motivation & Fit', 'What motivates you at work?', 'High', 'Specific intrinsic motivators → evidence → tie to role.', 60, 'Tests alignment. Money alone = red flag.'),
(39, 39, 5, 'Future & Ambition', 'Where do you see yourself in 10 years?', 'High', 'Broader directional vision → flexibility acknowledged → current focus.', 60, 'Less common but used for senior/management roles.'),
(40, 40, 5, 'Future & Ambition', 'What does success look like to you?', 'High', 'Role-specific 90-day success → longer-term impact → personal values.', 60, 'Tests ambition alignment with company culture.'),
(41, 41, 5, 'Future & Ambition', 'What are your salary expectations?', 'High', 'Research market → give range → show flexibility → anchor to value.', 60, 'Never give a number without research.'),
(47, 47, 6, 'Situational', 'How do you prioritise when everything feels urgent?', 'High', 'PACE — name your prioritisation framework explicitly.', 90, 'Time management and decision-making.'),
(48, 48, 6, 'Situational', 'What would you do if you found an error in your manager''s work?', 'High', 'PACE — verify, private conversation, solution-first approach.', 90, 'Tests professional courage and tact.'),
(49, 49, 6, 'Situational', 'How would you approach a project you know nothing about?', 'High', 'PACE — research, ask questions, map stakeholders, deliver incrementally.', 90, 'Tests resourcefulness and learning agility.'),
(50, 50, 6, 'Situational', 'What would you do if a client was unhappy with your work?', 'High', 'PACE — listen first, acknowledge, action plan, follow through.', 90, 'Common for client-facing and service roles.'),
(51, 51, 6, 'Situational', 'How would you handle working with a difficult team member?', 'High', 'PACE — empathy, conversation, collaboration, escalation only if needed.', 90, 'Tests collaboration under stress.'),
(55, 55, 7, 'Curveball / Pressure', 'Tell me something not on your resume', 'High', 'Relevant personal trait, project, or perspective. Keep professional.', 60, 'Personality and depth test.'),
(56, 56, 7, 'Curveball / Pressure', 'What would your previous manager say about you honestly?', 'High', 'Honest positives + one real area of feedback → show you received it well.', 60, 'Tests self-awareness and receptiveness to feedback.'),
(57, 57, 7, 'Curveball / Pressure', 'If I called your last manager right now, what would they say?', 'High', 'Same as above — honest, specific, confident.', 60, 'Pressure version. Tests consistency.'),
(60, 60, 7, 'Curveball / Pressure', 'How do you handle stress and pressure?', 'High', 'Specific coping strategy → example of using it → outcome.', 60, 'Tests resilience and self-management.'),
(68, 68, 8, 'Closing Questions', 'How has this role evolved over the last year?', 'High', 'Shows you understand roles grow. Positions you as a long-term thinker.', 60, 'Good signal of tenure awareness.'),
(69, 69, 8, 'Closing Questions', 'What do people who thrive here have in common?', 'High', 'Gives you culture fit data AND shows self-awareness.', 60, 'Dual benefit question.'),
(70, 70, 8, 'Closing Questions', 'Is there anything in my background that concerns you?', 'High', 'Bold but powerful. Opens door to handle objections in real time.', 60, 'High risk, high reward. Only ask if you feel confident.'),
(72, 72, 8, 'Closing Questions', 'What do you enjoy most about working here?', 'High', 'Humanises the interviewer. Gives you authentic culture insight.', 45, 'Shows you value real perspectives, not just company PR.'),
(73, 73, 8, 'Closing Questions', 'How would you describe the team culture?', 'High', 'Good follow-up to generic culture answers. Press for specifics.', 45, 'Culture fit due diligence.'),
(75, 75, 8, 'Closing Questions', 'When can I expect to hear back from you?', 'High', 'Always ask this before you leave. Sets follow-up timeline.', 30, 'Professional closure question.'),
(18, 18, 2, 'Behavioural', 'Tell me about a time you influenced without authority', 'Medium', 'STAR — Action shows persuasion, data use, and relationship building.', 90, 'Common for senior or cross-functional roles.'),
(19, 19, 2, 'Behavioural', 'Describe a time you went above and beyond', 'Medium', 'STAR — Result shows self-motivation, not just compliance.', 90, 'Tests discretionary effort and ownership culture fit.'),
(20, 20, 2, 'Behavioural', 'Tell me about a time you had to manage multiple priorities', 'Medium', 'STAR — Action shows explicit prioritisation framework.', 90, 'Tests time management and decision-making.'),
(27, 27, 3, 'Strengths & Weaknesses', 'What do you consider your best professional skill?', 'Medium', 'Name → Evidence (metrics) → Why it matters for this role.', 60, 'More specific than greatest strength.'),
(42, 42, 5, 'Future & Ambition', 'Are you considering other offers?', 'Medium', 'Honest but measured. Use to signal demand without pressure.', 45, 'Negotiation intelligence gathering question.'),
(43, 43, 5, 'Future & Ambition', 'What would you do in the first 30/60/90 days?', 'Medium', 'Learn → Contribute → Lead. Specific, not vague platitudes.', 90, 'Common for senior and management roles.'),
(52, 52, 6, 'Situational', 'What would you do if asked to do something unethical?', 'Medium', 'Pause → Reframe (clarify intent) → Decline professionally → Escalate.', 90, 'Tests integrity. Rare but memorable if asked.'),
(53, 53, 6, 'Situational', 'How would you onboard yourself to a new team?', 'Medium', 'PACE — listen first, build relationships, contribute early.', 90, 'Common for experienced hires.'),
(58, 58, 7, 'Curveball / Pressure', 'What is a controversial opinion you hold?', 'Medium', 'Pause → choose carefully → state with confidence + nuance.', 60, 'Tests intellectual confidence. Avoid politics and religion.'),
(59, 59, 7, 'Curveball / Pressure', 'What do you do in your spare time?', 'Medium', '2–3 genuine interests. Connect at least one to professional growth.', 45, 'Personality and culture fit signal.'),
(63, 63, 7, 'Curveball / Pressure', 'What book are you reading right now?', 'Medium', 'Have a real answer. Tie the book to professional growth if possible.', 30, 'Tests intellectual curiosity and honesty.'),
(64, 64, 7, 'Curveball / Pressure', 'How would you rate yourself out of 10?', 'Medium', 'Give 7–8. Explain why not 10 (room to grow) and why not below 7.', 45, 'Confidence + humility balance test.'),
(74, 74, 8, 'Closing Questions', 'What growth opportunities exist in this role?', 'Medium', 'Shows ambition. Ask with development framing, not promotion framing.', 45, 'Career growth signal.'),
(61, 61, 7, 'Curveball / Pressure', 'Tell me a joke', 'Low', 'Pause → light, clean, self-deprecating. Never offensive.', 30, 'Rare. Tests composure and social intelligence.'),
(62, 62, 7, 'Curveball / Pressure', 'If you were an animal, what would you be and why?', 'Low', 'Pause → choose one with professional relevance → brief explanation.', 30, 'Personality test. Take it lightly but do not be silly.')
on conflict (id) do nothing;
```

- [ ] **Step 2: Run seed SQL in Supabase dashboard**

Go to Supabase project → SQL Editor → paste seed.sql → Run.

Expected: `75 rows inserted` with no errors.

- [ ] **Step 3: Verify question count**

In Supabase SQL Editor run:
```sql
select count(*) from public.questions;
-- expected: 75
select count(*) from public.questions where category_id in (1, 2);
-- expected: 16 (Cat 1: 5, Cat 2: 12 — the free tier pool)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: seed 75 interview questions"
```

---

### Task 5: Supabase client + TypeScript types

**Files:**
- Create: `types/database.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: Create types/database.ts**

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Tier = 'free' | 'student' | 'pro'
export type Difficulty = 'easy' | 'medium' | 'mixed'
export type SessionStatus = 'in_progress' | 'complete' | 'failed'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  tier: Tier
  sessions_limit: number
  sessions_used_this_month: number
  onboarding_complete: boolean
  role_type: string | null
  interview_date: string | null
  biggest_weakness: string | null
  created_at: string
}

export type Question = {
  id: number
  rank: number
  category_id: number
  category_name: string
  question_text: string
  frequency: string
  answer_format: string
  time_limit_seconds: number
  notes: string
}

export type Session = {
  id: string
  user_id: string
  difficulty: Difficulty
  status: SessionStatus
  tier_at_time: string
  overall_grade: string | null
  created_at: string
  completed_at: string | null
}

export type Answer = {
  id: string
  session_id: string
  question_id: number
  answer_index: number
  transcript: string | null
  transcription_failed: boolean
  filler_count: number | null
  filler_breakdown: Record<string, number> | null
  wpm: number | null
  eye_contact_pct: number | null
  duration_seconds: number
  created_at: string
}

export type QuestionHistory = {
  id: string
  user_id: string
  question_id: number
  asked_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      questions: {
        Row: Question
        Insert: Question
        Update: Partial<Question>
      }
      sessions: {
        Row: Session
        Insert: Omit<Session, 'id' | 'created_at'>
        Update: Partial<Omit<Session, 'id' | 'user_id' | 'created_at'>>
      }
      answers: {
        Row: Answer
        Insert: Omit<Answer, 'id' | 'created_at'>
        Update: Partial<Omit<Answer, 'id' | 'session_id' | 'created_at'>>
      }
      question_history: {
        Row: QuestionHistory
        Insert: Omit<QuestionHistory, 'id' | 'asked_at'>
        Update: never
      }
    }
  }
}
```

- [ ] **Step 2: Create lib/supabase/client.ts (browser client)**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create lib/supabase/server.ts (server client)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set, middleware handles this
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add types/ lib/
git commit -m "feat: add Supabase client and TypeScript types"
```

---

### Task 6: Adaptive question selection (TDD)

**Files:**
- Create: `lib/questions.ts`, `tests/lib/questions.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `tests/lib/questions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Question } from '@/types/database'

const makeQuestions = (count: number, categoryId = 1): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    rank: i + 1,
    category_id: categoryId,
    category_name: 'Test Category',
    question_text: `Question ${i + 1}`,
    frequency: 'High',
    answer_format: 'Format',
    time_limit_seconds: 60,
    notes: '',
  }))

describe('selectAdaptiveQuestions', () => {
  it('returns exactly the requested count when enough questions available', () => {
    const questions = makeQuestions(10)
    const result = selectAdaptiveQuestions(questions, [], 3)
    expect(result).toHaveLength(3)
  })

  it('returns fewer than count when pool is smaller', () => {
    const questions = makeQuestions(2)
    const result = selectAdaptiveQuestions(questions, [], 3)
    expect(result).toHaveLength(2)
  })

  it('excludes already-asked questions when enough unasked remain', () => {
    const questions = makeQuestions(10)
    const askedIds = [1, 2, 3, 4, 5, 6, 7]
    const result = selectAdaptiveQuestions(questions, askedIds, 3)
    const resultIds = result.map(q => q.id)
    expect(resultIds.every(id => !askedIds.includes(id))).toBe(true)
  })

  it('falls back to asked questions when not enough unasked remain', () => {
    const questions = makeQuestions(10)
    const askedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9] // only question 10 is unasked
    const result = selectAdaptiveQuestions(questions, askedIds, 3)
    expect(result).toHaveLength(3)
    // question 10 must appear (only unasked)
    expect(result.some(q => q.id === 10)).toBe(true)
  })

  it('does not return duplicate questions', () => {
    const questions = makeQuestions(10)
    const result = selectAdaptiveQuestions(questions, [], 5)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test tests/lib/questions.test.ts
```

Expected: FAIL — `selectAdaptiveQuestions` is not defined.

- [ ] **Step 3: Implement lib/questions.ts**

```typescript
import type { Question } from '@/types/database'

export function selectAdaptiveQuestions(
  allQuestions: Question[],
  askedIds: number[],
  count: number
): Question[] {
  const askedSet = new Set(askedIds)
  const unasked = allQuestions.filter(q => !askedSet.has(q.id))

  if (unasked.length >= count) {
    return shuffle(unasked).slice(0, count)
  }

  // Not enough unasked — fill remaining slots from asked pool
  const needed = count - unasked.length
  const fallback = shuffle(allQuestions.filter(q => askedSet.has(q.id))).slice(0, needed)
  return shuffle([...unasked, ...fallback])
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/lib/questions.test.ts
```

Expected:
```
✓ tests/lib/questions.test.ts (5)
Test Files  1 passed (1)
Tests       5 passed (5)
```

- [ ] **Step 5: Commit**

```bash
git add lib/questions.ts tests/lib/questions.test.ts
git commit -m "feat: add adaptive question selection with tests"
```

---

### Task 7: Auth middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicPath = pathname === '/' || pathname === '/login' || pathname === '/signup'

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Onboarding guard: redirect to /onboarding if not complete
  if (user && pathname !== '/onboarding' && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_complete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Supabase SSR auth middleware with onboarding guard"
```

---

### Task 8: Shared UI components

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/layout/navbar.tsx`, `lib/utils.ts`

- [ ] **Step 1: Create lib/utils.ts (class name helper)**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Create components/ui/button.tsx**

```typescript
import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
  outline: 'border border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
  ghost: 'text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Create components/ui/card.tsx**

```typescript
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tinted?: boolean
}

export function Card({ className, tinted, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        tinted ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create components/ui/badge.tsx**

```typescript
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'brand' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  brand: 'bg-brand-100 text-brand-700',
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
}

export function Badge({ variant = 'brand', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create components/layout/navbar.tsx**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold text-brand-600 tracking-tight">
          INTERVISE
        </Link>
        {!user && (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ lib/utils.ts
git commit -m "feat: add shared UI components (Button, Card, Badge, Navbar)"
```

---

### Task 9: App layouts

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(auth)/layout.tsx`, `app/(protected)/layout.tsx`

- [ ] **Step 1: Update app/layout.tsx (root layout)**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Intervise — AI Interview Coach',
  description: 'Learn the 8 interview formats. Practice under real pressure.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create app/(auth)/layout.tsx**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-600 tracking-tight">INTERVISE</h1>
        </div>
        {children}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create app/(protected)/layout.tsx**

```typescript
import { Navbar } from '@/components/layout/navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/'(auth)'/ app/'(protected)'/
git commit -m "feat: add root, auth, and protected layouts"
```

---

### Task 10: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write app/page.tsx**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Try before you commit',
    features: ['2 sessions per month', '3 questions per session', 'Filler word count', 'Words per minute'],
    cta: 'Start free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Student',
    price: '₹149',
    period: 'per month',
    description: 'Most popular',
    features: ['10 sessions per month', '5 questions per session', 'Full filler breakdown', 'Eye contact analysis', 'STAR structure scoring', 'Ideal answer generation'],
    cta: 'Get Student',
    href: '/signup?tier=student',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    description: 'For serious candidates',
    features: ['30 sessions per month', 'All 8 question categories', 'Company question sets', 'Progress trend charts', 'Weekly AI improvement plan', 'Resume-based questions'],
    cta: 'Get Pro',
    href: '/signup?tier=pro',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 mb-6">
          AI-powered interview coaching
        </span>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
          Every interview question<br />fits into 8 formats.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Learn the formats, not the answers. Practice under real pressure.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">START FREE</Button>
          </Link>
          <a href="#pricing">
            <Button variant="outline" size="lg">See pricing</Button>
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-500">No card needed · 2 free sessions · Cancel anytime</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">How it works</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { step: '1', title: 'Learn your formats', body: 'Before each session, you see the exact answer format for every question type. STAR for behavioural. PACE for situational.' },
              { step: '2', title: 'Answer under pressure', body: 'Timed questions. No hints. No skipping. Exam-mode pressure that simulates the real thing.' },
              { step: '3', title: 'Get your report', body: 'Filler words, speaking pace, eye contact, and structure scores. Know exactly what to improve.' },
            ].map(item => (
              <div key={item.step} className="rounded-xl bg-white border border-gray-200 p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Simple pricing</h2>
          <p className="text-center text-gray-600 mb-10">Upgrade anytime. Cancel anytime.</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map(tier => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.highlight
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.highlight && (
                  <span className="inline-flex self-start rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white mb-3">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500 ml-1">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <Button variant={tier.highlight ? 'primary' : 'outline'} fullWidth>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 Intervise. Built for people who want to get hired.
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify landing page renders**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Hero section with "Every interview question fits into 8 formats." headline, how-it-works section, and 3 pricing cards. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with hero, how-it-works, and pricing"
```

---

### Task 11: Auth pages (Sign Up / Login)

**Files:**
- Create: `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`, `components/auth/auth-form.tsx`

- [ ] **Step 1: Create components/auth/auth-form.tsx (shared form component)**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'

type Mode = 'signup' | 'login'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleGoogleAuth() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h2>
      {mode === 'signup' && (
        <p className="text-sm text-gray-500 mb-6">Free — no card required</p>
      )}

      <Button
        variant="outline"
        fullWidth
        onClick={handleGoogleAuth}
        disabled={loading}
        className="mb-4 gap-2"
      >
        <Chrome className="h-4 w-4" />
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-500">
          <span className="bg-white px-2">or</span>
        </div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {mode === 'signup' ? 'Create password' : 'Password'}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" fullWidth disabled={loading} size="lg">
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create app/(auth)/signup/page.tsx**

```typescript
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'

export default function SignUpPage() {
  return (
    <>
      <AuthForm mode="signup" />
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Create app/(auth)/login/page.tsx**

```typescript
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Sign up free
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Create the Google OAuth callback route**

Create `app/auth/callback/route.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
```

- [ ] **Step 5: Configure Google OAuth in Supabase dashboard**

In Supabase: Authentication → Providers → Google → Enable → add your Google Client ID and Secret.
Add `http://localhost:3000/auth/callback` and `https://intervise.vercel.app/auth/callback` to allowed redirect URLs.

- [ ] **Step 6: Commit**

```bash
git add app/'(auth)'/ components/auth/ app/auth/
git commit -m "feat: add signup and login pages with Google OAuth and email auth"
```

---

### Task 12: Onboarding (3-step form)

**Files:**
- Create: `app/(protected)/onboarding/page.tsx`, `app/api/onboarding/route.ts`

- [ ] **Step 1: Create app/api/onboarding/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { role_type, interview_date, biggest_weakness } = body

  const { error } = await supabase
    .from('profiles')
    .update({
      role_type: role_type ?? null,
      interview_date: interview_date ?? null,
      biggest_weakness: biggest_weakness ?? null,
      onboarding_complete: true,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create app/(protected)/onboarding/page.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const ROLE_OPTIONS = ['CS / IT', 'Marketing', 'Finance', 'Operations', 'Other']
const WEAKNESS_OPTIONS = ['Confidence', 'Structure', 'Vocabulary', 'All three']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [roleType, setRoleType] = useState<string | null>(null)
  const [interviewDate, setInterviewDate] = useState<string | null>(null)
  const [biggestWeakness, setBiggestWeakness] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleFinish(skip = false) {
    setSubmitting(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        skip
          ? { role_type: null, interview_date: null, biggest_weakness: null }
          : { role_type: roleType, interview_date: interviewDate, biggest_weakness: biggestWeakness }
      ),
    })
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s <= step ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Step 1 of 3</h2>
              <p className="text-2xl font-bold text-gray-900 mb-6">
                What type of role are you preparing for?
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setRoleType(opt)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      roleType === opt
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-brand-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => setStep(2)} disabled={!roleType}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Step 2 of 3</h2>
              <p className="text-2xl font-bold text-gray-900 mb-6">When is your interview?</p>
              <input
                type="date"
                value={interviewDate ?? ''}
                onChange={e => setInterviewDate(e.target.value || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                onClick={() => { setInterviewDate(null); setStep(3) }}
                className="block text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                Not scheduled yet
              </button>
              <Button fullWidth onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Step 3 of 3</h2>
              <p className="text-2xl font-bold text-gray-900 mb-6">
                What&apos;s your biggest weakness right now?
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {WEAKNESS_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setBiggestWeakness(opt)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      biggestWeakness === opt
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-brand-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => handleFinish(false)} disabled={!biggestWeakness || submitting}>
                Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => handleFinish(true)}
          className="mt-4 block w-full text-center text-sm text-gray-500 hover:text-gray-700"
          disabled={submitting}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/'(protected)'/onboarding/ app/api/onboarding/
git commit -m "feat: add 3-step onboarding flow"
```

---

### Task 13: Dashboard

**Files:**
- Create: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create app/(protected)/dashboard/page.tsx**

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import {
  PlayCircle,
  Clock,
  TrendingUp,
  Building2,
  BarChart2,
  Zap,
  User,
} from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const sessionsRemaining = profile.sessions_limit - profile.sessions_used_this_month
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  // Fetch last session grade
  const { data: lastSession } = await supabase
    .from('sessions')
    .select('overall_grade, created_at')
    .eq('user_id', user.id)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch avg filler count across last 3 sessions
  const { data: recentAnswers } = await supabase
    .from('answers')
    .select('filler_count, sessions!inner(user_id, status)')
    .eq('sessions.user_id', user.id)
    .eq('sessions.status', 'complete')
    .not('filler_count', 'is', null)
    .order('created_at', { ascending: false })
    .limit(15)

  const avgFiller =
    recentAnswers && recentAnswers.length > 0
      ? Math.round(
          recentAnswers.reduce((sum, a) => sum + (a.filler_count ?? 0), 0) /
            recentAnswers.length
        )
      : null

  const ctaItems = [
    { icon: Clock, label: 'Past Sessions', href: '#', color: 'text-teal-600 bg-teal-50', soon: true },
    { icon: User, label: 'Profile', href: '#', color: 'text-amber-600 bg-amber-50', soon: true },
    { icon: Building2, label: 'Company Prep', href: '#', color: 'text-brand-600 bg-brand-50', soon: true },
    { icon: BarChart2, label: 'Progress', href: '#', color: 'text-red-600 bg-red-50', soon: true },
    { icon: Zap, label: 'Upgrade Plan', href: '#', color: 'text-amber-600 bg-amber-50', soon: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-gray-600 mt-1">
          {sessionsRemaining > 0
            ? `${sessionsRemaining} session${sessionsRemaining === 1 ? '' : 's'} remaining this month`
            : 'No sessions remaining — upgrade to continue'}
        </p>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{sessionsRemaining}</p>
          <p className="text-sm text-gray-500 mt-1">Sessions left</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{lastSession?.overall_grade ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">Last grade</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{avgFiller !== null ? avgFiller : '—'}</p>
          <p className="text-sm text-gray-500 mt-1">Avg fillers</p>
        </Card>
      </div>

      {/* Primary CTA */}
      {sessionsRemaining > 0 ? (
        <Link href="/session/setup">
          <Card tinted className="cursor-pointer hover:bg-brand-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-brand-700">START MOCK INTERVIEW</p>
                <p className="text-sm text-brand-600">75 questions · AI analysis · Instant feedback</p>
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <Card tinted className="opacity-75">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-700">Sessions exhausted</p>
              <p className="text-sm text-gray-500">Upgrade to get more sessions this month</p>
            </div>
          </div>
        </Card>
      )}

      {/* Secondary CTAs grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {ctaItems.map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-3 opacity-60"
            title="Coming soon"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400">Coming soon</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the full auth flow works end-to-end**

```bash
npm run dev
```

1. Visit http://localhost:3000 — landing page renders
2. Click "Start free" → /signup — auth form renders
3. Sign up with email → redirects to /onboarding
4. Complete onboarding → redirects to /dashboard
5. Dashboard shows metrics, primary CTA, secondary CTA grid

Stop with Ctrl+C.

- [ ] **Step 3: Commit and push**

```bash
git add app/'(protected)'/dashboard/
git commit -m "feat: add dashboard with session metrics and CTAs"
git push origin main
```

---

## Plan A Complete

At this point the app is deployed-ready with:
- Full auth flow (Google OAuth + email)
- Onboarding
- Dashboard with real Supabase data
- 75 questions seeded

**Next:** Plan B — Session Setup → Format Briefing → Live Session → Report Card
