import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { ShareScorecard } from '@/components/session/share-scorecard'
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
  backgroundColor: 'rgba(8,13,26,0.75)',
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

const WPM_IDEAL: Record<string, [number, number]> = {
  easy:   [130, 170],
  medium: [120, 160],
  hard:   [100, 140],
  mixed:  [120, 160],
}

function getWpmLabel(wpm: number | null, difficulty = 'medium'): string {
  if (wpm === null) return ''
  const [lo, hi] = WPM_IDEAL[difficulty] ?? WPM_IDEAL.medium
  const slack = Math.round((hi - lo) * 0.25)
  if (wpm >= lo && wpm <= hi) return 'Ideal'
  if ((wpm >= lo - slack && wpm < lo) || (wpm > hi && wpm <= hi + slack)) return 'Slightly off'
  if (wpm >= lo - slack * 2 && wpm < lo - slack) return 'Too slow'
  if (wpm > hi + slack && wpm <= hi + slack * 2) return 'Too fast'
  return 'Significantly off'
}

function getWpmColor(wpm: number | null, difficulty = 'medium'): string {
  if (wpm === null) return 'text-white/40'
  const [lo, hi] = WPM_IDEAL[difficulty] ?? WPM_IDEAL.medium
  const slack = Math.round((hi - lo) * 0.25)
  if (wpm >= lo && wpm <= hi) return 'text-green-400'
  if ((wpm >= lo - slack && wpm < lo) || (wpm > hi && wpm <= hi + slack)) return 'text-amber-400'
  return 'text-red-400'
}

