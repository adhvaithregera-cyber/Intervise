import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'

const GRADE_TEXT: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-[#F9C125]',
  C: 'text-amber-400',
  D: 'text-amber-500',
  F: 'text-red-400',
}

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
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

  const gradeTextColor = GRADE_TEXT[session.overall_grade ?? ''] ?? 'text-white/55'

  const validWpms = (answers ?? []).map((a) => a.wpm).filter((v): v is number => v !== null)
  const avgWpm =
    validWpms.length > 0 ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length) : null
  const totalFillers = (answers ?? []).map((a) => a.filler_count ?? 0).reduce((a, b) => a + b, 0)
  const answeredCount = (answers ?? []).filter((a) => !a.transcription_failed).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Grade hero */}
      <FadeIn delay={0}>
        <div className="text-center py-12">
          <div
            className={cn('inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl font-bold mb-4', gradeTextColor)}
            style={{
              backgroundColor: 'rgba(28,10,0,0.80)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(249,193,37,0.40)',
              boxShadow: '0 4px 24px rgba(28,10,0,0.35)',
            }}
          >
            {session.overall_grade ?? '—'}
          </div>
          <h1 className="text-2xl font-semibold text-white">Session complete</h1>
          <p className="text-[#1C0A00] font-medium mt-1">
            {new Date(session.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}
          </p>
        </div>
      </FadeIn>

      {/* Summary stats */}
      <FadeIn delay={0.08}>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Avg speaking pace</p>
            <p className="text-2xl font-bold text-white">{avgWpm ?? '—'} wpm</p>
            <p className="text-xs text-white/60">Target: 130–160</p>
          </div>
          <div className="text-center p-4" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Total filler words</p>
            <p className="text-2xl font-bold text-white">{totalFillers}</p>
          </div>
          <div className="text-center p-4" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Answers analysed</p>
            <p className="text-2xl font-bold text-white">
              {answeredCount} / {(answers ?? []).length}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Per-answer cards */}
      {(answers ?? []).map((answer, i) => {
        const question = questionMap[answer.question_id]
        const formatLabel = question?.answer_format?.split(' ')[0] ?? 'N/A'
        const wpmColor =
          answer.wpm && answer.wpm >= 130 && answer.wpm <= 160 ? 'text-green-400' : 'text-amber-400'

        return (
          <FadeIn key={answer.id} delay={0.12 + i * 0.06}>
            <div className="mb-4 p-6" style={CARD_STYLE}>
              <div className="flex items-start gap-3 mb-4">
                <Badge variant="gray">Q{answer.answer_index}</Badge>
                <Badge variant="brand">{formatLabel}</Badge>
                {question?.category_name && <Badge variant="gray">{question.category_name}</Badge>}
              </div>
              <p className="font-medium text-white mb-4">
                {question?.question_text ?? 'Question unavailable'}
              </p>

              {answer.transcription_failed ? (
                <div className="flex items-center gap-2">
                  <Badge variant="amber">Transcription failed</Badge>
                  <span className="text-sm text-white/70">Feedback unavailable for this answer</span>
                </div>
              ) : (
                <>
                  <div className="flex gap-8 mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Speaking pace</p>
                      <p className={cn('text-xl font-bold', wpmColor)}>{answer.wpm ?? '—'} wpm</p>
                      <p className="text-xs text-white/60">Target: 130–160</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Filler words</p>
                      <p className="text-xl font-bold text-white">{answer.filler_count ?? 0}</p>
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Duration</p>
                      <p className="text-xl font-bold text-white">{answer.duration_seconds}s</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </FadeIn>
        )
      })}

      {/* CTAs */}
      <FadeIn delay={0.32}>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/session/setup">
            <button className="rounded-xl bg-[#F9C125] px-6 py-3 text-base font-bold text-[#1C0A00] shadow-lg shadow-[#F9C125]/25 hover:brightness-110 transition-all">
              Start New Session
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="rounded-xl border border-[#1C0A00]/40 bg-[#1C0A00]/10 px-6 py-3 text-base font-semibold text-[#1C0A00] hover:bg-[#1C0A00]/20 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
