import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWeaknessSummary } from '@/lib/weaknesssummary'
import type { AiFeedback } from '@/types/database'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Only Pro users can generate weakness summaries
  const { data: profile } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
  if (!profile || profile.tier !== 'pro') {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
  }

  // Pull last 10 completed sessions' answers with ai_feedback
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(10)

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: 'No sessions found' }, { status: 400 })
  }

  const sessionIds = sessions.map(s => s.id)

  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, ai_feedback')
    .in('session_id', sessionIds)
    .eq('transcription_failed', false)
    .not('ai_feedback', 'is', null)

  if (!answers || answers.length === 0) {
    return NextResponse.json({ error: 'No analysed answers found' }, { status: 400 })
  }

  const questionIds = [...new Set(answers.map(a => a.question_id))]
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, category_name')
    .in('id', questionIds)

  const questionMap = Object.fromEntries((questions ?? []).map(q => [q.id, q]))

  const answerInputs = answers
    .filter(a => questionMap[a.question_id])
    .map(a => ({
      question_text: questionMap[a.question_id].question_text,
      category_name: questionMap[a.question_id].category_name,
      ai_feedback: a.ai_feedback as AiFeedback,
    }))

  const summary = await generateWeaknessSummary(answerInputs)

  // Cache in profiles
  await supabase
    .from('profiles')
    .update({
      weakness_summary: summary,
      weakness_summary_at: new Date().toISOString(),
      weakness_summary_session_count: sessions.length,
    })
    .eq('id', user.id)

  return NextResponse.json({ summary })
}
