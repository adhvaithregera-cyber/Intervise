# Intervise — Plan B: Session Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete session loop — Session Setup (difficulty + mic) → Format Briefing → Live Session (recording + AssemblyAI transcription + filler/WPM metrics) → Report Card — with feature-gated output by tier.

**Architecture:** Session is created server-side when the user grants mic permission. `session_id` flows through the URL: `/session/[id]/briefing` → `/session/[id]/live` → `/session/report/[id]`. Audio is recorded per-answer using MediaRecorder, sent as a blob to `/api/session/transcribe`, and AssemblyAI returns the transcript with word timestamps. Filler detection and WPM calculation happen server-side. MediaPipe runs in-browser for Student+ users.

**Tech Stack:** Next.js 15 App Router, Supabase, AssemblyAI SDK (`assemblyai`), MediaPipe Tasks Vision (`@mediapipe/tasks-vision`), Vitest for unit tests

---

### Task 1: Filler detection and WPM calculation (TDD)

**Files:**
- Create: `lib/analysis.ts`, `tests/lib/analysis.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/analysis.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { detectFillers, calculateWpm, computeGrade } from '@/lib/analysis'

describe('detectFillers', () => {
  it('counts individual filler words', () => {
    const result = detectFillers(['um', 'I', 'think', 'uh', 'we', 'should', 'um', 'go'])
    expect(result.filler_count).toBe(3)
    expect(result.filler_breakdown).toEqual({ um: 2, uh: 1 })
  })

  it('counts multi-word fillers', () => {
    const result = detectFillers(['you', 'know', 'this', 'is', 'you', 'know', 'important'])
    expect(result.filler_count).toBe(2)
    expect(result.filler_breakdown).toEqual({ 'you know': 2 })
  })

  it('returns zero counts for clean speech', () => {
    const result = detectFillers(['I', 'prepared', 'thoroughly', 'for', 'this', 'role'])
    expect(result.filler_count).toBe(0)
    expect(result.filler_breakdown).toEqual({})
  })

  it('is case insensitive', () => {
    const result = detectFillers(['UM', 'this', 'UH', 'that'])
    expect(result.filler_count).toBe(2)
    expect(result.filler_breakdown).toEqual({ um: 1, uh: 1 })
  })
})

describe('calculateWpm', () => {
  it('calculates words per minute correctly', () => {
    expect(calculateWpm(60, 30)).toBe(120)
  })

  it('rounds to nearest integer', () => {
    expect(calculateWpm(7, 3)).toBe(140)
  })

  it('returns 0 for zero duration', () => {
    expect(calculateWpm(100, 0)).toBe(0)
  })
})

describe('computeGrade', () => {
  it('returns A for ideal WPM and low fillers', () => {
    expect(computeGrade(140, 0.01)).toBe('A')
  })

  it('returns F for very high filler rate', () => {
    expect(computeGrade(130, 0.20)).toBe('F')
  })

  it('returns C for average performance', () => {
    const grade = computeGrade(110, 0.05)
    expect(['B', 'C']).toContain(grade)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test tests/lib/analysis.test.ts
```

Expected: FAIL — `detectFillers` is not defined.

- [ ] **Step 3: Implement lib/analysis.ts**

