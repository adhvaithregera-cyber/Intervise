# Instant Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user clicks "Start Session" on the setup page, navigate to briefing instantly and show a skeleton while the server creates the session and selects questions.

**Architecture:** Extract session creation logic from the API route into a shared `lib/session.ts` server function. The briefing page server component calls this directly, so session creation happens during the page render while the loading skeleton is visible. The setup page client component removes the API call and does an immediate `router.push`.

**Tech Stack:** Next.js App Router server components, Supabase SSR, `unstable_cache`, TypeScript

---

### Task 1: Create `lib/session.ts` — shared session creation logic

**Files:**
- Create: `lib/session.ts`

Move `getCachedQuestions` and all session creation logic here so both the briefing page and the API route can use it without duplication.

- [ ] **Step 1: Create the file**

Create `lib/session.ts` with the following content:

```ts
import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Difficulty, Question } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Cache the full questions table for 1 hour — questions change rarely.
// Uses service role key (server-only) to bypass RLS for a public read.
export const getCachedQuestions = unstable_cache(
  async (): Promise<Question[]> => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase.from('questions').select('*')
    return (data ?? []) as Question[]
  },
  ['questions-all'],
  { revalidate: 3600 },
)

const TIER_QUESTION_COUNT: Record<string, number> = {
  free:    5,
  student: 5,
  pro:     5,
}

const FREE_CATEGORY_IDS = [1, 2]

export type CreateSessionResult =
  | { sessionId: string; questions: Question[] }
  | { error: 'quota_exceeded' | 'difficulty_not_allowed' | 'profile_not_found' | 'questions_failed' | 'session_failed' }

export async function createSession(
  userId: string,
  difficulty: Difficulty,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<CreateSessionResult> {
  // ── Fetch profile ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, sessions_used_this_month')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'profile_not_found' }

  // ── Fetch questions (cached) + history (user-specific) in parallel ─────
  let allQuestions: Question[]
  let history: { question_id: number }[] | null

  try {
    const [cachedQs, historyResult] = await Promise.all([
      getCachedQuestions(),
      supabase.from('question_history').select('question_id').eq('user_id', userId),
    ])
    allQuestions = cachedQs
    history = historyResult.data
    if (historyResult.error) return { error: 'questions_failed' }
  } catch {
    return { error: 'questions_failed' }
  }

  if (!allQuestions.length) return { error: 'questions_failed' }

  const askedIds = (history ?? []).map(row => row.question_id)

  // ── Filter pool by tier and difficulty ─────────────────────────────────
  let questionPool = allQuestions
  if (profile.tier === 'free') {
    questionPool = questionPool.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
  }
  if (difficulty === 'easy') {
    questionPool = questionPool.filter(q => q.difficulty === 'easy')
  } else if (difficulty === 'medium') {
    questionPool = questionPool.filter(q => q.difficulty !== 'hard')
  } else if (difficulty === 'hard') {
    questionPool = questionPool.filter(q => q.difficulty === 'hard')
  }

  const questionCount = TIER_QUESTION_COUNT[profile.tier] ?? 5

  if (questionPool.length < questionCount) {
    questionPool = profile.tier === 'free'
      ? allQuestions.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
      : allQuestions
  }

  const selectedQuestions = selectAdaptiveQuestions(questionPool, askedIds, questionCount)

  // ── Atomic: quota check + session creation ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionId, error: rpcError } = await (supabase as any)
    .rpc('create_session_atomic', { p_difficulty: difficulty })

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('quota_exceeded')) return { error: 'quota_exceeded' }
    if (msg.includes('difficulty_not_allowed')) return { error: 'difficulty_not_allowed' }
    console.error('[createSession] create_session_atomic error:', msg)
    return { error: 'session_failed' }
  }

  // ── Record question history (non-fatal) ────────────────────────────────
  await supabase
    .from('question_history')
    .insert(selectedQuestions.map(q => ({ user_id: userId, question_id: q.id })))

  return { sessionId, questions: selectedQuestions }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "C:\Users\Adhvaith\OneDrive\Desktop\Intervise" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `lib/session.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/session.ts
