import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { selectAdaptiveQuestions } from '@/lib/questions'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { sessionStartSchema } from '@/lib/validation'
import type { Difficulty } from '@/types/database'

// Cache the full questions table for 1 hour — questions change rarely.
// Uses service role key (server-only) to bypass RLS for a public read.
const getCachedQuestions = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase.from('questions').select('*')
    return data ?? []
  },
  ['questions-all'],
  { revalidate: 3600 },
)

// Questions per session by tier
const TIER_QUESTION_COUNT: Record<string, number> = {
  free:    5,
  student: 5,
  pro:     5,
}

const FREE_CATEGORY_IDS = [1, 2]  // Identity & Background + Strengths & Weaknesses
const HARD_CATEGORY_IDS = [6, 7]  // Situational, Curveball / Pressure

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
  const { difficulty } = parsed.data

  // ── Fetch profile for question selection ────────────────────────────────
  // (Tier also validated inside the atomic RPC — this read is only for
  //  question filtering, not for security decisions.)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, sessions_used_this_month')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  // ── Fetch questions (cached) + history (user-specific) in parallel ────────
  let allQuestions: Awaited<ReturnType<typeof getCachedQuestions>>
  let history: { question_id: number }[] | null
  let historyError: { message: string } | null

  try {
    const [cachedQs, historyResult] = await Promise.all([
      getCachedQuestions(),
      supabase.from('question_history').select('question_id').eq('user_id', user.id),
    ])
    allQuestions = cachedQs
    history = historyResult.data
    historyError = historyResult.error
  } catch {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  if (!allQuestions.length) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }
  if (historyError) {
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }

  const askedIds = (history ?? []).map(row => row.question_id)

  // ── Filter question pool by tier and difficulty ─────────────────────────
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

  const questionCount = TIER_QUESTION_COUNT[profile.tier] ?? 5

  if (questionPool.length < questionCount) {
    questionPool = profile.tier === 'free'
      ? allQuestions.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
      : allQuestions
  }
  const selectedQuestions = selectAdaptiveQuestions(questionPool, askedIds, questionCount)

  // ── Atomic: quota check + session creation in one locked transaction ─────
  // create_session_atomic() (SECURITY DEFINER) re-reads tier from DB so it
  // cannot be spoofed. It also holds a row lock, eliminating the race condition
  // where two concurrent requests both pass the quota check.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionId, error: rpcError } = await (supabase as any)
    .rpc('create_session_atomic', { p_difficulty: difficulty })

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('quota_exceeded')) {
      return NextResponse.json(
        { error: 'quota_exceeded', sessionsLimit: TIER_QUESTION_COUNT[profile.tier] },
        { status: 403 },
      )
    }
    if (msg.includes('difficulty_not_allowed')) {
      return NextResponse.json({ error: 'difficulty_not_allowed' }, { status: 403 })
    }
    // Log the real error server-side; never expose DB internals to the client
    console.error('[session/start] create_session_atomic error:', msg)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // ── Record question history ──────────────────────────────────────────────
  await supabase
    .from('question_history')
    .insert(selectedQuestions.map(q => ({ user_id: user.id, question_id: q.id })))
  // Non-fatal if this fails — session still works, adaptive selection just
  // won't exclude these questions next time.

  return NextResponse.json({ sessionId, questions: selectedQuestions })
}
