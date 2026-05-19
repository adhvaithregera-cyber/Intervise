import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'
import { profileUpdateSchema } from '@/lib/validation'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = checkRateLimit(`${user.id}:profile`, RATE_LIMITS.profile)
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

  const parsed = profileUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Build update from validated fields only — .strict() already rejected unknown keys
  const { role_type, interview_date, biggest_weakness } = parsed.data

  if (role_type === undefined && interview_date === undefined && biggest_weakness === undefined) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(role_type        !== undefined && { role_type:        role_type        || null }),
      ...(interview_date   !== undefined && { interview_date:   interview_date   || null }),
      ...(biggest_weakness !== undefined && { biggest_weakness: biggest_weakness || null }),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[profile] update error:', error.message)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