```typescript
// Single-word fillers (lowercase)
const SINGLE_FILLERS = new Set(['um', 'uh', 'like', 'basically', 'literally', 'actually', 'right', 'so'])
// Multi-word fillers (space-separated, lowercase)
const MULTI_FILLERS = ['you know', 'i mean', 'kind of', 'sort of']

type FillerResult = {
  filler_count: number
  filler_breakdown: Record<string, number>
}

export function detectFillers(words: string[]): FillerResult {
  const lower = words.map(w => w.toLowerCase())
  const breakdown: Record<string, number> = {}
  const consumed = new Set<number>()

  // Check multi-word fillers first
  for (const multi of MULTI_FILLERS) {
    const parts = multi.split(' ')
    for (let i = 0; i <= lower.length - parts.length; i++) {
      if (parts.every((p, j) => lower[i + j] === p)) {
        breakdown[multi] = (breakdown[multi] ?? 0) + 1
        for (let j = 0; j < parts.length; j++) consumed.add(i + j)
      }
    }
  }

  // Check single-word fillers
  lower.forEach((word, i) => {
    if (!consumed.has(i) && SINGLE_FILLERS.has(word)) {
      breakdown[word] = (breakdown[word] ?? 0) + 1
    }
  })

  const filler_count = Object.values(breakdown).reduce((sum, n) => sum + n, 0)
  return { filler_count, filler_breakdown: breakdown }
}

export function calculateWpm(wordCount: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0
  return Math.round((wordCount / durationSeconds) * 60)
}

// Placeholder grading formula — replace after live testing
export function computeGrade(wpm: number, fillerRate: number): string {
  const wpmScore =
    wpm >= 120 && wpm <= 160 ? 100
    : wpm >= 100 && wpm < 120 ? 80
    : wpm > 160 && wpm <= 190 ? 75
    : 50

  const fillerScore =
    fillerRate < 0.02 ? 100
    : fillerRate < 0.05 ? 80
    : fillerRate < 0.08 ? 60
    : fillerRate < 0.12 ? 40
    : 20

  const total = (wpmScore + fillerScore) / 2

  if (total >= 90) return 'A'
  if (total >= 75) return 'B'
  if (total >= 60) return 'C'
  if (total >= 45) return 'D'
  return 'F'
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/lib/analysis.test.ts
```

Expected:
```
✓ tests/lib/analysis.test.ts (9)
Test Files  1 passed (1)
Tests       9 passed (9)
```

- [ ] **Step 5: Commit**

```bash
git add lib/analysis.ts tests/lib/analysis.test.ts
git commit -m "feat: add filler detection, WPM calculation, and grading with tests"
```

---

### Task 2: AssemblyAI transcription client

**Files:**
- Create: `lib/assemblyai.ts`

- [ ] **Step 1: Install AssemblyAI SDK**

```bash
npm install assemblyai
```

- [ ] **Step 2: Create lib/assemblyai.ts**

```typescript
import { AssemblyAI } from 'assemblyai'

export function getAssemblyClient() {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY is not set')
  }
  return new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY })
}

export type TranscriptResult = {
  text: string
  words: string[]
  durationSeconds: number
}

export async function transcribeAudioBlob(audioBlob: Buffer): Promise<TranscriptResult> {
  const client = getAssemblyClient()

  const transcript = await client.transcripts.transcribe({
    audio: audioBlob,
    speech_model: 'best',
  })

  if (transcript.status === 'error' || !transcript.text) {
    throw new Error(transcript.error ?? 'Transcription failed')
  }

  const words = (transcript.words ?? []).map(w => w.text)
  const lastWord = transcript.words?.at(-1)
  const durationSeconds = lastWord ? lastWord.end / 1000 : 0

  return {
    text: transcript.text,
    words,
    durationSeconds,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/assemblyai.ts
git commit -m "feat: add AssemblyAI transcription client"
```

---

### Task 3: Session start API route

**Files:**
- Create: `app/api/session/start/route.ts`

- [ ] **Step 1: Create app/api/session/start/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { selectAdaptiveQuestions } from '@/lib/questions'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { difficulty } = body as { difficulty: 'easy' | 'medium' | 'mixed' }

  // Fetch profile to check session limit and tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, sessions_limit, sessions_used_this_month')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.sessions_used_this_month >= profile.sessions_limit) {
    return NextResponse.json({ error: 'Session limit reached' }, { status: 403 })
  }

  const tier = profile.tier as 'free' | 'student' | 'pro'

  // Determine question pool based on tier
  const categoryIds = tier === 'free' ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8]
  const questionCount = tier === 'free' ? 3 : tier === 'student' ? 5 : 5

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*')
    .in('category_id', categoryIds)
    .order('rank')

  const { data: historyRows } = await supabase
    .from('question_history')
    .select('question_id')
    .eq('user_id', user.id)

  const askedIds = (historyRows ?? []).map(h => h.question_id)
  const selected = selectAdaptiveQuestions(allQuestions ?? [], askedIds, questionCount)

  // Create session row
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      difficulty,
      status: 'in_progress',
      tier_at_time: tier,
    })
    .select()
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Insert question history entries
  if (selected.length > 0) {
    await supabase.from('question_history').insert(
      selected.map(q => ({ user_id: user.id, question_id: q.id }))
    )
  }

  // Increment sessions_used_this_month atomically
  await supabase.rpc('increment_sessions_used', { user_id: user.id })

  return NextResponse.json({
    session_id: session.id,
    questions: selected,
    tier,
  })
}
```

- [ ] **Step 2: Create the Supabase RPC for incrementing sessions**

In Supabase SQL Editor run:
```sql
create or replace function public.increment_sessions_used(user_id uuid)
returns void
language sql
security definer
as $$
  update public.profiles
  set sessions_used_this_month = sessions_used_this_month + 1
  where id = user_id;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add app/api/session/
