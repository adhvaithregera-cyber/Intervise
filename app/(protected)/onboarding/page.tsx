'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowLeft, ArrowRight } from 'lucide-react'

const TOTAL_STEPS = 8

const ROLE_OPTIONS = [
  'Software Engineering', 'Product Management', 'Data Science / ML',
  'Design (UX/UI)', 'Business / Strategy', 'Finance / Consulting',
  'Marketing', 'Sales', 'Operations', 'Other',
]
const WEAKNESS_OPTIONS = [
  'Taking too long to answer', 'Using too many filler words',
  'Speaking too fast or too slow', 'Rambling without structure',
  'Freezing under pressure', 'Being too vague or generic',
  'Lack of confidence', 'Not enough examples', 'Other',
]
const EXPERIENCE_OPTIONS = [
  'Fresher (0–1 year)', 'Early career (1–3 years)',
  'Mid-level (3–7 years)', 'Senior (7+ years)', 'Other',
]
const INTERVIEW_TYPE_OPTIONS = [
  'Behavioural only', 'Technical only', 'Both behavioural & technical', 'Other',
]
const FREQUENCY_OPTIONS = [
  'Every day', 'A few times a week', 'Once a week', 'Just exploring', 'Other',
]
const JOB_CHALLENGE_OPTIONS = [
  'Not getting enough interview calls',
  'Struggling to answer questions confidently',
  'Freezing or going blank under pressure',
  'Answers lack structure or clarity',
  'Switching industries or roles',
  'Competing against more experienced candidates',
  'Other',
]

