# Free Tier Web Speech API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route Free users through browser SpeechRecognition (zero cost) while keeping Student/Pro on the AssemblyAI + Claude path.

**Architecture:** Tier is read from the DB in `lib/session.ts` and returned alongside the session result. The briefing page appends `&tier=<tier>` to the live session URL. The live page branches on `tier` at recording time: Free users use `SpeechRecognition`, paid users use `MediaRecorder` (unchanged). The transcribe API route detects `Content-Type: application/json` as the free/text path and `multipart/form-data` as the paid/audio path, re-validating tier from DB on every request.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod, Web Speech API (`SpeechRecognition`), Vitest

---

## File map

| File | Change |
|---|---|
| `lib/validation.ts` | Add `transcribeTextSchema` for JSON text path |
| `lib/session.ts` | Return `tier` in success result |
| `app/(protected)/session/briefing/page.tsx` | Append `&tier=${tier}` to Start Interview href |
| `app/api/session/transcribe/route.ts` | Add JSON branch for free text path |
| `app/(protected)/session/live/page.tsx` | Web Speech API recording for free tier |

---

### Task 1: Add text transcription schema

**Files:**
- Modify: `lib/validation.ts`
- Test: `lib/__tests__/validation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/validation.test.ts` (or add to existing if it exists):

```typescript
import { describe, it, expect } from 'vitest'
import { transcribeTextSchema } from '../validation'

describe('transcribeTextSchema', () => {
  it('accepts valid text payload', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 5,
      answer_index: 2,
      duration_seconds: 45,
      transcript: 'I think the situation was...',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.question_id).toBe(5)
      expect(result.data.duration_seconds).toBe(45)
    }
  })

  it('rejects invalid UUID', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: 'not-a-uuid',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 10,
      transcript: 'hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero duration', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 0,
      transcript: 'hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty transcript', () => {
    const result = transcribeTextSchema.safeParse({
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      question_id: 1,
      answer_index: 1,
      duration_seconds: 10,
      transcript: '',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/validation.test.ts
```

Expected: FAIL — `transcribeTextSchema` not yet exported.

- [ ] **Step 3: Add `transcribeTextSchema` to `lib/validation.ts`**

Add after the existing `transcribeFormSchema` at the end of the file:

```typescript
// ─── Text transcription (Free tier — Web Speech API path) ───────────────────

/**
 * JSON body schema for the free-tier transcription path.
 * Accepts the transcript text produced by the browser's SpeechRecognition API
 * instead of an audio file. Fields are numbers (not strings) since this comes
 * as JSON, not multipart form data.
 */
export const transcribeTextSchema = z.object({
  session_id: z.string().uuid('session_id must be a valid UUID'),
  question_id: z.number().int().positive('question_id must be a positive integer'),
  answer_index: z.number().int().positive('answer_index must be a positive integer'),
  duration_seconds: z.number().int().positive('duration_seconds must be a positive integer greater than 0'),
  transcript: z.string().min(1, 'transcript must not be empty').max(10000),
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/validation.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts lib/__tests__/validation.test.ts
git commit -m "feat: add transcribeTextSchema for free-tier JSON transcription path"
```

---

### Task 2: Return `tier` from `createSession`

**Files:**
- Modify: `lib/session.ts` (lines 30–32 and 110)

- [ ] **Step 1: Update `CreateSessionResult` type**

In `lib/session.ts`, change the type at line 30:

```typescript
export type CreateSessionResult =
  | { sessionId: string; questions: Question[]; tier: string }
  | { error: 'quota_exceeded' | 'difficulty_not_allowed' | 'profile_not_found' | 'questions_failed' | 'session_failed' }
```

- [ ] **Step 2: Return `tier` in the success result**

At the bottom of `createSession` (currently line 110), change the return:

```typescript
  return { sessionId, questions: selectedQuestions, tier: profile.tier }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/session.ts
git commit -m "feat: return tier in createSession result"
```

---

### Task 3: Pass tier in briefing page URL

**Files:**
- Modify: `app/(protected)/session/briefing/page.tsx` (line ~117)

The briefing page already calls `createSession` and gets back `{ sessionId, questions, tier }` after Task 2.

- [ ] **Step 1: Update the Start Interview href**

Find this line in `app/(protected)/session/briefing/page.tsx`:

```typescript
          <Link href={`/session/live?session_id=${sessionId}&q=${questionIds}`} className="block w-full sm:w-auto sm:inline-block">
```