git commit -m "feat: add session start API route with adaptive question selection"
```

---

### Task 4: AssemblyAI transcription API route

**Files:**
- Create: `app/api/session/transcribe/route.ts`

- [ ] **Step 1: Create app/api/session/transcribe/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { transcribeAudioBlob } from '@/lib/assemblyai'
import { detectFillers, calculateWpm } from '@/lib/analysis'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const audio = formData.get('audio') as File | null
  const sessionId = formData.get('session_id') as string | null
  const questionId = formData.get('question_id') as string | null
  const answerIndex = formData.get('answer_index') as string | null
  const eyeContactPct = formData.get('eye_contact_pct') as string | null
  const durationStr = formData.get('duration_seconds') as string | null

  if (!audio || !sessionId || !questionId || !answerIndex || !durationStr) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const durationSeconds = parseInt(durationStr, 10)

  // Verify session belongs to this user
  const { data: session } = await supabase
    .from('sessions')
    .select('id, tier_at_time, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Convert audio File to Buffer for AssemblyAI
  const audioBuffer = Buffer.from(await audio.arrayBuffer())

  let transcript: string | null = null
  let words: string[] = []
  let actualDuration = durationSeconds
  let transcriptionFailed = false
  let fillerCount: number | null = null
  let fillerBreakdown: Record<string, number> | null = null
  let wpm: number | null = null

  try {
    const result = await transcribeAudioBlob(audioBuffer)
    transcript = result.text
    words = result.words
    actualDuration = result.durationSeconds > 0 ? result.durationSeconds : durationSeconds

    const fillerResult = detectFillers(words)
    fillerCount = fillerResult.filler_count
    fillerBreakdown = fillerResult.filler_breakdown

    wpm = calculateWpm(words.length, actualDuration)
  } catch {
    transcriptionFailed = true
  }

  const { error } = await supabase.from('answers').insert({
    session_id: sessionId,
    question_id: parseInt(questionId, 10),
    answer_index: parseInt(answerIndex, 10),
    transcript,
    transcription_failed: transcriptionFailed,
    filler_count: fillerCount,
    filler_breakdown: fillerBreakdown,
    wpm,
    eye_contact_pct: eyeContactPct ? parseInt(eyeContactPct, 10) : null,
    duration_seconds: durationSeconds,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({
    transcript,
    transcription_failed: transcriptionFailed,
    filler_count: fillerCount,
    filler_breakdown: fillerBreakdown,
    wpm,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/session/transcribe/
git commit -m "feat: add AssemblyAI transcription API route with filler/WPM analysis"
```

---

### Task 5: Session setup page

**Files:**
- Create: `app/(protected)/session/setup/page.tsx`

- [ ] **Step 1: Create app/(protected)/session/setup/page.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Difficulty = 'easy' | 'medium' | 'mixed'

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Cat 1 & 2 questions · shorter time limits' },
  { value: 'medium', label: 'Medium', description: 'Wider category mix · standard time limits' },
  { value: 'mixed', label: 'Mixed', description: 'All categories · pressure time limits' },
]

