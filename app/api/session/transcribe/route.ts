import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'
import { transcribeAudio, isTranscriptionError } from '@/lib/assemblyai'
import { analyzeAnswer } from '@/lib/analysis'
import { generateAnswerFeedback } from '@/lib/aifeedback'
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
  supabase: SupabaseClient<Database>,
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

  // ── Verify question_id is valid for this session's tier/difficulty ────────
  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('difficulty, tier_at_time')
    .eq('id', session_id)
    .single()

  if (!sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Build the allowed category filter based on tier
  const tierAtTime = sessionRow.tier_at_time as string
  const allowedCategories = tierAtTime === 'free' ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8]

  // Check if question belongs to allowed categories for this session
  const { data: questionRow } = await supabase
    .from('questions')
    .select('id, category_id')
    .eq('id', question_id)
    .in('category_id', allowedCategories)
    .single()

  if (!questionRow) {
    return NextResponse.json({ error: 'Question not valid for this session' }, { status: 403 })
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

  // ── Analyse locally + AI feedback ────────────────────────────────────────
  const analysis = analyzeAnswer({ transcript, durationSeconds: duration_seconds })

  const { data: question } = await supabase
    .from('questions')
    .select('question_text, answer_format, category_id, category_name')
    .eq('id', question_id)
    .single()

  const aiFeedback = question
    ? await generateAnswerFeedback({
        questionText:    question.question_text,
        categoryId:      question.category_id,
        categoryName:    question.category_name,
        answerFormat:    question.answer_format,
        transcript,
        fillerCount:     analysis.fillerCount,
        wpm:             analysis.wpm,
        durationSeconds: duration_seconds,
      })
    : null

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
    ai_feedback:          aiFeedback,
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
  supabase: SupabaseClient<Database>,
) {
  // Tier guard — free users must use the Web Speech API text path
  const { data: profile } = await supabase.from('profiles').select('tier').eq('id', userId).single()
  if (!profile || profile.tier === 'free') {
    return NextResponse.json({ error: 'Audio transcription requires a paid plan' }, { status: 403 })
  }

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

  // ── Verify question_id is valid for this session's tier/difficulty ────────
  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('difficulty, tier_at_time')
    .eq('id', session_id)
    .single()

  if (!sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Build the allowed category filter based on tier
  const tierAtTime = sessionRow.tier_at_time as string
  const allowedCategories = tierAtTime === 'free' ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8]

  // Check if question belongs to allowed categories for this session
  const { data: questionRow } = await supabase
    .from('questions')
    .select('id, category_id')
    .eq('id', question_id)
    .in('category_id', allowedCategories)
    .single()

  if (!questionRow) {
    return NextResponse.json({ error: 'Question not valid for this session' }, { status: 403 })
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
    console.error('[transcribe] AssemblyAI failed:', result.reason)
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
      ai_feedback:          null,
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

  const { data: question } = await supabase
    .from('questions')
    .select('question_text, answer_format, category_id, category_name')
    .eq('id', question_id)
    .single()

  const aiFeedback = question
    ? await generateAnswerFeedback({
        questionText:    question.question_text,
        categoryId:      question.category_id,
        categoryName:    question.category_name,
        answerFormat:    question.answer_format,
        transcript:      result.text,
        fillerCount:     analysis.fillerCount,
        wpm:             analysis.wpm,
        durationSeconds: duration_seconds,
      })
    : null

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
    ai_feedback:          aiFeedback,
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
