import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Difficulty } from '@/types/database'

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'mixed', 'hard']

// Difficulties each tier is allowed to submit
const TIER_ALLOWED_DIFFICULTIES: Record<string, Difficulty[]> = {
  free: ['easy'],
  student: ['easy', 'medium', 'mixed'],
  pro: ['easy', 'medium', 'mixed', 'hard'],
}

// Questions per session by tier
const TIER_QUESTION_COUNT: Record<string, number> = {
  free: 3,
  student: 5,
  pro: 5,
}

// Session limits by tier — source of truth in code, not the DB column
const TIER_SESSION_LIMITS: Record<string, number> = {
  free: 2,
  student: 12,
  pro: 30,
}

// Free tier may only see these question categories (no Behavioural = no STAR format)
const FREE_CATEGORY_IDS = [1] // Identity & Background only

// Hard difficulty draws from curveball/pressure + situational categories
const HARD_CATEGORY_IDS = [6, 7] // Situational, Curveball / Pressure

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { difficulty?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const { difficulty } = body

  if (!VALID_DIFFICULTIES.includes(difficulty as Difficulty)) {
    return NextResponse.json({ error: 'invalid_difficulty' }, { status: 400 })
  }

  // Fetch profile for quota check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, sessions_used_this_month')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? 'Profile not found' }, { status: 500 })
  }

  // Derive limit from tier — never trust the DB column which may be stale
  const sessionsLimit = TIER_SESSION_LIMITS[profile.tier] ?? 2

  if (profile.sessions_used_this_month >= sessionsLimit) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        sessionsLimit,
        sessionsUsed: profile.sessions_used_this_month,
      },
      { status: 403 }
    )
  }

  // Enforce tier-based difficulty restriction
  const allowedDifficulties = TIER_ALLOWED_DIFFICULTIES[profile.tier] ?? TIER_ALLOWED_DIFFICULTIES.free
  if (!allowedDifficulties.includes(difficulty as Difficulty)) {
    return NextResponse.json({ error: 'difficulty_not_allowed' }, { status: 403 })
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

  // Filter question pool by tier and difficulty
  let questionPool = allQuestions
  if (profile.tier === 'free') {
    questionPool = questionPool.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
  }
  if (difficulty === 'easy') {
    questionPool = questionPool.filter(q => q.frequency === 'Universal')
  } else if (difficulty === 'medium') {
    questionPool = questionPool.filter(q => q.frequency === 'Universal' || q.frequency === 'Very High')
  } else if (difficulty === 'hard') {
    questionPool = questionPool.filter(q => HARD_CATEGORY_IDS.includes(q.category_id))
  }
  // 'mixed' = full allowed pool, no extra filter

  // Fall back to full allowed pool if filter leaves too few questions
  if (questionPool.length < 3) {
    questionPool = profile.tier === 'free'
      ? allQuestions.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
      : allQuestions
  }

  const questionCount = TIER_QUESTION_COUNT[profile.tier] ?? 3
  const selectedQuestions = selectAdaptiveQuestions(questionPool, askedIds, questionCount)

  // Insert session row first
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

  // Batch insert into question_history only after session is created
  const { error: historyInsertError } = await supabase
    .from('question_history')
    .insert(selectedQuestions.map((q) => ({ user_id: user.id, question_id: q.id })))

  if (historyInsertError) {
    return NextResponse.json({ error: historyInsertError.message }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, questions: selectedQuestions })
}