export default function SessionSetupPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAllowMic() {
    setMicState('requesting')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicState('granted')
    } catch {
      setMicState('denied')
    }
  }

  async function handleStartSession() {
    if (micState !== 'granted') return
    setStarting(true)
    setError(null)

    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    })

    if (!res.ok) {
      const data = await res.json()
      if (res.status === 403) {
        router.push('/#pricing')
        return
      }
      setError(data.error ?? 'Failed to start session')
      setStarting(false)
      return
    }

    const { session_id } = await res.json()
    router.push(`/session/${session_id}/briefing`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New session</h1>
      </div>

      {/* Difficulty selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select difficulty</p>
        <div className="flex gap-3">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`flex-1 rounded-xl border p-4 text-left transition-colors ${
                difficulty === d.value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{d.label}</p>
              <p className="text-xs text-gray-500 mt-1">{d.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mic permission card */}
      <Card tinted>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Microphone access required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Intervise needs your microphone to analyse your speech. Audio is processed instantly and never stored.
            </p>

            {micState === 'idle' && (
              <Button onClick={handleAllowMic} size="sm">
                Allow microphone access
              </Button>
            )}
            {micState === 'requesting' && (
              <p className="text-sm text-brand-600 font-medium">Waiting for permission…</p>
            )}
            {micState === 'granted' && (
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                ✓ Microphone ready
              </p>
            )}
            {micState === 'denied' && (
              <div>
                <p className="text-sm text-red-600 font-medium mb-2">Microphone access denied</p>
                <p className="text-sm text-gray-600">
                  To enable: click the lock icon in your browser address bar → Site settings → Microphone → Allow → reload the page.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield className="h-4 w-4 text-gray-400" />
        <span>Your privacy is protected. Camera is optional and never uploaded.</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {micState === 'granted' && (
        <Button fullWidth size="lg" onClick={handleStartSession} disabled={starting}>
          {starting ? 'Starting…' : 'Start session →'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/'(protected)'/session/setup/
git commit -m "feat: add session setup page with difficulty selector and mic permission"
```

---

### Task 6: Format briefing card page

**Files:**
- Create: `app/(protected)/session/[id]/briefing/page.tsx`, `components/session/format-card.tsx`

- [ ] **Step 1: Create components/session/format-card.tsx**

```typescript
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type FormatCardProps = {
  categoryName: string
  answerFormat: string
}

export function FormatCard({ categoryName, answerFormat }: FormatCardProps) {
  return (
    <Card tinted className="space-y-3">
      <Badge variant="brand">{categoryName}</Badge>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Answer format
        </p>
        <p className="text-gray-800 leading-relaxed">{answerFormat}</p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create app/(protected)/session/[id]/briefing/page.tsx**

```typescript
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormatCard } from '@/components/session/format-card'
import { Button } from '@/components/ui/button'
import type { Question } from '@/types/database'

const SESSION_STORAGE_KEY = (id: string) => `intervise_session_${id}`

export default function BriefingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isFirstSession, setIsFirstSession] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient()

      // Load questions for this session from question_history joined via session
      const { data: session } = await supabase
        .from('sessions')
        .select('tier_at_time')
        .eq('id', id)
        .single()

      if (!session) { router.push('/dashboard'); return }

      // Get questions for this session via question_history (most recent entries)
      const { data: history } = await supabase
        .from('question_history')
        .select('question_id, asked_at')
        .order('asked_at', { ascending: false })

      // Get the session's question IDs by matching them to answers OR by time proximity
      // Fetch all questions that match the history ids for this session's tier
      const recentIds = (history ?? []).slice(0, session.tier_at_time === 'free' ? 3 : 5).map(h => h.question_id)

      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .in('id', recentIds)

      setQuestions(qs ?? [])
      sessionStorage.setItem(SESSION_STORAGE_KEY(id), JSON.stringify(qs ?? []))

      // Check if this is first ever session
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'complete')

      const isFirst = (count ?? 0) === 0
      setIsFirstSession(isFirst)

      if (isFirst) {
        setCountdown(10)
      } else {
        setReady(true)
      }

      setLoading(false)
    }

    loadSession()
  }, [id, router])

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) setReady(true)
      return
    }
    const timer = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Get unique categories for this session
  const uniqueCategories = [...new Map(questions.map(q => [q.category_id, q])).values()]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading your session…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s session</h1>
        <p className="text-gray-600 mt-1">
          {questions.length} questions across {uniqueCategories.length} categor{uniqueCategories.length === 1 ? 'y' : 'ies'}.
          Read the formats before you start.
        </p>
      </div>

      <div className="space-y-4">
        {uniqueCategories.map(q => (
          <FormatCard
            key={q.category_id}
            categoryName={q.category_name}
            answerFormat={q.answer_format}
          />
        ))}
      </div>

      <div className="pt-2">
        {!ready ? (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Read the formats above — button unlocks in {countdown}s</p>
            <Button fullWidth size="lg" disabled>
              I&apos;m ready — start session →
            </Button>
          </div>
        ) : (
          <Button fullWidth size="lg" onClick={() => router.push(`/session/${id}/live`)}>
            I&apos;m ready — start session →
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/'(protected)'/session/ components/session/format-card.tsx
git commit -m "feat: add format briefing card with 10s delay for first session"
```

---

### Task 7: Live session page with audio recording

**Files:**
- Create: `app/(protected)/session/[id]/live/page.tsx`, `components/session/audio-recorder.tsx`, `components/session/waveform.tsx`, `components/ui/timer.tsx`

- [ ] **Step 1: Create components/ui/timer.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type TimerProps = {
  totalSeconds: number
  onExpire: () => void
  running: boolean
}

export function Timer({ totalSeconds, onExpire, running }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, remaining, onExpire])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining <= 15

  return (
    <span
      className={cn(
        'font-mono text-2xl font-bold tabular-nums transition-colors',
        isUrgent ? 'text-red-600' : 'text-gray-900'
      )}
    >
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  )
}
```

- [ ] **Step 2: Create components/session/waveform.tsx**

```typescript
'use client'

import { useEffect, useRef } from 'react'

type WaveformProps = {
  stream: MediaStream | null
}

export function Waveform({ stream }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !canvasRef.current) return
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')!
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        canvasCtx.fillStyle = `rgba(147, 51, 234, ${0.5 + dataArray[i] / 512})`
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      ctx.close()
    }
  }, [stream])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full max-w-sm rounded-lg bg-brand-50"
    />
  )
}
```

- [ ] **Step 3: Create components/session/audio-recorder.tsx**

```typescript
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type AudioRecorderProps = {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void
  running: boolean
}

export function useAudioRecorder({ onRecordingComplete, running }: AudioRecorderProps) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let mediaStream: MediaStream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      mediaStream = s
      setStream(s)
      const recorder = new MediaRecorder(s, { mimeType: 'audio/webm;codecs=opus' })
      recorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = (Date.now() - startTimeRef.current) / 1000
        onRecordingComplete(blob, duration)
        chunksRef.current = []
      }
    })

    return () => {
      mediaStream?.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const recorder = recorderRef.current
    if (!recorder) return

    if (running && recorder.state === 'inactive') {
      chunksRef.current = []
      startTimeRef.current = Date.now()
      recorder.start()
    } else if (!running && recorder.state === 'recording') {
      recorder.stop()
    }
  }, [running])

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [])

  return { stream, stopRecording }
}
```

- [ ] **Step 4: Create app/(protected)/session/[id]/live/page.tsx**

```typescript
'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAudioRecorder } from '@/components/session/audio-recorder'
import { Waveform } from '@/components/session/waveform'
import { Timer } from '@/components/ui/timer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Question } from '@/types/database'

