import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mic, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/session'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'mixed', 'hard']

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '0.75rem',
}

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>
}) {
  const { difficulty: rawDifficulty } = await searchParams

  if (!rawDifficulty || !VALID_DIFFICULTIES.includes(rawDifficulty as Difficulty)) {
    redirect('/session/setup')
  }
  const difficulty = rawDifficulty as Difficulty

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Create session server-side — happens while the loading skeleton is visible
  const result = await createSession(user.id, difficulty, supabase)

  if ('error' in result) {
    if (result.error === 'quota_exceeded') redirect('/dashboard?error=quota_exceeded')
    if (result.error === 'difficulty_not_allowed') redirect('/session/setup')
    redirect('/dashboard?error=session_failed')
  }

  const { sessionId, questions } = result
  const firstQuestion = questions[0]
  if (!firstQuestion) redirect('/session/setup')

  const questionIds = questions.map(q => q.id).join(',')
  const formatLabel = firstQuestion.answer_format.split(' ')[0]

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl p-8 space-y-8"
        style={{
          backgroundColor: 'rgba(28,10,0,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,193,37,0.18)',
        }}
      >
      {/* Page header */}
      <FadeIn delay={0}>
        <div>
          <h1 className="text-2xl font-bold text-white">Get ready for your session</h1>
          <p className="mt-1 text-sm text-white/55 font-medium">
            {questions.length} questions · ~{Math.ceil(questions.length * 1.5)} minutes
          </p>
        </div>
      </FadeIn>

      {/* Format briefing card */}
      <FadeIn delay={0.08}>
        <div
          className="space-y-3 p-6"
          style={{ ...CARD_STYLE, borderLeft: '3px solid #F9C125' }}
        >
          <Badge variant="brand">{formatLabel}</Badge>
          <h2 className="text-lg font-semibold text-white">Your answer format</h2>
          <p className="text-sm italic text-[#F9C125]/80">{firstQuestion.answer_format}</p>
          <p className="text-sm text-white/80">
            Use this structure to organise your answer. Each of your {questions.length} questions will guide you through it.
          </p>
        </div>
      </FadeIn>

      {/* What to expect */}
      <FadeIn delay={0.16}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">What to expect</h2>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              You&apos;ll have 5 seconds to read each question before recording starts automatically.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <Mic className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              Recording stops when the timer runs out. You can also press &apos;Done&apos; at any time to stop early.
            </p>
          </div>

          <div className="flex items-start gap-4 p-5" style={CARD_STYLE}>
            <BarChart2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F9C125]" />
            <p className="text-sm text-white/80">
              After each answer, you&apos;ll see your filler word count and speaking pace instantly.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Start Interview CTA */}
      <FadeIn delay={0.24}>
        <div>
          <Link href={`/session/live?session_id=${sessionId}&q=${questionIds}`}>
            <button className="bg-[#F9C125] text-[#1C0A00] font-bold rounded-xl px-8 py-3.5 text-base shadow-lg shadow-[#F9C125]/25 hover:brightness-110 transition-all">
              Start Interview
            </button>
          </Link>
        </div>
      </FadeIn>
      </div>
    </div>
  )
}