Replace with:

```typescript
          <Link href={`/session/live?session_id=${sessionId}&q=${questionIds}&tier=${tier}`} className="block w-full sm:w-auto sm:inline-block">
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/session/briefing/page.tsx"
git commit -m "feat: pass tier to live session URL"
```

---

### Task 4: Add JSON text path to transcribe API route

**Files:**
- Modify: `app/api/session/transcribe/route.ts`

The current route only handles `multipart/form-data`. We need to detect `Content-Type: application/json` and run the free/text path instead.

- [ ] **Step 1: Replace the route with the branched version**

Replace the entire contents of `app/api/session/transcribe/route.ts` with:

```typescript
import { NextResponse } from 'next/server'

export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'
import { transcribeAudio, isTranscriptionError } from '@/lib/assemblyai'
import { analyzeAnswer } from '@/lib/analysis'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import {
  transcribeFormSchema,
  transcribeTextSchema,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_AUDIO_SIZE_BYTES,
} from '@/lib/validation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:transcribe`, RATE_LIMITS.transcribe)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many transcription requests. Please wait before submitting another answer.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)) } },
    )
  }

  const contentType = request.headers.get('content-type') ?? ''

  // ── Route: JSON text path (Free tier — Web Speech API) ──────────────────
  if (contentType.includes('application/json')) {
    return handleTextPath(request, user.id, supabase)
  }

  // ── Route: Audio file path (Student / Pro — AssemblyAI) ─────────────────
  return handleAudioPath(request, user.id, supabase)
}

// ── Text path ────────────────────────────────────────────────────────────────

async function handleTextPath(
  request: Request,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = transcribeTextSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid fields', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { session_id, question_id, answer_index, duration_seconds, transcript } = parsed.data

  // ── Server-side tier enforcement: only free users may use this path ──────
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  if (!profile || profile.tier !== 'free') {
    return NextResponse.json(
      { error: 'This endpoint is only available for free tier users' },
      { status: 403 },
    )
  }

  // ── Verify session belongs to this user and is in progress ───────────────
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', session_id)
    .eq('user_id', userId)
    .single()

  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session is not in progress' }, { status: 403 })
  }

  // ── Block duplicate submissions ───────────────────────────────────────────
  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('session_id', session_id)
    .eq('answer_index', answer_index)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Answer already submitted for this slot' }, { status: 409 })
  }

  // ── Analyse locally — no AssemblyAI, no Claude ───────────────────────────
  const analysis = analyzeAnswer({ transcript, durationSeconds: duration_seconds })

  const { error: insertError } = await supabase.from('answers').insert({
    session_id,
    question_id,
    answer_index,
    transcript,
    transcription_failed: false,
    filler_count:         analysis.fillerCount,
    filler_breakdown:     analysis.fillerBreakdown,
    wpm:                  analysis.wpm,
    eye_contact_pct:      null,
    duration_seconds,
  })

  if (insertError) {
    console.error('[transcribe:text] insert failed:', insertError.message)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({
    transcript,
    fillerCount:         analysis.fillerCount,
    fillerBreakdown:     analysis.fillerBreakdown,
    wpm:                 analysis.wpm,
    transcriptionFailed: false,
  })
}

// ── Audio path (existing logic, unchanged) ────────────────────────────────────