const SESSION_STORAGE_KEY = (id: string) => `intervise_session_${id}`

export default function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [recording, setRecording] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY(id))
    if (stored) {
      setQuestions(JSON.parse(stored))
    } else {
      router.push('/dashboard')
    }
  }, [id, router])

  const currentQuestion = questions[currentIndex]

  const handleRecordingComplete = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      if (!currentQuestion) return
      setProcessing(true)

      const formData = new FormData()
      formData.append('audio', blob, 'answer.webm')
      formData.append('session_id', id)
      formData.append('question_id', String(currentQuestion.id))
      formData.append('answer_index', String(currentIndex))
      formData.append('duration_seconds', String(Math.round(durationSeconds)))

      await fetch('/api/session/transcribe', { method: 'POST', body: formData })

      const isLast = currentIndex === questions.length - 1

      if (isLast) {
        // Mark session complete and navigate to report
        const supabase = createClient()
        await supabase
          .from('sessions')
          .update({ status: 'complete', completed_at: new Date().toISOString() })
          .eq('id', id)

        // Compute grade
        const { data: answers } = await supabase
          .from('answers')
          .select('filler_count, wpm, duration_seconds')
          .eq('session_id', id)
          .not('wpm', 'is', null)

        if (answers && answers.length > 0) {
          const totalWords = answers.reduce((sum, a) => sum + Math.round(((a.wpm ?? 0) * (a.duration_seconds ?? 0)) / 60), 0)
          const totalFillers = answers.reduce((sum, a) => sum + (a.filler_count ?? 0), 0)
          const fillerRate = totalWords > 0 ? totalFillers / totalWords : 0
          const avgWpm = Math.round(answers.reduce((sum, a) => sum + (a.wpm ?? 0), 0) / answers.length)

          const { computeGrade } = await import('@/lib/analysis')
          const grade = computeGrade(avgWpm, fillerRate)
          await supabase.from('sessions').update({ overall_grade: grade }).eq('id', id)
        }

        router.push(`/session/report/${id}`)
      } else {
        setCurrentIndex(i => i + 1)
        setProcessing(false)
        setRecording(true)
      }
    },
    [currentQuestion, currentIndex, questions.length, id, router]
  )

  const { stream, stopRecording } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    running: recording && !processing,
  })

  const handleDone = useCallback(() => {
    setRecording(false)
    stopRecording()
  }, [stopRecording])

  const handleTimerExpire = useCallback(() => {
    if (!processing) handleDone()
  }, [processing, handleDone])

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading session…</p>
      </div>
    )
  }

  if (processing && currentIndex === questions.length - 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="text-lg font-semibold text-gray-900">Analysing your session…</p>
        <p className="text-sm text-gray-500">This usually takes 10–20 seconds</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600">Recording</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      {/* Category badge + timer */}
      <div className="flex items-center justify-between">
        <Badge>{currentQuestion.category_name}</Badge>
        <Timer
          totalSeconds={currentQuestion.time_limit_seconds}
          onExpire={handleTimerExpire}
          running={recording && !processing}
        />
      </div>

      {/* Question */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-2xl font-semibold text-gray-900 leading-snug">
          {currentQuestion.question_text}
        </p>
      </div>

      {/* Waveform */}
      <div className="flex justify-center">
        <Waveform stream={stream} />
      </div>

      {/* Done button */}
      {!processing && (
        <Button fullWidth size="lg" onClick={handleDone}>
          Done answering →
        </Button>
      )}
      {processing && (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span className="text-sm text-gray-600">Processing…</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/'(protected)'/session/'[id]'/ components/session/ components/ui/timer.tsx
git commit -m "feat: add live session with audio recording, timer, and waveform"
```

---

### Task 8: Report card

**Files:**
- Create: `app/(protected)/session/report/[id]/page.tsx`, `components/report/grade-circle.tsx`, `components/report/metric-card.tsx`, `components/report/filler-breakdown.tsx`

- [ ] **Step 1: Create components/report/grade-circle.tsx**

```typescript
import { cn } from '@/lib/utils'

const gradeColors: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-300',
  B: 'bg-blue-100 text-blue-700 border-blue-300',
  C: 'bg-amber-100 text-amber-700 border-amber-300',
  D: 'bg-orange-100 text-orange-700 border-orange-300',
  F: 'bg-red-100 text-red-700 border-red-300',
}

export function GradeCircle({ grade }: { grade: string | null }) {
  const colors = grade ? (gradeColors[grade] ?? gradeColors.C) : 'bg-gray-100 text-gray-500 border-gray-300'
  return (
    <div
      className={cn(
        'flex h-24 w-24 items-center justify-center rounded-full border-4 text-4xl font-bold',
        colors
      )}
    >
      {grade ?? '—'}
    </div>
  )
}
```

- [ ] **Step 2: Create components/report/metric-card.tsx**

```typescript
import { Card } from '@/components/ui/card'

type MetricCardProps = {
  label: string
  value: string | number | null
  sublabel?: string
  locked?: boolean
}

export function MetricCard({ label, value, sublabel, locked }: MetricCardProps) {
  return (
    <Card className="text-center relative overflow-hidden">
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-10">
          <span className="text-xs font-medium text-gray-500">Student+ only</span>
        </div>
      )}
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
    </Card>
  )
}
```

- [ ] **Step 3: Create components/report/filler-breakdown.tsx**

```typescript
type FillerBreakdownProps = {
  breakdown: Record<string, number> | null
  totalCount: number | null
}

export function FillerBreakdown({ breakdown, totalCount }: FillerBreakdownProps) {
  if (!breakdown || totalCount === null) {
    return <p className="text-sm text-gray-500">No filler data available</p>
  }

  if (totalCount === 0) {
    return <p className="text-sm text-green-600 font-medium">No filler words detected ✓</p>
  }

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {totalCount} filler word{totalCount === 1 ? '' : 's'} detected
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([word, count]) => (
          <span
            key={word}
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm"
          >
            <span className="font-medium text-red-700">&quot;{word}&quot;</span>
            <span className="text-red-500">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create app/(protected)/session/report/[id]/page.tsx**

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GradeCircle } from '@/components/report/grade-circle'
import { MetricCard } from '@/components/report/metric-card'
import { FillerBreakdown } from '@/components/report/filler-breakdown'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/dashboard')

  const { data: answers } = await supabase
    .from('answers')
    .select('*, questions(question_text, category_name)')
    .eq('session_id', id)
    .order('answer_index')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.tier ?? 'free'
  const isPaid = tier === 'student' || tier === 'pro'

  // Aggregate metrics across all answers
  const answersWithData = (answers ?? []).filter(a => a.wpm !== null)
  const avgWpm =
    answersWithData.length > 0
      ? Math.round(answersWithData.reduce((s, a) => s + (a.wpm ?? 0), 0) / answersWithData.length)
      : null

  const totalFillers = (answers ?? []).reduce((s, a) => s + (a.filler_count ?? 0), 0)
  const aggregatedBreakdown: Record<string, number> = {}
  for (const answer of answers ?? []) {
    if (answer.filler_breakdown) {
      for (const [word, count] of Object.entries(answer.filler_breakdown as Record<string, number>)) {
        aggregatedBreakdown[word] = (aggregatedBreakdown[word] ?? 0) + count
      }
    }
  }

  const avgEyeContact =
    isPaid && answers && answers.some(a => a.eye_contact_pct !== null)
      ? Math.round(answers.filter(a => a.eye_contact_pct !== null).reduce((s, a) => s + (a.eye_contact_pct ?? 0), 0) / answers.filter(a => a.eye_contact_pct !== null).length)
      : null

  const wpmLabel =
    avgWpm === null ? null
    : avgWpm < 100 ? 'Too slow'
    : avgWpm <= 160 ? 'Ideal pace'
    : 'Too fast'

  const questionCount = answers?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Your report</h1>
      </div>

      {/* Grade + meta */}
      <Card className="flex items-center gap-6">
        <GradeCircle grade={session.overall_grade} />
        <div>
          <p className="text-lg font-bold text-gray-900">Session complete</p>
          <p className="text-sm text-gray-600">
            {questionCount} question{questionCount === 1 ? '' : 's'} ·{' '}
            {new Date(session.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-brand-600 mt-1 font-medium capitalize">{tier} tier</p>
        </div>
      </Card>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Filler words"
          value={totalFillers}
          sublabel="across all answers"
        />
        <MetricCard
          label="Avg speaking pace"
          value={avgWpm ? `${avgWpm} WPM` : null}
          sublabel={wpmLabel ?? undefined}
        />
        <MetricCard
          label="Eye contact"
          value={avgEyeContact !== null ? `${avgEyeContact}%` : null}
          sublabel="avg across session"
          locked={!isPaid}
        />
      </div>

      {/* Filler breakdown */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">Filler word breakdown</h3>
        <FillerBreakdown breakdown={aggregatedBreakdown} totalCount={totalFillers} />
      </Card>

      {/* STAR scoring placeholder */}
      <Card className="relative overflow-hidden">
        <h3 className="font-semibold text-gray-900 mb-3">STAR structure scoring</h3>
        <div className="space-y-3">
          {['Situation', 'Task', 'Action', 'Result'].map(component => (
            <div key={component} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-600">{component}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-200" />
              <span className="text-sm text-gray-400">—</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm rounded-xl">
          <p className="text-sm font-semibold text-gray-700">Coming soon</p>
          <p className="text-xs text-gray-500 mt-1">AI structure scoring is in development</p>
        </div>
      </Card>

      {/* Per-answer transcripts (paid only) */}
      {isPaid && answers && answers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Answer transcripts</h3>
          {answers.map((answer, i) => (
            <Card key={answer.id}>
              <p className="text-xs font-medium text-gray-500 mb-1">Question {i + 1}</p>
              <p className="text-sm font-medium text-gray-900 mb-2">
                {(answer as any).questions?.question_text}
              </p>
              {answer.transcription_failed ? (
                <p className="text-sm text-red-500">Transcription failed for this answer</p>
              ) : answer.transcript ? (
                <p className="text-sm text-gray-700 leading-relaxed">{answer.transcript}</p>
              ) : (
                <p className="text-sm text-gray-400">Processing…</p>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                {answer.wpm !== null && <span>{answer.wpm} WPM</span>}
                {answer.filler_count !== null && (
                  <span>{answer.filler_count} filler{answer.filler_count === 1 ? '' : 's'}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link href="/session/setup">
        <Button fullWidth size="lg">New session →</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 5: Commit and push**

```bash
git add app/'(protected)'/session/report/ components/report/
git commit -m "feat: add report card with grade, metrics, fillers, and tier-gated content"
git push origin main
```

---

### Task 9: Wire up protected session routes in layout

**Files:**
- Create: `app/(protected)/session/[id]/layout.tsx`

- [ ] **Step 1: Create session ID layout (no back nav during live)**

Create `app/(protected)/session/[id]/layout.tsx`:
```typescript
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 py-8 px-6">{children}</div>
}
```

- [ ] **Step 2: End-to-end smoke test**

```bash
npm run dev
```

Walk through the full flow:
1. `/` → Landing ✓
2. `/signup` → create account ✓
3. `/onboarding` → complete 3 steps ✓
4. `/dashboard` → metrics show, "Start Mock Interview" is clickable ✓
5. `/session/setup` → select difficulty, allow mic ✓
6. `/session/[id]/briefing` → format cards visible, button unlocks (or 10s delay) ✓
7. `/session/[id]/live` → question shows, timer counts down, waveform animates, Done button works ✓
8. `/session/report/[id]` → grade circle, metrics, filler breakdown ✓

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected:
```
✓ tests/lib/questions.test.ts (5)
✓ tests/lib/analysis.test.ts (9)
Test Files  2 passed (2)
Tests  14 passed (14)
```

- [ ] **Step 4: Final commit and push**

```bash
git add app/'(protected)'/session/'[id]'/layout.tsx
git commit -m "feat: add session id layout"
git push origin main
```

---

## Plan B Complete

The full MVP is now live:
- **Landing page** with pricing tiers
- **Auth** (Google OAuth + email/password)
- **Onboarding** (3-step personalisation)
- **Dashboard** with real metrics
- **Session loop**: Setup → Briefing → Live recording → Report card
- **AssemblyAI** transcription per answer
- **Filler detection + WPM** analysis
- **Feature gates** by tier (eye contact, transcripts)
- **STAR scoring** placeholder (blurred "coming soon")

**Second pass (Phase 2):** Claude Sonnet 4.6 STAR scoring + ideal answer generation + Razorpay billing
