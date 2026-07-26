import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { abandonSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = abandonSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { session_id } = parsed.data

  // Verify session belongs to this user and is still in progress
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status !== 'in_progress') return NextResponse.json({ error: 'Session already ended' }, { status: 409 })

  // Mark session as failed (not completed)
  await supabase.from('sessions').update({ status: 'failed' }).eq('id', session_id)

  // Restore quota atomically — single UPDATE avoids TOCTOU race between
  // concurrent requests reading and writing the same counter value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('decrement_sessions_used', { p_user_id: user.id })

  return NextResponse.json({ ok: true })
}
