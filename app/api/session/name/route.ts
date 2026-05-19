import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { sessionNameSchema } from '@/lib/validation'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:sessionName`, RATE_LIMITS.sessionName)
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

  const parsed = sessionNameSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }
  const { session_id, name } = parsed.data

  const { error } = await supabase
    .from('sessions')
    .update({ name: name?.trim() || null })
    .eq('id', session_id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[session/name] update error:', error.message)
    return NextResponse.json({ error: 'Failed to update session name' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
