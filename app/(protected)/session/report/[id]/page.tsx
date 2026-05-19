import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'

const GRADE_COLOR: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-[#F9C125]',
  C: 'text-amber-400',
  D: 'text-amber-500',
  F: 'text-red-400',
}

const GRADE_STARS: Record<string, number> = {
  A: 5, B: 4, C: 3, D: 2, F: 1,
}

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={cn('h-4 w-4', i <= count ? 'text-[#F9C125]' : 'text-white/20')}
          viewBox="0 0 24 24" fill={i <= count ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  )
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

  const grade = session.overall_grade ?? '—'
  const gradeColor = GRADE_COLOR[grade] ?? 'text-white/55'
  const starCount = GRADE_STARS[grade] ?? 0

  const validWpms = (answers ?? []).map((a) => a.wpm).filter((v): v is number => v !== null)
  const avgWpm = validWpms.length > 0
    ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length)
    : null
  const totalFillers = (answers ?? []).map((a) => a.filler_count ?? 0).reduce((a, b) => a + b, 0)
  const answeredCount = (answers ?? []).filter((a) => !a.transcription_failed).length
  const totalSeconds = (answers ?? []).map((a) => a.duration_seconds ?? 0).reduce((a, b) => a + b, 0)
  const totalTime = totalSeconds >= 60
    ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
    : `${totalSeconds}s`

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Top dashboard row ─────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="grid grid-cols-5 gap-4">

          {/* Grade + stars — wider */}
          <div className="col-span-2 flex items-center gap-6 p-6" style={CARD_STYLE}>
            <div
              className={cn('flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl text-5xl font-black', gradeColor)}
              style={{
                background: 'rgba(249,193,37,0.08)',
                border: '1.5px solid rgba(249,193,37,0.30)',
              }}
            >
              {grade}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">Overall grade</p>
              <Stars count={starCount} />
              <p className="text-xs text-white/40 mt-2">
                {new Date(session.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Avg WPM */}
          <div className="flex flex-col justify-center p-5" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Avg pace</p>
            <p className="text-3xl font-bold text-white">{avgWpm ?? '—'}</p>
            <p className="text-xs text-white/40 mt-0.5">wpm · target 130–160</p>
          </div>

          {/* Filler words */}
          <div className="flex flex-col justify-center p-5" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Filler words</p>
            <p className="text-3xl font-bold text-white">{totalFillers}</p>
            <p className="text-xs text-white/40 mt-0.5">total across all answers</p>
          </div>

          {/* Analysed + time */}
          <div className="flex flex-col justify-center p-5" style={CARD_STYLE}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Session</p>
            <p className="text-3xl font-bold text-white">{answeredCount}<span className="text-white/40 text-lg font-medium"> / {(answers ?? []).length}</span></p>
            <p className="text-xs text-white/40 mt-0.5">answered · {totalTime} total</p>
          </div>

        </div>
      </FadeIn>

      {/* ── Per-answer cards grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {(answers ?? []).map((answer, i) => {
          const question = questionMap[answer.question_id]
          const formatLabel = question?.answer_format?.split(' ')[0] ?? 'N/A'
          const wpmOk = answer.wpm !== null && answer.wpm >= 130 && answer.wpm <= 160
          const wpmColor = answer.wpm === null ? 'text-white/40' : wpmOk ? 'text-green-400' : 'text-amber-400'

          return (
            <FadeIn key={answer.id} delay={0.08 + i * 0.05}>
              <div className="p-6 h-full flex flex-col" style={CARD_STYLE}>
                {/* Badge row */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="gray">Q{answer.answer_index}</Badge>
                  <Badge variant="brand">{formatLabel}</Badge>
                  {question?.category_name && (
                    <Badge variant="gray">{question.category_name}</Badge>
                  )}
                </div>

                {/* Question text */}
                <p className="text-white font-semibold text-base leading-snug mb-5 flex-1">
                  {question?.question_text ?? 'Question unavailable'}
                </p>

                {answer.transcription_failed ? (
                  <div className="flex items-center gap-2 mt-auto">
                    <Badge variant="amber">Transcription failed</Badge>
                    <span className="text-sm text-white/50">Feedback unavailable</span>
                  </div>
                ) : (
                  <div className="mt-auto">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Speaking pace</p>
                        <p className={cn('text-2xl font-bold', wpmColor)}>
                          {answer.wpm ?? '—'}<span className="text-sm font-normal"> wpm</span>
                        </p>
                        <p className="text-[10px] text-white/35 mt-0.5">Target: 130–160</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Filler words</p>
                        <p className="text-2xl font-bold text-white">{answer.filler_count ?? 0}</p>
                        {answer.filler_breakdown &&
                          Object.keys(answer.filler_breakdown as Record<string, number>).length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {Object.entries(answer.filler_breakdown as Record<string, number>).map(([word, count]) => (
                                <Badge key={word} variant="gray">{word} ×{count}</Badge>
                              ))}
                            </div>
                          )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Duration</p>
                        <p className="text-2xl font-bold text-white">{answer.duration_seconds}<span className="text-sm font-normal"> s</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          )
        })}
      </div>

      {/* ── CTAs ─────────────────────────────────────────────── */}
      <FadeIn delay={0.3}>
        <div className="flex gap-4 pb-8">
          <Link href="/session/setup">
            <button className="rounded-xl bg-[#F9C125] px-6 py-3 text-sm font-bold text-[#1C0A00] shadow-lg shadow-[#F9C125]/25 hover:brightness-110 transition-all">
              Start New Session
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
