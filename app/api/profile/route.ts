import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { age, role_type, interview_date, biggest_weakness } = body

  const updates: Record<string, unknown> = {}
  if (age !== undefined) updates.age = age === '' ? null : Number(age)
  if (role_type !== undefined) updates.role_type = role_type || null
  if (interview_date !== undefined) updates.interview_date = interview_date || null
  if (biggest_weakness !== undefined) updates.biggest_weakness = biggest_weakness || null

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
