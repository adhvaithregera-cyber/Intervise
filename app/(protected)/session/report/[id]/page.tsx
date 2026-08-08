import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { computeThreeMetrics, computeSessionMetrics } from '@/lib/scorecard'
import { FILLER_PATTERNS } from '@/lib/analysis'
import type { AiFeedback } from '@/types/database'

function highlightFillers(
  transcript: string,
  fillerBreakdown: Record<string, number>,
): Array<{ text: string; filler: boolean }> {
  const activePatterns = FILLER_PATTERNS.filter(p => fillerBreakdown[p.key])
  if (activePatterns.length === 0) return [{ text: transcript, filler: false }]

  const combined = new RegExp(
    activePatterns.map(p => p.regex.source).join('|'),
    'gi',
  )

  const segments: Array<{ text: string; filler: boolean }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = combined.exec(transcript)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: transcript.slice(lastIndex, match.index), filler: false })
    }
    segments.push({ text: match[0], filler: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < transcript.length) {
    segments.push({ text: transcript.slice(lastIndex), filler: false })
  }
  return segments
}

function scoreColor(n: number): string {
  if (n >= 75) return 'text-[#F9C125]'
  if (n >= 50) return 'text-white'
  return 'text-red-400'
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

const COMPONENT_LABELS: Record<string, Record<string, { label: string; gloss: string }>> = {
  'Identity & Background': {
    present: { label: 'Where you are now',    gloss: 'Your current role and strengths' },
    past:    { label: 'How you got here',     gloss: 'The experience that shaped you' },
    future:  { label: "Where you're heading", gloss: "How this connects to what's next" },
  },
  'Behavioural / Experience': {
    situation: { label: 'Set the scene',       gloss: 'What was the context or situation?' },
    task:      { label: 'Your responsibility', gloss: 'What was your specific role in it?' },
    action:    { label: 'What you did',        gloss: 'The concrete steps you actually took' },
    result:    { label: 'How it turned out',   gloss: 'The outcome — ideally something measurable' },
  },
  'Strengths': {
    name_it:    { label: 'Name the strength', gloss: 'State it clearly and specifically' },
    prove_it:   { label: 'Back it up',        gloss: 'A real example that proves it' },
    connect_it: { label: 'Make it relevant',  gloss: 'Why it matters for this role' },
  },
  'Weaknesses': {
    name_it:        { label: 'Name a real weakness',       gloss: 'A genuine one — not a humblebrag' },
    show_awareness: { label: 'Show its impact',            gloss: 'A time it caused a real problem' },
    show_action:    { label: "What you're doing about it", gloss: "Concrete steps you're taking" },
    show_progress:  { label: "Show you're improving",      gloss: "Evidence it's getting better" },
  },
  'Motivation & Fit': {
    them:     { label: 'Why them',       gloss: 'What draws you to this company or role specifically' },
    you:      { label: 'What you bring', gloss: 'Your relevant strengths and experience' },
    together: { label: 'The fit',        gloss: 'How you and the role connect and grow together' },
  },
  'Future & Ambition': {
    near_term: { label: 'Your next steps',       gloss: 'Specific goals for the next 1–2 years' },
    long_term: { label: 'Your bigger direction', gloss: 'Where you ultimately want to go' },
    bridge:    { label: 'How they connect',      gloss: 'How this role gets you there' },
  },
  'Situational / Hypothetical': {
    prioritise:  { label: "How you'd size it up",    gloss: 'Judging what matters first' },
    act:         { label: 'Your plan',               gloss: 'Concrete, step-by-step actions' },
    communicate: { label: "Who you'd involve",       gloss: 'Keeping the right people in the loop' },
    evaluate:    { label: "How you'd know it worked", gloss: 'Checking the outcome was resolved' },
  },
  'Curveball / Pressure': {
    pause:    { label: 'Staying composed',       gloss: 'Taking a beat instead of panicking' },
    reframe:  { label: 'Reframing the question', gloss: 'Turning it into something answerable' },
    redirect: { label: 'Steering to strength',   gloss: 'Guiding it toward a strong answer' },
  },
}

function getComponentLabel(
  categoryName: string | undefined,
  key: string,
): { label: string; gloss: string } {
  if (!categoryName) return { label: key, gloss: '' }
  return COMPONENT_LABELS[categoryName]?.[key] ?? { label: key, gloss: '' }
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

  const sessionMetrics = computeSessionMetrics(answers ?? [])

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
              <Link href="/session/setup" className="flex-1 sm:flex-none rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20 inline-flex items-center justify-center w-full sm:w-auto">
                New Session
              </Link>
              <Link href="/dashboard" className="flex-1 sm:flex-none rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors inline-flex items-center justify-center w-full sm:w-auto">
                Dashboard
              </Link>
            </div>
          </div>

          {/* ── Section 2: Metrics ─────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">

            {/* Your Score */}
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Your Score</p>
              <p className={cn('text-4xl font-black', scoreColor(sessionMetrics?.yourScore ?? 0))}>
                {sessionMetrics?.yourScore ?? '—'}
              </p>
              <p className="text-[10px] text-white/35 mt-1">/ 100 · {answeredCount} answers</p>
            </div>

            {/* Fluency */}
            <div className="col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Fluency</p>
              <p className={cn('text-3xl font-bold', scoreColor(sessionMetrics?.fluency ?? 0))}>
                {sessionMetrics?.fluency ?? '—'}
              </p>
              <p className="text-[10px] text-white/35 mt-1">/ 100</p>
              {avgWpm !== null && (
                <p className={cn('text-[10px] font-semibold mt-1', avgWpmColor)}>
                  {avgWpm} wpm · {totalFillers} fillers
                </p>
              )}
            </div>

            {/* Accuracy */}
            <div className="col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Grammar</p>
              <p className={cn('text-3xl font-bold', scoreColor(sessionMetrics?.accuracy ?? 0))}>
                {sessionMetrics?.accuracy ?? '—'}
              </p>
              <p className="text-[10px] text-white/35 mt-1">/ 100</p>
              <p className="text-[10px] text-white/35 mt-1">Language quality</p>
            </div>

            {/* Skill */}
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center p-4 sm:p-5" style={INNER_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/50 mb-2">Skill</p>
              <p className={cn('text-3xl font-bold', scoreColor(sessionMetrics?.skill ?? 0))}>
                {sessionMetrics?.skill ?? '—'}
              </p>
              <p className="text-[10px] text-white/35 mt-1">/ 100</p>
              <p className="text-[10px] text-white/35 mt-1">Structure &amp; content</p>
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
              const label = getWpmLabel(answer.wpm, sessionDifficulty)
              const color = getWpmColor(answer.wpm, sessionDifficulty)

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
                      <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/80 hover:text-[#F9C125] transition-colors select-none">
                        <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                        Your answer
                      </summary>
                      <p className="mt-2 text-xs text-white/75 leading-relaxed border-l-2 border-[#F9C125]/35 pl-3">
                        {answer.filler_breakdown && Object.keys(answer.filler_breakdown).length > 0
                          ? highlightFillers(answer.transcript, answer.filler_breakdown as Record<string, number>).map((seg, i) =>
                              seg.filler
                                ? <mark key={i} className="bg-amber-400/20 text-amber-300 not-italic rounded-sm px-0.5">{seg.text}</mark>
                                : <span key={i}>{seg.text}</span>
                            )
                          : answer.transcript
                        }
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
              <p className="text-xs text-white/40 mt-0.5">Fluency, Accuracy, Skill breakdown and coaching tips per question</p>
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
                  <Link href="/#pricing" className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all inline-block">
                    Upgrade to Student →
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
                      .map(([k]) => getComponentLabel(q?.category_name, k).label)
                  : []

                return (
                  <div key={answer.id} className="p-5" style={INNER_CARD}>
                    {/* Header: question */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white/80 leading-relaxed">
                        Q{answer.answer_index} — {q?.question_text ?? 'Question'}
                      </p>
                    </div>

                    {fb ? (
                      <div className="space-y-4">
                        {/* Where they excelled */}
                        {excelledComponents.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">✓ Strong</p>
                            <p className="text-sm text-white/75 leading-relaxed">{excelledComponents.join(', ')}</p>
                          </div>
                        )}

                        {/* Biggest gap */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">↑ Improve</p>
                          <p className="text-sm text-white/75 leading-relaxed">{fb.biggest_gap}</p>
                        </div>

                        {/* Coaching tip */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]">→ Try this</p>
                          <p className="text-sm text-white/75 leading-relaxed">{fb.coaching_tip}</p>
                        </div>

                        {/* Full details — collapsible */}
                        <details className="group mt-1">
                          <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors select-none pt-2 border-t border-white/8">
                            <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                            Full breakdown
                          </summary>
                          <div className="mt-3 space-y-3">
                            {/* Component scores — worst first, feedback shown for gaps only */}
                            {(() => {
                              const entries = Object.entries(fb.component_scores as Record<string, { score: number; max: number; feedback: string }>)
                                .sort(([, a], [, b]) => {
                                  const pctA = a.max > 0 ? a.score / a.max : 1
                                  const pctB = b.max > 0 ? b.score / b.max : 1
                                  return pctA - pctB
                                })
                              return entries.map(([key, item]) => {
                                const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0
                                const isGap = pct < 60
                                const { label, gloss } = getComponentLabel(q?.category_name, key)
                                const barColor = pct >= 70 ? 'bg-green-400' : pct >= 45 ? 'bg-amber-400' : 'bg-red-500'
                                const labelColor = pct >= 70 ? 'text-white/40' : pct >= 45 ? 'text-amber-400' : 'text-red-400'
                                return (
                                  <div key={key}>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <div>
                                        <p className={cn('text-[10px] font-bold uppercase tracking-widest', labelColor)}>{label}</p>
                                        {gloss && <p className="text-[10px] text-white/50 normal-case tracking-normal font-normal leading-snug">{gloss}</p>}
                                      </div>
                                      <span className="text-xs font-bold text-white/50 shrink-0 ml-2">{item.score}/{item.max}</span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-white/10 mb-1.5 mt-1">
                                      <div className={cn('h-1 rounded-full', barColor)} style={{ width: `${pct}%` }} />
                                    </div>
                                    {isGap && item.feedback && (
                                      <p className="text-xs text-white/55 leading-snug">{item.feedback}</p>
                                    )}
                                  </div>
                                )
                              })
                            })()}
                            {/* Grammar — only show if there are issues */}
                            {fb.grammar_feedback && fb.grammar_feedback.issues?.length > 0 && (
                              <div className="pt-2 border-t border-white/8">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/80">Grammar</p>
                                  <span className="text-xs font-bold text-white/50">{fb.grammar_feedback.score}/{fb.grammar_feedback.max}</span>
                                </div>
                                <p className="text-xs text-white/55">{fb.grammar_feedback.issues[0]}</p>
                              </div>
                            )}
                            {/* Ideal answer — opening line only */}
                            {fb.ideal_answer_opening && (
                              <div className="pt-2 border-t border-white/8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/80 mb-1">Ideal Opening</p>
                                <p className="text-xs text-white/50 italic">&ldquo;{fb.ideal_answer_opening}&rdquo;</p>
                              </div>
                            )}
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
                    <Link href="/#pricing" className="rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all inline-block">
                      Upgrade to Pro →
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
