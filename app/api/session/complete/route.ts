import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { sessionCompleteSchema } from '@/lib/validation'
import type { Answer, AiFeedback } from '@/types/database'

const UNANSWERED_PENALTY = 6 // points deducted per unanswered/failed question

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function calculateGrade(
  answers: Pick<Answer, 'wpm' | 'filler_count' | 'ai_feedback' | 'transcription_failed'>[],
  totalExpected: number,
): string {
  const answered = answers.filter(a => !a.transcription_failed)
  const unanswered = Math.max(0, totalExpected - answered.length)

  // Prefer AI scores when the majority of answered questions have them
  const aiScores = answered
    .map(a => (a.ai_feedback as AiFeedback | null)?.score)
    .filter((v): v is number => typeof v === 'number')

  if (aiScores.length > 0 && aiScores.length >= Math.ceil(answered.length / 2)) {
    const avg = aiScores.reduce((a, b) => a + b, 0) / aiScores.length
    const penalised = Math.max(0, avg - unanswered * UNANSWERED_PENALTY)
    return scoreToGrade(penalised)
  }

  // Fallback: WPM + filler heuristic → convert to 0–100 scale then penalise
  const wpmValues    = answered.map(a => a.wpm).filter((v): v is number => v !== null)
  const fillerValues = answered.map(a => a.filler_count).filter((v): v is number => v !== null)

  const avgWpm    = wpmValues.length    > 0 ? wpmValues.reduce((a, b) => a + b, 0)    / wpmValues.length    : null
  const avgFiller = fillerValues.length > 0 ? fillerValues.reduce((a, b) => a + b, 0) / fillerValues.length : null

  let wpmScore = 2
  if (avgWpm !== null) {
    if      (avgWpm >= 130 && avgWpm <= 160)                                     wpmScore = 4
    else if ((avgWpm >= 110 && avgWpm < 130) || (avgWpm > 160 && avgWpm <= 170)) wpmScore = 3
    else if ((avgWpm >= 80  && avgWpm < 110) || (avgWpm > 170 && avgWpm <= 200)) wpmScore = 2
    else                                                                          wpmScore = 1
  }

  let fillerScore = 2
  if (avgFiller !== null) {
    if      (avgFiller <= 2)  fillerScore = 4
    else if (avgFiller <= 5)  fillerScore = 3
    else if (avgFiller <= 10) fillerScore = 2
    else                      fillerScore = 1
  }

  // Map combined (1–4) to 0–100, then apply unanswered penalty
  const combined = (wpmScore + fillerScore) / 2
  const heuristicScore = ((combined - 1) / 3) * 100
  const penalised = Math.max(0, heuristicScore - unanswered * UNANSWERED_PENALTY)
  return scoreToGrade(penalised)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:complete`, RATE_LIMITS.complete)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
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

  const parsed = sessionCompleteSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }
  const { session_id } = parsed.data

  // ── Verify ownership and status ─────────────────────────────────────────
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, user_id')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session already completed' }, { status: 403 })
  }

  // ── Grade and mark complete ──────────────────────────────────────────────
  const { data: answers } = await supabase
    .from('answers')
    .select('wpm, filler_count, ai_feedback, transcription_failed')
    .eq('session_id', session_id)

  const grade = calculateGrade(answers ?? [], 5)

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'complete', overall_grade: grade, completed_at: new Date().toISOString() })
    .eq('id', session_id)
    .eq('user_id', user.id) // defence-in-depth: re-assert ownership on the write

  if (updateError) {
    console.error('[session/complete] update error:', updateError.message)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }

  return NextResponse.json({ grade, sessionId: session_id })
}
