import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Answer } from '@/types/database'

function calculateGrade(answers: Pick<Answer, 'wpm' | 'filler_count'>[]): string {
  const wpmValues = answers.map(a => a.wpm).filter((v): v is number => v !== null)
  const fillerValues = answers.map(a => a.filler_count).filter((v): v is number => v !== null)

  const avgWpm = wpmValues.length > 0 ? wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length : null
  const avgFiller = fillerValues.length > 0 ? fillerValues.reduce((a, b) => a + b, 0) / fillerValues.length : null

  // WPM score: 130–160 ideal
  let wpmScore = 2 // default neutral
  if (avgWpm !== null) {
    if (avgWpm >= 130 && avgWpm <= 160) wpmScore = 4
    else if ((avgWpm >= 110 && avgWpm < 130) || (avgWpm > 160 && avgWpm <= 170)) wpmScore = 3
    else if ((avgWpm >= 80 && avgWpm < 110) || (avgWpm > 170 && avgWpm <= 200)) wpmScore = 2
    else wpmScore = 1
  }

  // Filler score
  let fillerScore = 2 // default neutral
  if (avgFiller !== null) {
    if (avgFiller <= 2) fillerScore = 4
    else if (avgFiller <= 5) fillerScore = 3
    else if (avgFiller <= 10) fillerScore = 2
    else fillerScore = 1
  }

  const combined = (wpmScore + fillerScore) / 2
  if (combined >= 3.5) return 'A'
  if (combined >= 2.75) return 'B'
  if (combined >= 2.0) return 'C'
  if (combined >= 1.5) return 'D'
  return 'F'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { session_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const sessionId = body.session_id
  if (typeof sessionId !== 'string' || !sessionId) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Verify session belongs to user and is in_progress
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session already completed' }, { status: 403 })
  }

  // Fetch all answers for this session
  const { data: answers } = await supabase
    .from('answers')
    .select('wpm, filler_count')
    .eq('session_id', sessionId)

  const grade = calculateGrade(answers ?? [])

  // Mark session complete
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'complete', overall_grade: grade, completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Increment sessions_used quota
  await supabase.rpc('increment_sessions_used', { user_id: user.id })

  return NextResponse.json({ grade, sessionId })
}