git commit -m "feat: extract createSession logic to lib/session.ts"
```

---

### Task 2: Update `app/api/session/start/route.ts` to use `lib/session.ts`

**Files:**
- Modify: `app/api/session/start/route.ts`

Replace the inline logic with a call to `createSession` from `lib/session.ts`. Keeps the API route functional and DRY.

- [ ] **Step 1: Rewrite the route to delegate to `createSession`**

Replace the entire contents of `app/api/session/start/route.ts` with:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/session'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { sessionStartSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:sessionStart`, RATE_LIMITS.sessionStart)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before starting another session.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)) } },
    )
  }

  // ── Parse & validate body ───────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = sessionStartSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await createSession(user.id, parsed.data.difficulty, supabase)

  if ('error' in result) {
    if (result.error === 'quota_exceeded') {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 403 })
    }
    if (result.error === 'difficulty_not_allowed') {
      return NextResponse.json({ error: 'difficulty_not_allowed' }, { status: 403 })
    }
    if (result.error === 'profile_not_found') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: result.sessionId, questions: result.questions })
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/session/start/route.ts
git commit -m "refactor: api/session/start delegates to lib/session createSession"
```

---

### Task 3: Rewrite `app/(protected)/session/briefing/page.tsx`

**Files:**
- Modify: `app/(protected)/session/briefing/page.tsx`

Accept `difficulty` from searchParams. Call `createSession` server-side. Redirect on errors. Render the same briefing UI with real data.

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `app/(protected)/session/briefing/page.tsx` with:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mic, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/session'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'mixed', 'hard']

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>
}) {
  const { difficulty: rawDifficulty } = await searchParams

  // Validate difficulty param
  if (!rawDifficulty || !VALID_DIFFICULTIES.includes(rawDifficulty as Difficulty)) {
    redirect('/session/setup')
  }
  const difficulty = rawDifficulty as Difficulty

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Create session server-side — this is what happens while the skeleton shows
  const result = await createSession(user.id, difficulty, supabase)

  if ('error' in result) {
    if (result.error === 'quota_exceeded') {
      redirect('/dashboard?error=quota_exceeded')
    }
    if (result.error === 'difficulty_not_allowed') {
      redirect('/session/setup')
    }
    redirect('/dashboard?error=session_failed')
  }

  const { sessionId, questions } = result
  const firstQuestion = questions[0]
  if (!firstQuestion) redirect('/session/setup')

  const questionIds = questions.map(q => q.id).join(',')
  const formatLabel = firstQuestion.answer_format.split(' ')[0]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <FadeIn delay={0}>
        <div>
          <h1 className="text-2xl font-bold text-white">Get ready for your session</h1>
          <p className="mt-1 text-sm text-white/55 font-medium">
            {questions.length} questions · ~{Math.ceil(questions.length * 1.5)} minutes
          </p>
        </div>
      </FadeIn>

      {/* Format briefing card */}
      <FadeIn delay={0.08}>
        <div
          className="space-y-3 p-6"
          style={{ ...CARD_STYLE, borderLeft: '3px solid #F9C125' }}
        >
          <Badge variant="brand">{formatLabel}</Badge>
          <h2 className="text-lg font-semibold text-white">Your answer format</h2>
          <p className="text-sm italic text-[#F9C125]/80">{firstQuestion.answer_format}</p>
          <p className="text-sm text-white/80">
            Use this structure to organise your answer. Each of your {questions.length} questions will guide you through it.
          </p>
        </div>
      </FadeIn>

      {/* What to expect section */}
      <FadeIn delay={0.16}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">What to expect</h2>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              You&apos;ll have 5 seconds to read each question before recording starts automatically.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <Mic className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              Recording stops when the timer runs out. You can also press &apos;Done&apos; at any time to stop early.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <BarChart2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              After each answer, you&apos;ll see your filler word count and speaking pace instantly.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Start Interview CTA */}
      <FadeIn delay={0.24}>
        <div>
          <Link href={`/session/live?session_id=${sessionId}&q=${questionIds}`}>
            <button className="bg-[#F9C125] text-[#1C0A00] font-bold rounded-xl px-8 py-3.5 text-base shadow-lg shadow-[#F9C125]/25 hover:brightness-110 transition-all">
              Start Interview
            </button>
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/session/briefing/page.tsx"
git commit -m "feat: briefing page creates session server-side for instant navigation"
```

---

### Task 4: Simplify `app/(protected)/session/setup/setup-client.tsx`

**Files:**
- Modify: `app/(protected)/session/setup/setup-client.tsx`

Remove the API call and all associated state. Navigate immediately on click.

- [ ] **Step 1: Remove API-related state and handler, replace with immediate push**

Make these targeted edits to `app/(protected)/session/setup/setup-client.tsx`:

**Remove** the `Question` type alias (line 11) — no longer needed:
```ts
// DELETE this line:
type Question = { id: number }
```

**Replace** the state declarations (lines 56-60):
```ts
// OLD:
const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
const [micPerm, setMicPerm] = useState<PermState>('idle')
const [cameraPerm, setCameraPerm] = useState<PermState>('idle')
const [starting, setStarting] = useState(false)
const [error, setError] = useState<string | null>(null)

// NEW:
const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
const [micPerm, setMicPerm] = useState<PermState>('idle')
const [cameraPerm, setCameraPerm] = useState<PermState>('idle')
```

