import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mic, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

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

  // ── Verify the session belongs to this user and is still in progress ────
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  // Redirect to unauthorized if session doesn't exist or belongs to another user
  if (!session) redirect('/unauthorized')

  // If session is already complete, send directly to report
  if (session.status === 'complete') {
    redirect(`/session/report/${session_id}`)
  }

  // ── Load the first question for the format briefing ──────────────────────
  const firstQuestionId = parseInt(q.split(',')[0], 10)
  if (isNaN(firstQuestionId)) redirect('/session/setup')

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
      <FadeIn delay={0}>
        <div>
          <h1 className="text-2xl font-bold text-white">Get ready for your session</h1>
          <p className="mt-1 text-sm text-white/55 font-medium">{q.split(',').length} questions · ~{Math.ceil(q.split(',').length * 1.5)} minutes</p>
        </div>
      </FadeIn>

      {/* Format briefing card */}
      <FadeIn delay={0.08}>
        <div
          className="space-y-3 p-6"
          style={{
            ...CARD_STYLE,
            borderLeft: '3px solid #F9C125',
          }}
        >
          <Badge variant="brand">{formatLabel}</Badge>
          <h2 className="text-lg font-semibold text-white">Your answer format</h2>
          <p className="text-sm italic text-[#F9C125]/80">{question.answer_format}</p>
          <p className="text-sm text-white/80">
            Use this structure to organise your answer. Each of your 3 questions will guide you through it.
          </p>
        </div>
      </FadeIn>

      {/* What to expect section */}
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
          <Link href={`/session/live?session_id=${session_id}&q=${q}`}>
            <button className="bg-[#F9C125] text-[#1C0A00] font-bold rounded-xl px-8 py-3.5 text-base shadow-lg shadow-[#F9C125]/25 hover:brightness-110 transition-all">
              Start Interview
            </button>
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
