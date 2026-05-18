import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const GRADE_COLORS: Record<string, { text: string; bg: string }> = {
  A: { text: 'text-green-700', bg: 'bg-green-50' },
  B: { text: 'text-blue-700', bg: 'bg-blue-50' },
  C: { text: 'text-amber-700', bg: 'bg-amber-50' },
  D: { text: 'text-orange-700', bg: 'bg-orange-50' },
  F: { text: 'text-red-700', bg: 'bg-red-50' },
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionId = (await params).id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: answers }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase.from('answers').select('*').eq('session_id', sessionId).order('answer_index'),
  ])

  if (!session || session.user_id !== user.id) notFound()

  const questionIds = (answers ?? []).map((a) => a.question_id)
  const { data: questions } = await supabase.from('questions').select('*').in('id', questionIds)
  const questionMap = Object.fromEntries((questions ?? []).map((q) => [q.id, q]))

  const gradeColor = GRADE_COLORS[session.overall_grade ?? ''] ?? { text: 'text-[#6BA3C8]', bg: 'bg-[#FEFDF0]' }

  const validWpms = (answers ?? []).map((a) => a.wpm).filter((v): v is number => v !== null)
  const avgWpm =
    validWpms.length > 0 ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length) : null
  const totalFillers = (answers ?? []).map((a) => a.filler_count ?? 0).reduce((a, b) => a + b, 0)
  const answeredCount = (answers ?? []).filter((a) => !a.transcription_failed).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Grade hero */}
      <div className="text-center py-12">
        <div
          className={cn(
            'inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl font-bold mb-4',
            gradeColor.bg,
            gradeColor.text,
          )}
        >
          {session.overall_grade ?? '—'}
        </div>
        <h1 className="text-2xl font-semibold text-[#E07A2F]">Session complete</h1>
        <p className="text-[#6BA3C8] mt-1">
          {new Date(session.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-4">
          <p className="text-sm text-[#6BA3C8]">Avg speaking pace</p>
          <p className="text-2xl font-bold text-[#E07A2F]">{avgWpm ?? '—'} wpm</p>
          <p className="text-xs text-[#6BA3C8]">Target: 130–160</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-sm text-[#6BA3C8]">Total filler words</p>
          <p className="text-2xl font-bold text-[#E07A2F]">{totalFillers}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-sm text-[#6BA3C8]">Answers analysed</p>
          <p className="text-2xl font-bold text-[#E07A2F]">
            {answeredCount} / {(answers ?? []).length}
          </p>
        </Card>
      </div>

      {/* Per-answer cards */}
      {(answers ?? []).map((answer) => {
        const question = questionMap[answer.question_id]
        const formatLabel = question?.answer_format?.split(' ')[0] ?? 'N/A'
        const wpmColor =
          answer.wpm && answer.wpm >= 130 && answer.wpm <= 160 ? 'text-green-600' : 'text-amber-500'

        return (
          <Card key={answer.id} className="mb-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <Badge variant="gray">Q{answer.answer_index}</Badge>
              <Badge variant="brand">{formatLabel}</Badge>
              {question?.category_name && <Badge variant="gray">{question.category_name}</Badge>}
            </div>
            <p className="font-medium text-[#E07A2F] mb-4">
              {question?.question_text ?? 'Question unavailable'}
            </p>

            {answer.transcription_failed ? (
              <div className="flex items-center gap-2">
                <Badge variant="amber">Transcription failed</Badge>
                <span className="text-sm text-[#6BA3C8]">Feedback unavailable for this answer</span>
              </div>
            ) : (
              <>
                <div className="flex gap-8 mb-4">
                  <div>
                    <p className="text-sm text-[#6BA3C8]">Speaking pace</p>
                    <p className={cn('text-xl font-bold', wpmColor)}>{answer.wpm ?? '—'} wpm</p>
                    <p className="text-xs text-[#6BA3C8]">Target: 130–160</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6BA3C8]">Filler words</p>
                    <p className="text-xl font-bold text-[#E07A2F]">{answer.filler_count ?? 0}</p>
                    {answer.filler_breakdown &&
                      Object.keys(answer.filler_breakdown).length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {Object.entries(answer.filler_breakdown as Record<string, number>).map(
                            ([word, count]) => (
                              <Badge key={word} variant="gray">
                                {word} ×{count}
                              </Badge>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6BA3C8]">Duration</p>
                    <p className="text-xl font-bold text-[#E07A2F]">{answer.duration_seconds}s</p>
                  </div>
                </div>
                {answer.transcript && (
                  <blockquote className="border-l-4 border-[#6BA3C8] pl-4 text-sm text-[#6BA3C8] italic line-clamp-3">
                    &ldquo;{answer.transcript.slice(0, 300)}
                    {answer.transcript.length > 300 ? '...' : ''}&rdquo;
                  </blockquote>
                )}
              </>
            )}
          </Card>
        )
      })}

      {/* CTAs */}
      <div className="flex gap-4 justify-center mt-8">
        <Link href="/session/setup">
          <Button variant="primary">Start New Session</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
