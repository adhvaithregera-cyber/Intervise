import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FadeIn } from '@/components/ui/fade-in'
import { ProfileEditCard } from './profile-edit-card'
import { RecentSessionsList } from './recent-sessions-list'
import { ChartsClient } from './charts-client'
import type { SessionStat } from './charts-client'
import { Lock } from 'lucide-react'
import { computeSessionMetrics } from '@/lib/scorecard'
import { FirstSessionPanel } from './first-session-panel'
import { DashboardRefresher } from '@/components/dashboard/dashboard-refresher'
import type { Answer, AiFeedback } from '@/types/database'
import { detectFocusAreas } from '@/lib/focusareas'
import { FocusAreasCard } from './focus-areas-card'

const QUICK_TIPS = [
  'Use the STAR format — Situation, Task, Action, Result — to keep answers concise and structured.',
  'Keep answers between 60 and 90 seconds — long enough to show depth, short enough to hold attention.',
  'Say "I" instead of "we" when describing your contribution — interviewers are assessing you, not your team.',
  'Spend half your answer on the Action step — that\'s where your actual skill shows.',
  'End every story with a measurable result — numbers make your impact real.',
  'Answer the question first, then add context — never build up to your point.',
  'Pause for two seconds before answering — it reads as considered, not slow.',
  'Prepare five flexible stories instead of fifty scripted answers — stories adapt to any question.',
  'Practise your answers out loud, not in your head — they sound completely different when spoken.',
  'Research the company\'s recent announcements, not just their About page — specificity signals genuine interest.',
  'Replace "I\'m a perfectionist" with a real weakness and a real fix — every interviewer has heard the perfectionist line.',
  'Structure weakness answers as Name, Own, Act, Progress — it shows self-awareness rather than deflection.',
  'Give one specific reason for wanting the role that only you could give — generic praise sounds rehearsed.',
  'Slow your speech down deliberately — nerves make you talk faster than you realise.',
  'Cut filler words by preparing for the questions you\'re avoiding — fillers spike on unprepared topics.',
  'Use numbers over adjectives — "reduced processing time by 30%" beats "improved efficiency."',
  'Close your answer with a clear final sentence — trailing off undoes an otherwise strong response.',
  'Say "I don\'t know, but here\'s how I\'d find out" when stuck — honesty plus method beats guessing.',
  'Never criticise a former employer — it reflects on your judgment, not theirs.',
  'Prepare three questions you genuinely want answered — it turns the interview into a conversation.',
  'Match the interviewer\'s energy and formality — reading the room is itself a skill.',
  'Rehearse under time pressure, not just at your desk — freezing comes from unfamiliar conditions, not lack of knowledge.',
  'Record yourself once and watch it back — you\'ll catch habits you didn\'t know you had.',
  'Frame every story around a decision you made — interviewers hire decision-makers, not participants.',
  'Treat the interview as a mutual assessment — you\'re evaluating them too, and that mindset steadies your nerves.',
]

const TIER_LABELS: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }

const TIER_SESSION_LIMITS: Record<string, number> = { free: 2, student: 12, pro: 30 }

