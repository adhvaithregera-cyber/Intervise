import { NextResponse } from 'next/server'

export const maxDuration = 60 // seconds — extends Vercel function timeout (Pro plan)
import { createClient } from '@/lib/supabase/server'
import { transcribeAudio, isTranscriptionError } from '@/lib/assemblyai'
import { analyzeAnswer } from '@/lib/analysis'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const audioFile = formData.get('audio') as Blob | null
  const sessionId = formData.get('session_id') as string | null
  const questionId = formData.get('question_id') as string | null
  const answerIndex = formData.get('answer_index') as string | null
  const durationSecondsStr = formData.get('duration_seconds') as string | null
  const eyeContactStr = formData.get('eye_contact_pct') as string | null

  if (!audioFile || !sessionId || !questionId || !answerIndex || !durationSecondsStr) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const parsedDurationSeconds = parseInt(durationSecondsStr ?? '0', 10)
  const eyeContactPct = eyeContactStr ? parseInt(eyeContactStr, 10) : null

  // Verify session belongs to user
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Transcribe audio via AssemblyAI
  console.log(`[transcribe] blob size=${audioFile.size} bytes, type=${audioFile.type}, duration=${parsedDurationSeconds}s`)
  const result = await transcribeAudio(audioFile)

  if (isTranscriptionError(result)) {
    console.error('[transcribe] AssemblyAI error:', result.reason)
    const { error: insertError } = await supabase.from('answers').insert({
      session_id: sessionId,
      question_id: parseInt(questionId),
      answer_index: parseInt(answerIndex),
      transcript: null,
      transcription_failed: true,
      filler_count: null,
      filler_breakdown: null,
      wpm: null,
      eye_contact_pct: eyeContactPct,
      duration_seconds: parsedDurationSeconds,
    })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({
      transcript: null,
      fillerCount: null,
      fillerBreakdown: null,
      wpm: null,
      transcriptionFailed: true,
    })
  }

  // Transcription succeeded — analyze
  const analysis = analyzeAnswer({
    transcript: result.text,
    durationSeconds: parsedDurationSeconds,
  })

  const { error: insertError } = await supabase.from('answers').insert({
    session_id: sessionId,
    question_id: parseInt(questionId),
    answer_index: parseInt(answerIndex),
    transcript: result.text,
    transcription_failed: false,
    filler_count: analysis.fillerCount,
    filler_breakdown: analysis.fillerBreakdown,
    wpm: analysis.wpm,
    eye_contact_pct: eyeContactPct,
    duration_seconds: parsedDurationSeconds,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({
    transcript: result.text,
    fillerCount: analysis.fillerCount,
    fillerBreakdown: analysis.fillerBreakdown,
    wpm: analysis.wpm,
    transcriptionFailed: false,
  })
}
