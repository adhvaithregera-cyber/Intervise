import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

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

const PANEL = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(249,193,37,0.18)',
  borderRadius: '1.25rem',
}

const INNER_CARD = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '0.75rem',
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={cn('h-4 w-4', i <= count ? 'text-[#F9C125]' : 'text-white/20')}
          viewBox="0 0 24 24" fill={i <= count ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  )
}

function getWpmLabel(wpm: number | null): string {
  if (wpm === null) return ''
  if (wpm < 110) return 'Slow'
  if (wpm > 160) return 'Fast'
  return 'Ideal'
}

function getWpmColor(wpm: number | null): string {
  if (wpm === null) return 'text-white/40'
  if (wpm < 110) return 'text-amber-400'
  if (wpm > 160) return 'text-red-400'
  return 'text-green-400'
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionId = (await params).id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: answers }, { data: profile }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase.from('answers').select('*').eq('session_id', sessionId).order('answer_index'),
    supabase.from('profiles').select('tier').eq('id', user.id).single(),
  ])

  if (!session || session.user_id !== user.id) notFound()

  const questionIds = [...new Set((answers ?? []).map((a) => a.question_id))]
  const { data: questions } = questionIds.length > 0
    ? await supabase.from('questions').select('id, question_text, answer_format, category_name').in('id', questionIds)
    : { data: [] }

  const tier = profile?.tier ?? 'free'
  const isStudent = tier === 'student' || tier === 'pro'
  const isPro = tier === 'pro'
  const questionMap = Object.fromEntries((questions ?? []).map((q) => [q.id, q]))

  const grade = session.overall_grade ?? '—'
  const gradeColor = GRADE_COLOR[grade] ?? 'text-white/55'
  const starCount = GRADE_STARS[grade] ?? 0

  const validWpms = (answers ?? []).map((a) => a.wpm).filter((v): v is number => v !== null)
  const avgWpm = validWpms.length > 0
    ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length)
    : null
  const totalFillers = (answers ?? []).map((a) => a.filler_count ?? 0).reduce((a, b) => a + b, 0)
  const aggregatedFillers: Record<string, number> = {}
  for (const answer of answers ?? []) {
    if (answer.filler_breakdown) {
      for (const [word, count] of Object.entries(answer.filler_breakdown as Record<string, number>)) {
        aggregatedFillers[word] = (aggregatedFillers[word] ?? 0) + count
      }
    }
  }
  const topFillers = Object.entries(aggregatedFillers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const answeredCount = (answers ?? []).filter((a) => !a.transcription_failed).length
  const totalSeconds = (answers ?? []).map((a) => a.duration_seconds ?? 0).reduce((a, b) => a + b, 0)
  const totalTime = totalSeconds >= 60
    ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
    : `${totalSeconds}s`

  const avgWpmLabel = getWpmLabel(avgWpm)
  const avgWpmColor = getWpmColor(avgWpm)

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <FadeIn delay={0}>
        <div style={PANEL} className="p-4 sm:p-8">

          {/* ── Section 1: Header ──────────────────────────────── */}
          <div className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Session Report</h1>
              <p className="text-sm text-white/40 mt-0.5">
                {new Date(session.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })} · {session.difficulty} difficulty
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/session/setup" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20">
                  New Session
                </button>
              </Link>
              <Link href="/dashboard" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* ── Section 2: Grade + Stats ───────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">

            {/* Grade */}
            <div className="col-span-2 sm:col-span-2 flex items-center gap-4 p-4 sm:p-5" style={INNER_CARD}>
              <div
                className={cn('flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl text-5xl font-black', gradeColor)}
                style={{ background: 'rgba(249,193,37,0.08)', border: '1.5px solid rgba(249,193,37,0.25)' }}
              >
                {grade}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">Overall grade</p>
                <Stars count={starCount} />
                <p className="text-xs text-white/35 mt-2">{answeredCount} of {(answers ?? []).length} answers analysed</p>
              </div>
            </div>

            {/* Avg WPM */}
            <div className="col-span-1 sm:col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Avg pace</p>
              <p className={cn('text-3xl font-bold', avgWpmColor)}>
                {avgWpm ?? '—'}<span className="text-sm font-normal text-white/50 ml-1">wpm</span>
              </p>
              {avgWpm !== null && (
                <p className={cn('text-xs font-semibold mt-1', avgWpmColor)}>{avgWpmLabel}</p>
              )}
              <p className="text-[10px] text-white/35 mt-1">Ideal: 110–160 wpm</p>
            </div>

            {/* Total fillers */}
            <div className="col-span-1 sm:col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Filler words</p>
              <p className="text-3xl font-bold text-white">{totalFillers}</p>
              {topFillers.length > 0 ? (
                <div className="flex gap-1 flex-wrap mt-2">
                  {topFillers.map(([word, count]) => (
                    <Badge key={word} variant="gray">{word} ×{count}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-white/35 mt-1">Across all answers</p>
              )}
            </div>

            {/* Time */}
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Time spoken</p>
              <p className="text-3xl font-bold text-white">{totalTime}</p>
              <p className="text-[10px] text-white/35 mt-1">Total across session</p>
            </div>

          </div>

          {/* ── Divider ────────────────────────────────────────── */}
          <div className="border-t border-white/8 mb-6" />

          {/* ── Section 3: Questions & Answers ─────────────────── */}
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Questions &amp; Answers</h2>
            <p className="text-xs text-white/40 mt-0.5">Your recorded responses and performance per question</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(answers ?? []).map((answer) => {
              const question = questionMap[answer.question_id]
              const formatLabel = question?.answer_format?.split(' ')[0] ?? 'N/A'
              const label = getWpmLabel(answer.wpm)
              const color = getWpmColor(answer.wpm)

              return (
                <div key={answer.id} className="flex flex-col p-5" style={INNER_CARD}>

                  {/* Badge row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="gray">Q{answer.answer_index}</Badge>
                    <Badge variant="brand">{formatLabel}</Badge>
                    {question?.category_name && (
                      <Badge variant="gray">{question.category_name}</Badge>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-white font-medium text-sm leading-relaxed mb-5 flex-1">
                    {question?.question_text ?? 'Question unavailable'}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-white/8 mb-4" />

                  {/* Stats */}
                  {answer.transcription_failed ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="amber">Transcription failed</Badge>
                      <span className="text-xs text-white/40">Feedback unavailable</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-1">Pace</p>
                        <p className={cn('text-xl font-bold', color)}>
                          {answer.wpm ?? '—'}<span className="text-xs font-normal ml-0.5">wpm</span>
                        </p>
                        {label && (
                          <p className={cn('text-[10px] font-semibold mt-0.5', color)}>{label}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-1">Fillers</p>
                        <p className="text-xl font-bold text-white">{answer.filler_count ?? 0}</p>
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
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-1">Duration</p>
                        <p className="text-xl font-bold text-white">{answer.duration_seconds}<span className="text-xs font-normal ml-0.5">s</span></p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Divider ────────────────────────────────────────── */}
          <div className="border-t border-white/8 mt-8 mb-6" />

          {/* ── Section 4: AI Feedback (Student+) ──────────────── */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">AI Feedback</h2>
              <p className="text-xs text-white/40 mt-0.5">STAR scores, ideal answers, and grammar analysis per question</p>
            </div>
            {!isStudent && <Badge variant="brand">Student+</Badge>}
          </div>

          {!isStudent ? (
            <div className="relative rounded-xl overflow-hidden">
              {/* Blurred fake content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                {[1, 2].map((n) => (
                  <div key={n} className="p-5" style={INNER_CARD}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-3">STAR Analysis — Q{n}</p>
                    <div className="space-y-2 mb-4">
                      {[['Situation', '2/3', '66%'], ['Task', '3/3', '100%'], ['Action', '1/3', '33%'], ['Result', '2/3', '66%']].map(([label, score, pct]) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-white/70">{label}</span>
                            <span className="text-xs font-semibold text-[#F9C125]">{score}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-1.5 rounded-full bg-[#F9C125]" style={{ width: pct }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/8 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Ideal Answer</p>
                      <p className="text-xs text-white/55 leading-relaxed">The situation involved a critical deadline where the team needed to deliver under pressure. I took ownership and coordinated with stakeholders to align on priorities before executing a revised plan that met the deadline...</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(28,10,0,0.55)' }}>
                <div className="text-center px-6">
                  <div className="flex justify-center mb-3">
                    <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                      <Lock className="h-6 w-6 text-[#F9C125]" />
                    </div>
                  </div>
                  <p className="font-bold text-white mb-1">Unlock AI Feedback</p>
                  <p className="text-sm text-white/60 mb-4">STAR scores, ideal answers &amp; grammar analysis</p>
                  <Link href="/#pricing">
                    <button className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all">
                      Upgrade to Student →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center" style={INNER_CARD}>
              <p className="text-white/60 text-sm">AI analysis will appear here — powered by Claude Sonnet</p>
              <p className="text-white/35 text-xs mt-1">Full AI feedback pipeline coming soon</p>
            </div>
          )}

          {/* ── Section 5: Progress & Trends (Pro only) ────────── */}
          <div className="mt-8 border-t border-white/8 pt-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Progress &amp; Trends</h2>
                <p className="text-xs text-white/40 mt-0.5">How your performance is trending across sessions</p>
              </div>
              {!isPro && <Badge variant="brand">Pro only</Badge>}
            </div>

            {!isPro ? (
              <div className="relative rounded-xl overflow-hidden">
                {/* Blurred fake chart */}
                <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                  <div className="p-5" style={INNER_CARD}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-3">WPM Trend · Last 8 sessions</p>
                    <div className="flex items-end gap-2 h-16">
                      {[80, 65, 90, 75, 88, 70, 95, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: 'rgba(249,193,37,0.4)' }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((l) => (
                        <span key={l} className="text-[9px] text-white/30">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(28,10,0,0.55)' }}>
                  <div className="text-center px-6">
                    <div className="flex justify-center mb-3">
                      <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                        <Lock className="h-6 w-6 text-[#F9C125]" />
                      </div>
                    </div>
                    <p className="font-bold text-white mb-1">Unlock Progress Tracking</p>
                    <p className="text-sm text-white/60 mb-4">WPM trends, filler patterns &amp; weakness analysis</p>
                    <Link href="/#pricing">
                      <button className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#1C0A00] hover:brightness-110 transition-all">
                        Upgrade to Pro →
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/progress">
                <div className="p-6 text-center cursor-pointer hover:opacity-80 transition-opacity" style={INNER_CARD}>
                  <p className="text-white/60 text-sm">View your full progress dashboard →</p>
                </div>
              </Link>
            )}
          </div>

        </div>
      </FadeIn>
    </div>
  )
}
