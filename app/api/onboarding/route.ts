import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { role_type, interview_date, biggest_weakness } = body

  if (!role_type || !biggest_weakness) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      role_type,
      interview_date: interview_date || null,
      biggest_weakness,
      onboarding_complete: true,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