**Replace** the entire `handleStart` function (lines 84-110):
```ts
// OLD:
async function handleStart() {
  if (!difficulty || micPerm !== 'granted') return
  setStarting(true)
  setError(null)
  try {
    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'quota_exceeded') {
        setError("You've used all your sessions this month. Upgrade your plan to continue.")
      } else {
        setError('Something went wrong. Please try again.')
      }
      return
    }
    const questionIds = (data.questions as Question[]).map((q) => q.id).join(',')
    router.push(`/session/briefing?session_id=${data.sessionId}&q=${questionIds}`)
  } catch {
    setError('Something went wrong. Please try again.')
  } finally {
    setStarting(false)
  }
}

// NEW:
function handleStart() {
  if (!difficulty || micPerm !== 'granted') return
  router.push(`/session/briefing?difficulty=${difficulty}`)
}
```

**Replace** the `canStart` line (line 112):
```ts
// OLD:
const canStart = difficulty !== null && micPerm === 'granted' && !starting

// NEW:
const canStart = difficulty !== null && micPerm === 'granted'
```

**Replace** the Start button and error message at the bottom (lines 245-256):
```tsx
// OLD:
<button
  disabled={!canStart}
  onClick={handleStart}
  className="w-full rounded-xl bg-[#F9C125] py-3.5 text-base font-bold text-[#1C0A00] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
>
  {starting ? 'Starting…' : 'Start Session'}
</button>

{error && (
  <p className="mt-3 text-center text-sm text-red-300">{error}</p>
)}

// NEW:
<button
  disabled={!canStart}
  onClick={handleStart}
  className="w-full rounded-xl bg-[#F9C125] py-3.5 text-base font-bold text-[#1C0A00] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
>
  Start Session
</button>
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/session/setup/setup-client.tsx"
git commit -m "feat: setup page navigates instantly without waiting for API"
```

---

### Task 5: Add quota error banner to `app/(protected)/dashboard/page.tsx`

**Files:**
- Modify: `app/(protected)/dashboard/page.tsx`

When the briefing page redirects with `?error=quota_exceeded`, show a banner above the Start CTA.

- [ ] **Step 1: Add `searchParams` prop and read the error**

Change the function signature from:
```tsx
export default async function DashboardPage() {
```
to:
```tsx
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: pageError } = await searchParams
```

- [ ] **Step 2: Render a banner when quota is exceeded**

Find the `{/* Primary CTA */}` block. It starts with `<FadeIn>` and contains a `<div className="flex items-center gap-4">`. Insert the banner `<div>` as the first child of that `<div>`, before the `{exhausted ? ...}` ternary:

```tsx
{/* Primary CTA */}
<FadeIn>
  <div className="flex flex-col gap-3">
    {pageError === 'quota_exceeded' && (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
        You&apos;ve used all your sessions this month. Upgrade your plan to continue.
      </div>
    )}
    <div className="flex items-center gap-4">
      {exhausted ? (
        <>
          <button
            disabled
            className="rounded-xl px-6 py-3 text-base font-semibold cursor-not-allowed"
            style={{ backgroundColor: 'rgba(28,10,0,0.4)', border: '1px solid rgba(249,193,37,0.15)', color: 'rgba(255,255,255,0.35)' }}
          >
            Start practice session
          </button>
          <p className="text-sm font-medium" style={{ color: 'rgba(28,10,0,0.75)' }}>
            All sessions used this month.{' '}
            <Link href="/#pricing" className="font-bold underline hover:opacity-70 transition-opacity" style={{ color: '#1C0A00' }}>Upgrade →</Link>
          </p>
        </>
      ) : (
        <Link
          href="/session/setup"
          className="inline-flex items-center rounded-xl bg-[#F9C125] px-6 py-3 text-base font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/25"
        >
          Start practice session
        </Link>
      )}
    </div>
  </div>
</FadeIn>
```

The only structural changes are: (1) add `pageError` banner div, (2) change outer `<div className="flex items-center gap-4">` to `<div className="flex flex-col gap-3">` and wrap it in a new `<div className="flex items-center gap-4">` inside. Everything else stays identical.

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/(protected)/dashboard/page.tsx"
git commit -m "feat: show quota exceeded banner on dashboard after redirect from briefing"
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test the happy path**

1. Log in, go to dashboard
2. Click "Start practice session" → lands on setup page
3. Select a difficulty, grant microphone
4. Click "Start Session" — page should navigate **immediately** to briefing, showing the skeleton while the server works
5. Briefing content loads with correct question format
6. Click "Start Interview" → live session starts

- [ ] **Step 3: Test quota exceeded**

1. Use an account that has exhausted its monthly sessions
2. Go to setup, select difficulty, grant mic, click "Start Session"
3. Should redirect to `/dashboard?error=quota_exceeded`
4. Dashboard should show the red banner

- [ ] **Step 4: Test invalid URL**

Navigate directly to `/session/briefing` (no params) → should redirect to `/session/setup`
Navigate to `/session/briefing?difficulty=invalid` → should redirect to `/session/setup`

- [ ] **Step 5: Commit if all tests pass**

```bash
git add -A
git commit -m "test: smoke test instant navigation — all flows verified"
```
