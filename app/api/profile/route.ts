import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { role_type, interview_date, biggest_weakness } = body

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(role_type !== undefined && { role_type: role_type || null }),
      ...(interview_date !== undefined && { interview_date: interview_date || null }),
      ...(biggest_weakness !== undefined && { biggest_weakness: biggest_weakness || null }),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
