import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mic, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; q?: string }>
}) {
  const { session_id, q } = await searchParams

  if (!session_id || !q) redirect('/session/setup')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const firstQuestionId = parseInt(q.split(',')[0], 10)

  const { data: question } = await supabase
    .from('questions')
    .select('*')
    .eq('id', firstQuestionId)
    .single()

  if (!question) redirect('/session/setup')

  const formatLabel = question.answer_format.split(' ')[0]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E07A2F]">Get ready for your session</h1>
        <p className="mt-1 text-sm text-[#A0622A]">3 questions · ~5 minutes</p>
      </div>

      {/* Format briefing card */}
      <Card tinted className="space-y-3">
        <Badge variant="brand">{formatLabel}</Badge>
        <h2 className="text-lg font-semibold text-[#E07A2F]">Your answer format</h2>
        <p className="text-sm italic text-[#A0622A]">{question.answer_format}</p>
        <p className="text-sm text-[#E07A2F]">
          Use this structure to organise your answer. Each of your 3 questions will guide you through it.
        </p>
      </Card>

      {/* What to expect section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#E07A2F]">What to expect</h2>

        <Card className="flex items-start gap-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
          <p className="text-sm text-[#E07A2F]">
            You&apos;ll have 5 seconds to read each question before recording starts automatically.
          </p>
        </Card>

        <Card className="flex items-start gap-4">
          <Mic className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
          <p className="text-sm text-[#E07A2F]">
            Recording stops when the timer runs out. You can also press &apos;Done&apos; at any time to stop early.
          </p>
        </Card>

        <Card className="flex items-start gap-4">
          <BarChart2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
          <p className="text-sm text-[#E07A2F]">
            After each answer, you&apos;ll see your filler word count and speaking pace instantly.
          </p>
        </Card>
      </div>

      {/* Start Interview CTA */}
      <div>
        <Link href={`/session/live?session_id=${session_id}&q=${q}`}>
          <Button variant="primary" size="lg">Start Interview</Button>
        </Link>
      </div>
    </div>
  )
}