const COMPONENT_LABELS: Record<string, string> = {
  present: 'Present', past: 'Past', future: 'Future',
  situation: 'Situation', task: 'Task', action: 'Action', result: 'Result',
  name_it: 'Name It', prove_it: 'Prove It', connect_it: 'Connect It',
  show_awareness: 'Show Awareness', show_action: 'Show Action', show_progress: 'Show Progress',
  them: 'Them', you: 'You', together: 'Together',
  near_term: 'Near-term', long_term: 'Long-term', bridge: 'Bridge',
  prioritise: 'Prioritise', act: 'Act', communicate: 'Communicate', evaluate: 'Evaluate',
  pause: 'Pause', reframe: 'Reframe', redirect: 'Redirect',
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

  const sessionDifficulty = session.difficulty ?? 'medium'
  const avgWpmLabel = getWpmLabel(avgWpm, sessionDifficulty)
  const avgWpmColor = getWpmColor(avgWpm, sessionDifficulty)
  const [wpmLo, wpmHi] = WPM_IDEAL[sessionDifficulty] ?? WPM_IDEAL.medium

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
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              <Link href="/session/setup" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20">
                  New Session
                </button>
              </Link>
              <ShareScorecard sessionId={sessionId} />
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
              <p className="text-[10px] text-white/35 mt-1">Ideal: {wpmLo}–{wpmHi} wpm</p>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

                  {/* Transcript — collapsible */}
                  {answer.transcript && (
                    <details className="mt-4 group">
                      <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 hover:text-[#F9C125]/80 transition-colors select-none">
                        <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                        Your answer
                      </summary>
                      <p className="mt-2 text-xs text-white/55 leading-relaxed border-l-2 border-[#F9C125]/20 pl-3">
                        {answer.transcript}
                      </p>
                    </details>
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
            {!isStudent && <Badge variant="brand">Student</Badge>}
          </div>

          {!isStudent ? (
            <div className="relative rounded-xl overflow-hidden">
              {/* Blurred placeholder image */}
              <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/screenshots/ai-feedback.png"
                  alt=""
                  className="w-full rounded-xl object-cover"
                />
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(8,13,26,0.55)' }}>
                <div className="text-center px-6">
                  <div className="flex justify-center mb-3">
                    <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                      <Lock className="h-6 w-6 text-[#F9C125]" />
                    </div>
                  </div>
                  <p className="font-bold text-white mb-1">Unlock AI Feedback</p>
                  <p className="text-sm text-white/60 mb-4">Score, key strengths &amp; one actionable coaching tip per answer</p>
                  <Link href="/#pricing">
                    <button className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all">
                      Upgrade to Student →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(answers ?? []).filter(a => !a.transcription_failed).map((answer) => {
                const q = questionMap[answer.question_id]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fb = answer.ai_feedback as any

                // Components the candidate did well on (≥70% of max)
                const excelledComponents: string[] = fb?.component_scores
                  ? Object.entries(fb.component_scores as Record<string, { score: number; max: number }>)
                      .filter(([, v]) => v.max > 0 && v.score / v.max >= 0.70)
                      .map(([k]) => COMPONENT_LABELS[k] ?? k)
                  : []

                return (
                  <div key={answer.id} className="p-5" style={INNER_CARD}>
                    {/* Header: question + grade */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="text-sm font-medium text-white/80 leading-relaxed flex-1">
                        Q{answer.answer_index} — {q?.question_text ?? 'Question'}
                      </p>
                      {fb && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            'text-xl font-black',
                            fb.grade === 'A' ? 'text-green-400' :
                            fb.grade === 'B' ? 'text-[#F9C125]' :
                            fb.grade === 'C' ? 'text-amber-400' :
                            fb.grade === 'D' ? 'text-amber-500' : 'text-red-400'
                          )}>{fb.grade}</span>
                          <span className="text-xs text-white/35">{fb.score}/100</span>
                        </div>
                      )}
                    </div>

                    {fb ? (
                      <div className="space-y-3">
                        {/* Where they excelled */}
                        {excelledComponents.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-green-400 text-xs font-bold shrink-0">✓</span>
                            <p className="text-xs text-white/65 leading-relaxed">
                              <span className="text-green-400 font-semibold">Strong: </span>
                              {excelledComponents.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Biggest gap */}
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-amber-400 text-xs font-bold shrink-0">↑</span>
                          <p className="text-xs text-white/65 leading-relaxed">
                            <span className="text-amber-400 font-semibold">Improve: </span>
                            {fb.biggest_gap}
                          </p>
                        </div>

                        {/* Coaching tip */}
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-[#F9C125] text-xs font-bold shrink-0">→</span>
                          <p className="text-xs text-white/65 leading-relaxed">
                            <span className="text-[#F9C125] font-semibold">Try this: </span>
                            {fb.coaching_tip}
                          </p>
                        </div>

                        {/* Full details — collapsible */}
                        <details className="group mt-1">
                          <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors select-none pt-2 border-t border-white/8">
                            <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                            Full breakdown
                          </summary>
                          <div className="mt-3 space-y-3">
                            {/* Ideal answer */}
                            {fb.ideal_answer_opening && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-1.5">Ideal Answer</p>
                                <p className="text-xs text-white/60 italic mb-2">&ldquo;{fb.ideal_answer_opening}&rdquo;</p>
                                {fb.ideal_answer_pointers?.length > 0 && (
                                  <ul className="space-y-1">
                                    {fb.ideal_answer_pointers.map((point: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1 h-1 w-1 rounded-full bg-[#F9C125]/40 shrink-0" />
                                        <span className="text-xs text-white/45 leading-relaxed">{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                            {/* Grammar */}
                            {fb.grammar_feedback && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50">Grammar</p>
                                  <span className="text-xs font-bold text-white/60">{fb.grammar_feedback.score}/{fb.grammar_feedback.max}</span>
                                </div>
                                <div className="h-0.5 w-full rounded-full bg-white/10 mb-1.5">
                                  <div className="h-0.5 rounded-full bg-[#F9C125]/60" style={{ width: `${Math.round((fb.grammar_feedback.score / fb.grammar_feedback.max) * 100)}%` }} />
                                </div>
                                <p className="text-xs text-white/40">
                                  {fb.grammar_feedback.issues?.length > 0 ? fb.grammar_feedback.issues[0] : fb.grammar_feedback.overall}
                                </p>
                              </div>
                            )}
                            {/* Component scores */}
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(fb.component_scores as Record<string, { score: number; max: number; feedback: string }>).map(([key, item]) => {
                                const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0
                                const label = COMPONENT_LABELS[key] ?? key
                                return (
                                  <div key={key} className="p-3" style={INNER_CARD}>
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50">{label}</p>
                                      <span className="text-xs font-bold text-white/60">{item.score}/{item.max}</span>
                                    </div>
                                    <div className="h-0.5 w-full rounded-full bg-white/10 mb-1.5">
                                      <div className="h-0.5 rounded-full bg-[#F9C125]/60" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed">{item.feedback}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </details>
                      </div>
                    ) : (
                      <p className="text-white/40 text-xs">No AI feedback available for this answer.</p>
                    )}
                  </div>
                )
              })}
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
                  <div className="p-5 min-h-[220px]" style={INNER_CARD}>
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
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(8,13,26,0.55)' }}>
                  <div className="text-center px-6">
                    <div className="flex justify-center mb-3">
                      <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                        <Lock className="h-6 w-6 text-[#F9C125]" />
                      </div>
                    </div>
                    <p className="font-bold text-white mb-1">Unlock Progress Tracking</p>
                    <p className="text-sm text-white/60 mb-4">WPM trends, filler patterns &amp; weakness analysis</p>
                    <Link href="/#pricing">
                      <button className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all">
                        Upgrade to Pro →
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/dashboard#progress">
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
