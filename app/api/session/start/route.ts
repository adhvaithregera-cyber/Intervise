import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Difficulty } from '@/types/database'

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'mixed']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { difficulty } = body

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: 'invalid_difficulty' }, { status: 400 })
  }

  // Fetch profile for quota check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, sessions_limit, sessions_used_this_month')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 500 })
  }

  if (profile.sessions_used_this_month >= profile.sessions_limit) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        sessionsLimit: profile.sessions_limit,
        sessionsUsed: profile.sessions_used_this_month,
      },
      { status: 403 }
    )
  }

  // Fetch all questions
  const { data: allQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('*')

  if (questionsError || !allQuestions) {
    return NextResponse.json({ error: questionsError?.message ?? 'Failed to fetch questions' }, { status: 500 })
  }

  // Fetch user's question history
  const { data: history, error: historyError } = await supabase
    .from('question_history')
    .select('question_id')
    .eq('user_id', user.id)

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  const askedIds = (history ?? []).map((row) => row.question_id)

  // Select 3 adaptive questions
  const selectedQuestions = selectAdaptiveQuestions(allQuestions, askedIds, 3)

  // Batch insert into question_history
  const { error: historyInsertError } = await supabase
    .from('question_history')
    .insert(selectedQuestions.map((q) => ({ user_id: user.id, question_id: q.id })))

  if (historyInsertError) {
    return NextResponse.json({ error: historyInsertError.message }, { status: 500 })
  }

  // Insert session row
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      difficulty: difficulty as Difficulty,
      status: 'in_progress',
      tier_at_time: profile.tier,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, questions: selectedQuestions })
}