const CARD_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const INNER_CARD = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '0.75rem',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: pageError } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isPro = profile.tier === 'pro'
  const isStudent = profile.tier === 'student' || isPro

  // ── History window ──────────────────────────────────────────────────────
  // Free: 7 days | Student: 3 months | Pro: unlimited
  const getWindowCutoff = (tier: string) => {
    if (tier === 'free') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    if (tier === 'student') return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    return null // Pro: unlimited
  }
  const windowCutoff = getWindowCutoff(profile.tier)

  // ── Build both session queries ──────────────────────────────────────────
  let recentQ = supabase
    .from('sessions').select('*').eq('user_id', user.id).eq('status', 'complete')
    .order('completed_at', { ascending: false })
  if (windowCutoff) recentQ = recentQ.gte('created_at', windowCutoff)

  let chartQ = supabase
    .from('sessions').select('id, created_at, difficulty, overall_grade').eq('user_id', user.id).eq('status', 'complete')
    .order('created_at', { ascending: false })
  if (windowCutoff) chartQ = chartQ.gte('created_at', windowCutoff)

  // ── Fetch both in parallel ──────────────────────────────────────────────
  const [{ data: recentSessions }, chartSessionsResult] = await Promise.all([
    recentQ.limit(20),
    isStudent ? chartQ.limit(30) : Promise.resolve({ data: null, error: null }),
  ])

  // ── Chart data (Student+ only) ──────────────────────────────────────────
  type CategoryStat = { category: string; avgFillers: number; sessions: number }

  let sessionStats: SessionStat[] = []
  let categoryStats: CategoryStat[] = []

  if (isStudent) {
    const chartSessions = chartSessionsResult.data
    const sessionIds = (chartSessions ?? []).map((s) => s.id)

    if (sessionIds.length > 0) {
      // Fetch answers + questions for those sessions in parallel
      const { data: answers } = await supabase
        .from('answers').select('session_id, filler_count, wpm, question_id, ai_feedback')
        .in('session_id', sessionIds).not('transcription_failed', 'is', true)

      const questionIds = [...new Set((answers ?? []).map((a) => a.question_id))]
      const [{ data: questions }] = await Promise.all([
        questionIds.length > 0
          ? supabase.from('questions').select('id, category_name').in('id', questionIds)
          : Promise.resolve({ data: [] }),
      ])

      const questionMap = Object.fromEntries((questions ?? []).map((q) => [q.id, q.category_name]))

      // Per-session stats
      const statsBySession: Record<string, { fillerTotal: number; fillerCount: number; wpms: number[]; date: string; feedbacks: Pick<Answer, 'ai_feedback'>[] }> = {}
      for (const s of chartSessions ?? []) {
        const d = new Date(s.created_at)
        statsBySession[s.id] = {
          date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          fillerTotal: 0,
          fillerCount: 0,
          wpms: [],
          feedbacks: [],
        }
      }
      for (const a of answers ?? []) {
        if (!statsBySession[a.session_id]) continue
        statsBySession[a.session_id].fillerTotal += a.filler_count ?? 0
        statsBySession[a.session_id].fillerCount += 1
        if (a.wpm !== null) statsBySession[a.session_id].wpms.push(a.wpm)
        if (a.ai_feedback) statsBySession[a.session_id].feedbacks.push({ ai_feedback: a.ai_feedback as AiFeedback })
      }

      // Count occurrences of each date to detect duplicates
      const dateCount: Record<string, number> = {}
      for (const s of chartSessions ?? []) {
        const d = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        dateCount[d] = (dateCount[d] ?? 0) + 1
      }

      sessionStats = (chartSessions ?? []).map((s) => {
        const st = statsBySession[s.id]
        const avgFillers = st.fillerCount > 0 ? Math.round(st.fillerTotal / st.fillerCount) : 0
        const avgWpm = st.wpms.length > 0
          ? Math.round(st.wpms.reduce((a, b) => a + b, 0) / st.wpms.length)
          : null
        const diff = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)
        const label = (dateCount[st.date] ?? 1) > 1 ? `${diff} · ${st.date}` : st.date
        const m = computeSessionMetrics(st.feedbacks)
        return {
          label, date: st.date, isoDate: s.created_at,
          fillers: avgFillers, wpm: avgWpm, grade: s.overall_grade ?? null,
          yourScore: m?.yourScore ?? null,
          fluency: m?.fluency ?? null,
          accuracy: m?.accuracy ?? null,
          skill: m?.skill ?? null,
        }
      }).reverse()

      // Per-category stats
      const catMap: Record<string, { total: number; count: number }> = {}
      for (const a of answers ?? []) {
        const cat = questionMap[a.question_id] ?? 'Unknown'
        if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 }
        catMap[cat].total += a.filler_count ?? 0
        catMap[cat].count += 1
      }
      categoryStats = Object.entries(catMap).map(([category, { total, count }]) => ({
        category,
        avgFillers: count > 0 ? total / count : 0,
        sessions: count,
      }))
    }
  }

  // ── Your Score per recent session + focus-area raw data ───────────────
  const recentSessionIds = (recentSessions ?? []).map(s => s.id)
  const { data: recentAnswers } = recentSessionIds.length > 0
    ? await supabase
        .from('answers')
        .select('session_id, ai_feedback, filler_count, wpm, question_id')
        .in('session_id', recentSessionIds)
        .not('transcription_failed', 'is', true)
    : { data: [] as { session_id: string; ai_feedback: unknown; filler_count: number | null; wpm: number | null; question_id: number }[] }

  const sessionScores: Record<string, number | null> = {}
  const recentBySession: Record<string, { ai_feedback: unknown }[]> = {}
  for (const a of recentAnswers ?? []) {
    if (!recentBySession[a.session_id]) recentBySession[a.session_id] = []
    recentBySession[a.session_id].push({ ai_feedback: a.ai_feedback })
  }
  for (const [sid, ans] of Object.entries(recentBySession)) {
    const m = computeSessionMetrics(ans.map(a => ({ ai_feedback: a.ai_feedback as AiFeedback | null })))
    sessionScores[sid] = m?.yourScore ?? null
  }

  // ── Focus areas — category lookup (all tiers) ──────────────────────────
  const focusQuestionIds = [...new Set((recentAnswers ?? []).map(a => a.question_id).filter(Boolean))]
  const { data: focusQuestions } = focusQuestionIds.length > 0
    ? await supabase.from('questions').select('id, category_name').in('id', focusQuestionIds)
    : { data: [] as { id: number; category_name: string }[] }

  const focusCategoryMap: Record<string, string> = Object.fromEntries(
    (focusQuestions ?? []).map(q => [String(q.id), q.category_name])
  )
  const focusResult = detectFocusAreas(
    (recentAnswers ?? []).map(a => ({
      session_id: a.session_id,
      ai_feedback: a.ai_feedback as AiFeedback | null,
      filler_count: a.filler_count,
      wpm: a.wpm,
      question_id: a.question_id,
    })),
    focusCategoryMap,
  )

  const sessionsLimit = TIER_SESSION_LIMITS[profile.tier] ?? 2
  const sessionsLeft = Math.max(0, sessionsLimit - profile.sessions_used_this_month)
  const exhausted = sessionsLeft <= 0
  const pct = Math.min((profile.sessions_used_this_month / sessionsLimit) * 100, 100)

  const isFirstSession = profile.onboarding_complete && profile.sessions_used_this_month === 0
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : null

  return (
    <div className="space-y-5">
      {/* Live sync — invisible, keeps dashboard data fresh via Supabase Realtime */}
      <DashboardRefresher userId={user.id} />

      {/* ── Row 1: Header + CTA ── */}
      <FadeIn delay={0}>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.full_name ? `Hey, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-white/50">
            {TIER_LABELS[profile.tier] ?? profile.tier} plan
          </p>
        </div>
      </FadeIn>

      {/* ── Onboarding pill ── */}
      {!profile.onboarding_complete && (
        <FadeIn delay={0.02}>
          <Link
            href="/onboarding"
            className="group flex items-center justify-between gap-4 rounded-2xl px-6 py-5 transition-all hover:brightness-105"
            style={{
              background: 'linear-gradient(135deg, rgba(249,193,37,0.18) 0%, rgba(249,193,37,0.08) 100%)',
              border: '1px solid rgba(249,193,37,0.40)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(249,193,37,0.20)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#F9C125]">Set up your profile for personalised interviews</p>
                <p className="text-xs text-white/55 mt-0.5">Takes 2 minutes · We tailor your questions to your role and goals</p>
              </div>
            </div>
            <span className="shrink-0 text-[#F9C125] font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </FadeIn>
      )}

      {isFirstSession ? (
        <FadeIn delay={0.04}>
          <FirstSessionPanel firstName={firstName} />
        </FadeIn>
      ) : (
        <>
          <FadeIn delay={0.04}>
            <div className="flex flex-col gap-2">
              {pageError === 'quota_exceeded' && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  You&apos;ve used all your sessions this month. Upgrade your plan to continue.
                </div>
              )}
              {exhausted ? (
                <div
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 min-h-[64px]"
                  style={{ backgroundColor: 'rgba(8,13,26,0.4)', border: '1px solid rgba(249,193,37,0.15)' }}
                >
                  <span className="text-base font-semibold text-white/60">No sessions left this month —</span>
                  <Link href="/#pricing" className="text-base font-bold text-[#F9C125] underline hover:opacity-70 transition-opacity">Upgrade →</Link>
                </div>
              ) : (
                <Link
                  href="/session/setup"
                  className="w-full flex items-center justify-center rounded-2xl bg-[#F9C125] text-lg font-bold text-[#080d1a] hover:brightness-110 transition-all py-4 min-h-[64px]"
                  style={{ boxShadow: '0 0 40px rgba(249,193,37,0.35), 0 8px 32px rgba(249,193,37,0.25)' }}
                >
                  Start Practice Session →
                </Link>
              )}
            </div>
          </FadeIn>

          {/* ── Row 2: Main grid — Recent sessions (left) + Stats (right) ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Recent sessions — takes 2/3 */}
        <FadeIn delay={0.08} className="lg:col-span-2">
          <div className="h-full p-5" style={CARD_STYLE}>
            <h2 className="mb-4 text-base font-semibold text-[#F9C125]">Recent Sessions</h2>
            {recentSessions && recentSessions.length > 0 ? (
              <RecentSessionsList sessions={recentSessions as import('@/types/database').Session[]} scores={sessionScores} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-white/80 text-base font-medium">No completed sessions yet.</p>
                <p className="text-white/45 text-sm mt-1">Start a session to see your results here.</p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Right sidebar — Sessions stat + Your info stacked */}
        <FadeIn delay={0.12} className="flex flex-col gap-5">

          {/* Sessions this month */}
          <div className="p-5" style={CARD_STYLE}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Sessions this month</p>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-4xl font-bold text-white">{profile.sessions_used_this_month}</span>
              <span className="text-sm text-white/40">/ {sessionsLimit}</span>
            </div>
            <div className="h-1.5 w-full rounded-full mb-2" style={{ backgroundColor: 'rgba(249,193,37,0.12)' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#F9C125' }} />
            </div>
            <p className="text-xs text-white/45">
              {exhausted ? 'No sessions left this month' : `${sessionsLeft} remaining`}
            </p>
          </div>

          {/* Your info */}
          <ProfileEditCard
            initialRoleType={profile.role_type}
            initialInterviewDate={profile.interview_date}
          />

          {/* Best score this month */}
          <div className="p-5" style={CARD_STYLE}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Best Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#F9C125]">
                {Object.values(sessionScores).filter((s): s is number => s !== null).length > 0
                  ? Math.max(...Object.values(sessionScores).filter((s): s is number => s !== null))
                  : '—'}
              </span>
              <span className="text-sm text-white/40">/ 100</span>
            </div>
            <p className="text-xs text-white/45 mt-2">Across recent sessions</p>
          </div>

          {/* Quick tip */}
          <div className="p-5" style={CARD_STYLE}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Quick Tip</p>
            <p className="text-sm text-white/85 leading-relaxed">
              {QUICK_TIPS[user.id.charCodeAt(0) % QUICK_TIPS.length]}
            </p>
          </div>
        </FadeIn>
      </div>

      {/* ── Row 3: Focus Areas ─────────────────────────────────────── */}
      <FadeIn delay={0.14}>
        <FocusAreasCard
          result={focusResult}
          sessionCount={(recentSessions ?? []).length}
        />
      </FadeIn>

      {/* ── Row 4: Full-width Progress section ── */}
      <FadeIn delay={0.16}>
        <div id="progress" className="p-6" style={CARD_STYLE}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#F9C125]">Your Progress</h2>
              <p className="text-xs text-white/55 mt-0.5">Filler words, pace, and scores across sessions</p>
            </div>
          </div>

          {!isStudent ? (
            /* Blurred teaser for Free users */
            <div className="relative rounded-xl overflow-hidden" style={{ transform: 'translateZ(0)' }}>
              <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none', overflow: 'hidden' }} className="space-y-4 p-1">
                <div className="grid grid-cols-3 gap-3">
                  {['Avg Fillers', 'Avg WPM', 'Best Score'].map((label, i) => (
                    <div key={label} className="rounded-xl px-4 py-3" style={INNER_CARD}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">{label}</p>
                      <p className="text-2xl font-bold text-white">{['3', '142', '78'][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5" style={INNER_CARD}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Filler words per session</p>
                    <div className="flex items-end gap-2 h-24">
                      {[8, 5, 12, 3, 7, 4, 9, 2].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${(h / 12) * 100}%`, background: 'rgba(249,193,37,0.5)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-5" style={INNER_CARD}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Speech pace per session</p>
                    <div className="flex items-end gap-2 h-24">
                      {[60, 75, 55, 80, 70, 85, 65, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: 'rgba(249,193,37,0.3)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(8,13,26,0.55)' }}>
                <div className="text-center px-6">
                  <div className="flex justify-center mb-3">
                    <div className="rounded-full p-3" style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.35)' }}>
                      <Lock className="h-6 w-6 text-[#F9C125]" />
                    </div>
                  </div>
                  <p className="font-bold text-white mb-1">Unlock Progress Charts</p>
                  <p className="text-sm text-white/70 mb-4">Track filler words, pace, and category performance over time</p>
                  <Link href="/#pricing" className="inline-block rounded-xl bg-[#F9C125] px-5 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all">
                    Upgrade to Student →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <ChartsClient sessionStats={sessionStats} categoryStats={categoryStats} />
          )}
        </div>
      </FadeIn>
        </>
      )}

    </div>
  )
}