const STEP_META = [
  { category: 'ABOUT YOU',       heading: "Let's start with you.",         sub: 'Your name and age help us personalise your experience.' },
  { category: 'YOUR GOALS',      heading: 'What roles are you targeting?',  sub: 'Pick all that apply — we\'ll tailor your question bank.' },
  { category: 'YOUR TIMELINE',   heading: 'When is your interview?',        sub: 'Helps us track how much prep time you have.' },
  { category: 'SELF-ASSESSMENT', heading: 'Where do you struggle most?',    sub: 'Pick all that apply — we\'ll focus your drills here.' },
  { category: 'EXPERIENCE',      heading: 'How much experience do you have?', sub: 'We\'ll calibrate question difficulty to your level.' },
  { category: 'PREP STYLE',      heading: 'What type of interviews?',       sub: 'Shapes which question formats we prioritise.' },
  { category: 'COMMITMENT',      heading: 'How often will you practise?',   sub: 'No pressure — helps us set the right pace for you.' },
  { category: 'YOUR CHALLENGE',  heading: 'What\'s your biggest challenge?', sub: 'Your honest answer helps us build better features.' },
]

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const go = (to: number) => { setDir(to > step ? 1 : -1); setStep(to) }

  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(22)
  const [roleTypes, setRoleTypes] = useState<string[]>([])
  const [roleTypeOther, setRoleTypeOther] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [justPracticing, setJustPracticing] = useState(false)
  const [weaknesses, setWeaknesses] = useState<string[]>([])
  const [weaknessOther, setWeaknessOther] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [experienceLevelOther, setExperienceLevelOther] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [interviewTypeOther, setInterviewTypeOther] = useState('')
  const [practiceFrequency, setPracticeFrequency] = useState('')
  const [practiceFrequencyOther, setPracticeFrequencyOther] = useState('')
  const [jobChallenge, setJobChallenge] = useState('')
  const [jobChallengeOther, setJobChallengeOther] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const resolvedRoles = roleTypes.map(r => r === 'Other' ? roleTypeOther.trim() : r).filter(Boolean).join(', ')
  const resolvedWeaknesses = weaknesses.map(w => w === 'Other' ? weaknessOther.trim() : w).filter(Boolean).join(', ')
  const resolvedExperience = experienceLevel === 'Other' ? experienceLevelOther.trim() : experienceLevel
  const resolvedInterviewType = interviewType === 'Other' ? interviewTypeOther.trim() : interviewType
  const resolvedFrequency = practiceFrequency === 'Other' ? practiceFrequencyOther.trim() : practiceFrequency
  const resolvedJobChallenge = jobChallenge === 'Other' ? jobChallengeOther.trim() : jobChallenge

  async function handleSubmit() {
    if (!resolvedJobChallenge) return
    setError(null); setSubmitting(true)
    const isoDate = interviewDate ? new Date(interviewDate + 'T00:00:00').toISOString() : null
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(), age,
        role_type: resolvedRoles,
        interview_date: justPracticing ? null : isoDate,
        biggest_weakness: resolvedWeaknesses,
        experience_level: resolvedExperience,
        interview_type: resolvedInterviewType,
        practice_frequency: resolvedFrequency,
        job_challenge: resolvedJobChallenge,
      }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Something went wrong.'); setSubmitting(false); return }
    window.location.href = '/dashboard'
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
      active
        ? 'border-[#F9C125] bg-[#F9C125]/10 text-[#F9C125]'
        : 'border-white/[0.14] bg-transparent text-white/60 hover:border-white/30 hover:text-white/85'
    }`

  const inputCls = 'w-full max-w-full rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#F9C125]/50 transition-colors'
  const inputStyle: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
  }

  const meta = STEP_META[step - 1]
  const progressPct = (step / TOTAL_STEPS) * 100

  // Per-step continue disabled logic
  const continueDisabled: Record<number, boolean> = {
    1: !fullName.trim(),
    2: !resolvedRoles,
    3: false,
    4: !resolvedWeaknesses,
    5: !resolvedExperience,
    6: !resolvedInterviewType,
    7: !resolvedFrequency,
    8: !resolvedJobChallenge || submitting,
  }

  function handleContinue() {
    if (step < TOTAL_STEPS) go(step + 1)
    else handleSubmit()
  }

  return (
    // overflow-x-hidden prevents any child (e.g. date input) from causing horizontal scroll
    <div
      className="fixed inset-x-0 flex flex-col overflow-x-hidden p-3"
      style={{ top: '4rem', height: 'calc(100dvh - 4rem)', backgroundColor: '#080d1a', zIndex: 20 }}
    >

      {/* ── Main content (bordered box) ── */}
      <div
        className="flex flex-1 flex-col overflow-hidden rounded-2xl min-h-0"
        style={{ border: '1px solid rgba(249,193,37,0.22)', backgroundColor: 'rgba(255,255,255,0.015)' }}
      >

        {/* ── Thin gold progress bar ── */}
        <div className="h-[2px] w-full shrink-0 rounded-t-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: '#F9C125' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Top nav row */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
          {step > 1 ? (
            <button
              onClick={() => go(step - 1)}
              className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70 cursor-pointer"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <div />
          )}
          <span className="text-xs font-semibold tracking-widest text-white/25">
            STEP {String(step).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
          </span>
        </div>

        {/*
          AnimatePresence renders no DOM node — motion.div is effectively a direct
          flex child of the bordered box. flex-1 min-h-0 makes it fill remaining
          height. No justify-center: instead heading + button are shrink-0 and the
          content area between them is flex-1 overflow-y-auto (scrollable middle).
        */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex-1 flex flex-col items-center min-h-0 px-4 sm:px-10 lg:px-24"
          >

            {/* ── Heading — always visible, never scrolls away ── */}
            <div className="shrink-0 mt-4 mb-4 text-center sm:mt-8 sm:mb-7">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#F9C125]/70">
                {meta.category}
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {meta.heading}
              </h1>
              <p className="mt-2 text-sm text-white/45 sm:text-base sm:mt-3">{meta.sub}</p>
            </div>

            {/* ── Scrollable content area — grows to fill space between heading and button ── */}
            <div className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col items-center pb-2">

              {/* Step 1 */}
              {step === 1 && (
                <div className="w-full max-w-2xl space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/35">Full name</label>
                    <input type="text" placeholder="e.g. Priya Sharma" value={fullName}
                      onChange={e => setFullName(e.target.value)} className={inputCls} style={inputStyle} autoFocus />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Age</label>
                      <span className="text-2xl font-bold text-[#F9C125]">{age}</span>
                    </div>
                    <input type="range" min={16} max={60} value={age}
                      onChange={e => setAge(Number(e.target.value))} className="w-full accent-[#F9C125]" />
                    <div className="mt-1 flex justify-between text-xs text-white/25"><span>16</span><span>60</span></div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r} onClick={() => setRoleTypes(prev => toggle(prev, r))} className={chip(roleTypes.includes(r))}>
                        {roleTypes.includes(r) && <Check size={12} strokeWidth={3} />}{r}
                      </button>
                    ))}
                  </div>
                  {roleTypes.includes('Other') && (
                    <input type="text" placeholder="Your role..." value={roleTypeOther}
                      onChange={e => setRoleTypeOther(e.target.value)} className={'mt-4 w-full max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                  {roleTypes.length > 0 && (
                    <p className="mt-3 text-center text-sm text-white/30">{roleTypes.length} selected</p>
                  )}
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="w-full max-w-lg space-y-4 overflow-x-hidden">
                  <button
                    onClick={() => { setJustPracticing(!justPracticing); setInterviewDate('') }}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
                      justPracticing
                        ? 'border-[#F9C125] bg-[#F9C125]/10 text-[#F9C125]'
                        : 'border-white/[0.14] bg-transparent text-white/60 hover:border-white/30 hover:text-white/85'
                    }`}
                  >
                    {justPracticing && <Check size={12} strokeWidth={3} />}
                    I&apos;m just practising — no upcoming interview
                  </button>
                  {!justPracticing && (
                    <div className="overflow-x-hidden">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-white/35">Interview date</label>
                      <input type="date" value={interviewDate} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setInterviewDate(e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {WEAKNESS_OPTIONS.map(w => (
                      <button key={w} onClick={() => setWeaknesses(prev => toggle(prev, w))} className={chip(weaknesses.includes(w))}>
                        {weaknesses.includes(w) && <Check size={12} strokeWidth={3} />}{w}
                      </button>
                    ))}
                  </div>
                  {weaknesses.includes('Other') && (
                    <input type="text" placeholder="Describe your weakness..." value={weaknessOther}
                      onChange={e => setWeaknessOther(e.target.value)} className={'mt-4 max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                  {weaknesses.length > 0 && (
                    <p className="mt-3 text-center text-sm text-white/30">{weaknesses.length} selected</p>
                  )}
                </div>
              )}

              {/* Step 5 */}
              {step === 5 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXPERIENCE_OPTIONS.map(e => (
                      <button key={e} onClick={() => setExperienceLevel(e)} className={chip(experienceLevel === e)}>
                        {experienceLevel === e && <Check size={12} strokeWidth={3} />}{e}
                      </button>
                    ))}
                  </div>
                  {experienceLevel === 'Other' && (
                    <input type="text" placeholder="Describe your experience..." value={experienceLevelOther}
                      onChange={e => setExperienceLevelOther(e.target.value)} className={'mt-4 max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                </div>
              )}

              {/* Step 6 */}
              {step === 6 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {INTERVIEW_TYPE_OPTIONS.map(t => (
                      <button key={t} onClick={() => setInterviewType(t)} className={chip(interviewType === t)}>
                        {interviewType === t && <Check size={12} strokeWidth={3} />}{t}
                      </button>
                    ))}
                  </div>
                  {interviewType === 'Other' && (
                    <input type="text" placeholder="Describe the interview type..." value={interviewTypeOther}
                      onChange={e => setInterviewTypeOther(e.target.value)} className={'mt-4 max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                </div>
              )}

              {/* Step 7 */}
              {step === 7 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {FREQUENCY_OPTIONS.map(f => (
                      <button key={f} onClick={() => setPracticeFrequency(f)} className={chip(practiceFrequency === f)}>
                        {practiceFrequency === f && <Check size={12} strokeWidth={3} />}{f}
                      </button>
                    ))}
                  </div>
                  {practiceFrequency === 'Other' && (
                    <input type="text" placeholder="How often?" value={practiceFrequencyOther}
                      onChange={e => setPracticeFrequencyOther(e.target.value)} className={'mt-4 max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                </div>
              )}

              {/* Step 8 */}
              {step === 8 && (
                <div className="w-full max-w-3xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {JOB_CHALLENGE_OPTIONS.map(c => (
                      <button key={c} onClick={() => setJobChallenge(c)} className={chip(jobChallenge === c)}>
                        {jobChallenge === c && <Check size={12} strokeWidth={3} />}{c}
                      </button>
                    ))}
                  </div>
                  {jobChallenge === 'Other' && (
                    <input type="text" placeholder="Tell us in your own words..." value={jobChallengeOther}
                      onChange={e => setJobChallengeOther(e.target.value)} className={'mt-4 max-w-sm ' + inputCls}
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,193,37,0.30)' }} autoFocus />
                  )}
                  {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
                </div>
              )}

            </div>

            {/* ── Continue button — shrink-0 so it's always pinned at bottom ── */}
            <div className="shrink-0 flex justify-center py-3 sm:py-5">
              <button
                disabled={continueDisabled[step]}
                onClick={handleContinue}
                className="inline-flex items-center gap-2 rounded-full px-9 py-[15px] text-sm font-bold text-[#080d1a] transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: '#F9C125' }}
              >
                {step === TOTAL_STEPS ? (submitting ? 'Saving…' : 'Go to dashboard') : 'Continue'}
                {step < TOTAL_STEPS && <ArrowRight size={15} strokeWidth={2.5} />}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}
