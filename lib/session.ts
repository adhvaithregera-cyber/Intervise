import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Difficulty, Question } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Cache the full questions table for 1 hour — questions change rarely.
// Uses service role key (server-only) to bypass RLS for a public read.
export const getCachedQuestions = unstable_cache(
  async (): Promise<Question[]> => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase.from('questions').select('*')
    return (data ?? []) as Question[]
  },
  ['questions-all'],
  { revalidate: 3600 },
)

const TIER_QUESTION_COUNT: Record<string, number> = {
  free:    5,
  student: 5,
  pro:     5,
}

const FREE_CATEGORY_IDS = [1, 2]

export type CreateSessionResult =
  | { sessionId: string; questions: Question[]; tier: string }
  | { error: 'quota_exceeded' | 'difficulty_not_allowed' | 'profile_not_found' | 'questions_failed' | 'session_failed' }

export async function createSession(
  userId: string,
  difficulty: Difficulty,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<CreateSessionResult> {
  // ── Fetch profile ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, sessions_used_this_month')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'profile_not_found' }

  // ── Fetch questions (cached) + history (user-specific) in parallel ─────
  let allQuestions: Question[]
  let history: { question_id: number }[] | null

  try {
    const [cachedQs, historyResult] = await Promise.all([
      getCachedQuestions(),
      supabase.from('question_history').select('question_id').eq('user_id', userId),
    ])
    allQuestions = cachedQs
    history = historyResult.data
    if (historyResult.error) return { error: 'questions_failed' }
  } catch {
    return { error: 'questions_failed' }
  }

  if (!allQuestions.length) return { error: 'questions_failed' }

  const askedIds = (history ?? []).map(row => row.question_id)

  // ── Filter pool by tier and difficulty ─────────────────────────────────
  let questionPool = allQuestions
  if (profile.tier === 'free') {
    questionPool = questionPool.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
  }
  if (difficulty === 'easy') {
    questionPool = questionPool.filter(q => q.difficulty === 'easy')
  } else if (difficulty === 'medium') {
    questionPool = questionPool.filter(q => q.difficulty !== 'hard')
  } else if (difficulty === 'hard') {
    questionPool = questionPool.filter(q => q.difficulty === 'hard')
  }

  const questionCount = TIER_QUESTION_COUNT[profile.tier] ?? 5

  if (questionPool.length < questionCount) {
    const basePool = profile.tier === 'free'
      ? allQuestions.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
      : allQuestions
    // Re-apply difficulty filter in fallback to prevent wrong-difficulty questions
    if (difficulty === 'easy') {
      questionPool = basePool.filter(q => q.difficulty === 'easy')
    } else if (difficulty === 'hard') {
      questionPool = basePool.filter(q => q.difficulty === 'hard')
    } else {
      questionPool = basePool
    }
    // Last resort: if still not enough, use the full base pool
    if (questionPool.length < questionCount) questionPool = basePool
  }

  const selectedQuestions = selectAdaptiveQuestions(questionPool, askedIds, questionCount)

  // ── Atomic: quota check + session creation ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionId, error: rpcError } = await (supabase as any)
    .rpc('create_session_atomic', { p_difficulty: difficulty })

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('quota_exceeded')) return { error: 'quota_exceeded' }
    if (msg.includes('difficulty_not_allowed')) return { error: 'difficulty_not_allowed' }
    console.error('[createSession] create_session_atomic error:', msg)
    return { error: 'session_failed' }
  }

  // ── Record question history (non-fatal) ────────────────────────────────
  await supabase
    .from('question_history')
    .insert(selectedQuestions.map(q => ({ user_id: userId, question_id: q.id })))

  return { sessionId, questions: selectedQuestions, tier: profile.tier }
}
