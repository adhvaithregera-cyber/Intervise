import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/session'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { sessionStartSchema } from '@/lib/validation'

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

  const result = await createSession(user.id, parsed.data.difficulty, supabase)

  if ('error' in result) {
    if (result.error === 'quota_exceeded') {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 403 })
    }
    if (result.error === 'difficulty_not_allowed') {
      return NextResponse.json({ error: 'difficulty_not_allowed' }, { status: 403 })
    }
    if (result.error === 'profile_not_found') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: result.sessionId, questions: result.questions })
}