async function handleAudioPath(
  request: Request,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audioFile = formData.get('audio') as Blob | null

  if (!audioFile) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
  }

  if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Audio file exceeds the ${MAX_AUDIO_SIZE_BYTES / 1024 / 1024} MB size limit` },
      { status: 413 },
    )
  }

  const mimeType = audioFile.type.toLowerCase().split(';')[0].trim()
  const fullMime = audioFile.type.toLowerCase().trim()
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType) && !ALLOWED_AUDIO_MIME_TYPES.has(fullMime)) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 415 })
  }

  const parsed = transcribeFormSchema.safeParse({
    session_id:       formData.get('session_id'),
    question_id:      formData.get('question_id'),
    answer_index:     formData.get('answer_index'),
    duration_seconds: formData.get('duration_seconds'),
    eye_contact_pct:  formData.get('eye_contact_pct') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid fields', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { session_id, question_id, answer_index, duration_seconds, eye_contact_pct } = parsed.data

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', session_id)
    .eq('user_id', userId)
    .single()

  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session is not in progress' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('session_id', session_id)
    .eq('answer_index', answer_index)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Answer already submitted for this slot' }, { status: 409 })
  }

  const result = await transcribeAudio(audioFile)

  if (isTranscriptionError(result)) {
    const { error: insertError } = await supabase.from('answers').insert({
      session_id,
      question_id,
      answer_index,
      transcript:           null,
      transcription_failed: true,
      filler_count:         null,
      filler_breakdown:     null,
      wpm:                  null,
      eye_contact_pct:      eye_contact_pct ?? null,
      duration_seconds,
    })
    if (insertError) {
      console.error('[transcribe] insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }
    return NextResponse.json({
      transcript: null, fillerCount: null, fillerBreakdown: null,
      wpm: null, transcriptionFailed: true,
    })
  }

  const analysis = analyzeAnswer({ transcript: result.text, durationSeconds: duration_seconds })

  const { error: insertError } = await supabase.from('answers').insert({
    session_id,
    question_id,
    answer_index,
    transcript:           result.text,
    transcription_failed: false,
    filler_count:         analysis.fillerCount,
    filler_breakdown:     analysis.fillerBreakdown,
    wpm:                  analysis.wpm,
    eye_contact_pct:      eye_contact_pct ?? null,
    duration_seconds,
  })

  if (insertError) {
    console.error('[transcribe] insert failed:', insertError.message)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({
    transcript:          result.text,
    fillerCount:         analysis.fillerCount,
    fillerBreakdown:     analysis.fillerBreakdown,
    wpm:                 analysis.wpm,
    transcriptionFailed: false,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/session/transcribe/route.ts"
git commit -m "feat: add JSON text path to transcribe route for free tier"
```

---

### Task 5: Web Speech API recording in live page

**Files:**
- Modify: `app/(protected)/session/live/page.tsx`

This is the largest change. We branch the entire recording flow based on `tier`.

- [ ] **Step 1: Replace the entire file**

Replace `app/(protected)/session/live/page.tsx` with:

```typescript
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type LivePhase =
  | 'loading'
  | 'prep'
  | 'recording'
  | 'between'
  | 'transcribing'
  | 'error'

type Question = {
  id: number
  question_text: string
  answer_format: string
  time_limit_seconds: number
  category_name: string
}

type StoredAnswer =
  | { type: 'audio'; blob: Blob; duration: number; questionId: number; index: number }
  | { type: 'text'; transcript: string; duration: number; questionId: number; index: number }

const glassCard = {
  backgroundColor: 'rgba(28,10,0,0.70)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(249,193,37,0.25)',
  borderRadius: '1.25rem',
}

export default function LiveSessionPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<LivePhase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prepCount, setPrepCount] = useState(5)
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  // Shared refs
  const tierRef = useRef<string>('free')
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerStartTimeRef = useRef<number>(0)
  const storedAnswersRef = useRef<StoredAnswer[]>([])
  const endingSessionRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Audio path refs (Student/Pro)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string | undefined>(undefined)

  // Text path refs (Free)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const recognitionManualStopRef = useRef(false)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const q = params.get('q')
    tierRef.current = params.get('tier') ?? 'free'

    if (!sessionId || !q) {
      setPhase('error')
      setErrorMessage('Missing session parameters.')
      return
    }

    const questionIds = q.split(',').map(Number)

    const init = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.from('questions').select('*').in('id', questionIds)
      if (!data || data.length === 0) {
        setPhase('error')
        setErrorMessage('Could not load questions.')
        return
      }
      const sorted = questionIds.map(id => data.find(q => q.id === id)!).filter(Boolean)
      setQuestions(sorted as Question[])

      if (tierRef.current === 'free') {
        // Free path: check SpeechRecognition support
        const SR = typeof window !== 'undefined'
          ? (window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
          : null
        if (!SR) {
          setPhase('error')
          setErrorMessage('Your browser does not support speech recognition. Please use Chrome, Safari, or Edge for free sessions.')
          return
        }
      } else {
        // Paid path: request mic via MediaDevices
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          micStreamRef.current = stream
        } catch {
          setPhase('error')
          setErrorMessage('Microphone access is required to record answers.')
          return
        }

        // Camera (optional, Coming Soon — will never be granted until feature launches)
        try {
          const perm = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (perm.state === 'granted') {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setCameraStream(camStream)
            cameraStreamRef.current = camStream
          }
        } catch {
          // camera optional
        }
      }

      setPhase('prep')
    }

    init()

    return () => {
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
      if (answerTimerRef.current) clearInterval(answerTimerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      if (recognitionRef.current) {
        recognitionManualStopRef.current = true
        recognitionRef.current.stop()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'prep') return
    setPrepCount(5)
    let count = 5
    const id = setInterval(() => {
      count -= 1
      setPrepCount(count)
      if (count <= 0) {
        clearInterval(id)
        startRecording()
      }
    }, 1000)
    prepTimerRef.current = id
    return () => clearInterval(id)
  }, [phase, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  function startRecording() {
    if (tierRef.current === 'free') {
      startRecordingFree()
    } else {
      startRecordingAudio()
    }
  }

  // ── Free path: SpeechRecognition ─────────────────────────────────────────

  function startRecordingFree() {
    const SR = window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    finalTranscriptRef.current = ''
    recognitionManualStopRef.current = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' '
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setPhase('error')
        setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.')
      }
      // other errors (network, aborted) are non-fatal — recognition will fire onend and we handle it
    }

    recognition.onend = () => {
      if (!recognitionManualStopRef.current) {
        // Browser auto-stopped (silence timeout) — restart to keep recording
        try { recognition.start() } catch { /* already stopped manually */ }
        return
      }
      // Manual stop — store answer and advance
      const transcript = finalTranscriptRef.current.trim()
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      storedAnswersRef.current.push({
        type: 'text',
        transcript,
        duration: elapsed,
        questionId: questions[currentIndex].id,
        index: currentIndex + 1,
      })
      if (endingSessionRef.current) {
        finishAndProcess()
      } else {
        setPhase('between')
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    answerStartTimeRef.current = Date.now()
    setPhase('recording')

    const timeLimit = questions[currentIndex]?.time_limit_seconds ?? 60
    setAnswerTimeLeft(timeLimit)
    const id = setInterval(() => {
      setAnswerTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    answerTimerRef.current = id
  }

  // ── Audio path: MediaRecorder ─────────────────────────────────────────────

  function startRecordingAudio() {
    if (!micStreamRef.current) return
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : undefined
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(micStreamRef.current, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current ?? 'audio/webm' })
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      storedAnswersRef.current.push({
        type: 'audio',
        blob,
        duration: elapsed,
        questionId: questions[currentIndex].id,
        index: currentIndex + 1,
      })
      if (endingSessionRef.current) {
        finishAndProcess()
      } else {
        setPhase('between')
      }
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    answerStartTimeRef.current = Date.now()
    setPhase('recording')

    const timeLimit = questions[currentIndex]?.time_limit_seconds ?? 60
    setAnswerTimeLeft(timeLimit)
    const id = setInterval(() => {
      setAnswerTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    answerTimerRef.current = id
  }

  // ── Shared stop ───────────────────────────────────────────────────────────

  function stopRecording() {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current)
    if (tierRef.current === 'free') {
      if (recognitionRef.current) {
        recognitionManualStopRef.current = true
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } else {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }

  function goNext() {
    setCurrentIndex(i => i + 1)
    setPhase('prep')
  }

  function skipPrep() {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    startRecording()
  }

  function endSession() {
    endingSessionRef.current = true
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    const isRecording = tierRef.current === 'free'
      ? recognitionRef.current !== null
      : mediaRecorderRef.current?.state === 'recording'
    if (isRecording) {
      stopRecording()
    } else {
      finishAndProcess()
    }
  }

  async function finishAndProcess() {
    setPhase('transcribing')
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!

    for (const answer of storedAnswersRef.current) {
      try {
        if (answer.type === 'audio') {
          const formData = new FormData()
          formData.append('audio', answer.blob, 'answer.webm')
          formData.append('session_id', sessionId)
          formData.append('question_id', String(answer.questionId))
          formData.append('answer_index', String(answer.index))
          formData.append('duration_seconds', String(answer.duration))
          await fetch('/api/session/transcribe', { method: 'POST', body: formData })
        } else {
          await fetch('/api/session/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              question_id: answer.questionId,
              answer_index: answer.index,
              duration_seconds: answer.duration,
              transcript: answer.transcript,
            }),
          })
        }
      } catch {
        // continue even if one answer fails
      }
    }

    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } finally {
      router.push('/session/report/' + sessionId)
    }
  }

  const isLastQuestion = currentIndex === questions.length - 1
  const q = questions[currentIndex]
  const timerPct = q ? (answerTimeLeft / q.time_limit_seconds) * 100 : 100

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Loading */}
        {phase === 'loading' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-white/70 text-lg">Loading your session...</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-white text-lg mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/session/setup')}
              className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all"
            >
              Back to Setup
            </button>
          </div>
        )}

        {/* Prep countdown */}
        {phase === 'prep' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-2 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-6 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug">
              {q?.question_text}
            </h2>
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-black text-[#F9C125]"
              style={{ border: '3px solid rgba(249,193,37,0.4)', background: 'rgba(249,193,37,0.08)' }}
            >
              {prepCount}
            </div>
            <p className="text-white/50 text-sm mb-6">Recording starts automatically...</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={skipPrep}
                className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
              >
                Start Now
              </button>
              <button
                onClick={endSession}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Recording */}
        {phase === 'recording' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-2 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-6 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <h2 className="text-2xl font-bold text-white mb-8 leading-snug">
              {q?.question_text}
            </h2>

            {/* Timer bar */}
            <div className="mb-2 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPct}%`,
                  backgroundColor: timerPct > 40 ? '#F9C125' : timerPct > 20 ? '#F97316' : '#EF4444',
                }}
              />
            </div>
            <p className="text-white/50 text-xs mb-8">{answerTimeLeft}s remaining</p>

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white/80 font-semibold text-sm">Recording</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={stopRecording}
                className="rounded-xl bg-[#F9C125] px-10 py-3 text-base font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
              >
                Done
              </button>
              <button
                onClick={endSession}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Between questions */}
        {phase === 'between' && (
          <div style={glassCard} className="p-10 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(249,193,37,0.15)', border: '2px solid rgba(249,193,37,0.4)' }}
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#F9C125]/60 text-xs uppercase tracking-widest mb-1 font-semibold">
              Answer {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-white text-xl font-bold mb-2">Answer recorded</p>
            <p className="text-white/50 text-sm mb-8">
              {isLastQuestion ? 'Your results will be ready shortly.' : 'Get ready for the next question.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              {isLastQuestion ? (
                <button
                  onClick={finishAndProcess}
                  className="rounded-xl bg-[#F9C125] px-10 py-3.5 text-base font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                >
                  See My Results
                </button>
              ) : (
                <>
                  <button
                    onClick={goNext}
                    className="rounded-xl bg-[#F9C125] px-10 py-3.5 text-base font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                  >
                    Next Question
                  </button>
                  <button
                    onClick={endSession}
                    className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
                  >
                    End Session
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Transcribing */}
        {phase === 'transcribing' && (
          <div style={glassCard} className="p-10 text-center">
            <div className="generating-loader-wrapper">
              <div className="generating-loader-text">
                {'Generating transcript'.split('').map((char, i) => (
                  <span key={i} className="generating-loader-letter">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
              <div className="generating-loader-bar" />
            </div>
            <p className="text-white/40 text-xs mt-6">Analysing all your answers...</p>
          </div>
        )}
      </div>

      {/* Camera corner — hidden until camera feature launches */}
      {cameraStream && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-2xl overflow-hidden shadow-xl w-28 h-20 sm:w-40 sm:h-28 z-50"
          style={{ border: '2px solid rgba(249,193,37,0.4)' }}
        >
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/session/live/page.tsx"
git commit -m "feat: Web Speech API recording path for free tier users"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test free user flow (Chrome)**

1. Log in as a free-tier user (or temporarily set `tier = 'free'` in the profiles table)
2. Go to `/session/setup`, select Easy, grant mic
3. Click Start Session → briefing page URL should contain `&tier=free`
4. Click Start Interview → live page should use SpeechRecognition (no MediaRecorder)
5. Speak an answer → click Done → between screen appears
6. Complete session → report shows WPM and filler count

- [ ] **Step 3: Test paid user flow (Student/Pro)**

1. Log in as a student-tier user
2. Complete a session end-to-end
3. Verify briefing URL contains `&tier=student`
4. Verify report page shows WPM and filler count (AssemblyAI path)

- [ ] **Step 4: Test browser-unsupported error**

If you have Firefox available, open the live page with `?tier=free` — should show error: "Your browser does not support speech recognition. Please use Chrome, Safari, or Edge for free sessions."

- [ ] **Step 5: Push to production**

```bash
git push origin main
```
