'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const TOTAL_STEPS = 7

const ROLE_OPTIONS = [
  'Software Engineering', 'Product Management', 'Data Science / ML',
  'Business / Strategy', 'Finance / Consulting', 'Marketing', 'Design (UX/UI)', 'Other',
]

const WEAKNESS_OPTIONS = [
  'Taking too long to answer', 'Using too many filler words',
  'Speaking too fast or too slow', 'Rambling without structure',
  'Freezing under pressure', 'Being too vague or generic', 'Other',
]

const EXPERIENCE_OPTIONS = [
  'Fresher (0–1 year)', 'Early career (1–3 years)', 'Mid-level (3–7 years)', 'Senior (7+ years)', 'Other',
]

const INTERVIEW_TYPE_OPTIONS = [
  'Behavioural only', 'Technical only', 'Both behavioural & technical', 'Other',
]

const FREQUENCY_OPTIONS = [
  'Every day', 'A few times a week', 'Once a week', 'Just exploring', 'Other',
]

const CARD_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)

  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(22)
  const [roleType, setRoleType] = useState('')
  const [roleTypeOther, setRoleTypeOther] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [justPracticing, setJustPracticing] = useState(false)
  const [biggestWeakness, setBiggestWeakness] = useState('')
  const [biggestWeaknessOther, setBiggestWeaknessOther] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [experienceLevelOther, setExperienceLevelOther] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [interviewTypeOther, setInterviewTypeOther] = useState('')
  const [practiceFrequency, setPracticeFrequency] = useState('')
  const [practiceFrequencyOther, setPracticeFrequencyOther] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  const resolvedRole = roleType === 'Other' ? roleTypeOther.trim() : roleType
  const resolvedWeakness = biggestWeakness === 'Other' ? biggestWeaknessOther.trim() : biggestWeakness
  const resolvedExperience = experienceLevel === 'Other' ? experienceLevelOther.trim() : experienceLevel
  const resolvedInterviewType = interviewType === 'Other' ? interviewTypeOther.trim() : interviewType
  const resolvedFrequency = practiceFrequency === 'Other' ? practiceFrequencyOther.trim() : practiceFrequency

  async function handleSubmit() {
    if (!resolvedFrequency) return
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        age,
        role_type: resolvedRole,
        interview_date: justPracticing ? null : (interviewDate || null),
        biggest_weakness: resolvedWeakness,
        experience_level: resolvedExperience,
        interview_type: resolvedInterviewType,
        practice_frequency: resolvedFrequency,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const optionClass = (active: boolean) =>
    `w-full rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition-all ${
      active
        ? 'border-[#F9C125] bg-[#F9C125]/10 text-[#F9C125]'
        : 'border-white/20 bg-white/5 text-white/80 hover:border-[#F9C125]/50 hover:bg-white/10'
    }`

  const inputClass = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#F9C125] focus:outline-none focus:ring-2 focus:ring-[#F9C125]/20"

  const otherInputClass = "mt-3 w-full rounded-xl border border-[#F9C125]/50 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#F9C125] focus:outline-none focus:ring-2 focus:ring-[#F9C125]/20"

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-white/50">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-[#F9C125] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div style={CARD_STYLE} className="p-8 sm:p-10">

          {/* Step 1: Full name + Age */}
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">Let&apos;s start with you</h2>
              <p className="mb-8 text-sm text-white/55">Your name and age help us personalise your experience.</p>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Full name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-white/80">
                    <span>Age</span>
                    <span className="text-2xl font-bold text-[#F9C125]">{age}</span>
                  </label>
                  <input
                    type="range" min={16} max={60} value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-[#F9C125]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-white/40">
                    <span>16</span><span>60</span>
                  </div>
                </div>
              </div>
              <button
                className="mt-8 w-full rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                disabled={!fullName.trim()}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">What role are you targeting?</h2>
              <p className="mb-8 text-sm text-white/55">We&apos;ll tailor your question bank to your field.</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button key={role} onClick={() => setRoleType(role)} className={optionClass(roleType === role)}>
                    {role}
                  </button>
                ))}
              </div>
              {roleType === 'Other' && (
                <input type="text" placeholder="Please specify your role..." value={roleTypeOther}
                  onChange={(e) => setRoleTypeOther(e.target.value)} className={otherInputClass} autoFocus />
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={!resolvedRole} onClick={() => setStep(3)} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Interview date */}
          {step === 3 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">When is your interview?</h2>
              <p className="mb-8 text-sm text-white/55">Helps us track how much time you have to prepare.</p>
              <button onClick={() => { setJustPracticing(!justPracticing); setInterviewDate('') }} className={optionClass(justPracticing)}>
                <span className="flex items-center gap-3">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${justPracticing ? 'border-[#F9C125] bg-[#F9C125]' : 'border-white/40'}`}>
                    {justPracticing && <span className="h-2 w-2 rounded-full bg-[#080d1a]" />}
                  </span>
                  I&apos;m just practising — no upcoming interview
                </span>
              </button>
              {!justPracticing && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Or pick a date</p>
                  <input type="date" value={interviewDate} min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setInterviewDate(e.target.value)} className={inputClass} />
                </div>
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(2)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button onClick={() => setStep(4)} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Biggest weakness */}
          {step === 4 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">Your biggest interview weakness?</h2>
              <p className="mb-8 text-sm text-white/55">Honest answers help us focus your drills where it matters most.</p>
              <div className="space-y-3">
                {WEAKNESS_OPTIONS.map((w) => (
                  <button key={w} onClick={() => setBiggestWeakness(w)} className={optionClass(biggestWeakness === w)}>{w}</button>
                ))}
              </div>
              {biggestWeakness === 'Other' && (
                <input type="text" placeholder="Describe your biggest weakness..." value={biggestWeaknessOther}
                  onChange={(e) => setBiggestWeaknessOther(e.target.value)} className={otherInputClass} autoFocus />
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(3)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={!resolvedWeakness} onClick={() => setStep(5)} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 5: Experience level */}
          {step === 5 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">How much experience do you have?</h2>
              <p className="mb-8 text-sm text-white/55">We&apos;ll calibrate question difficulty to your level.</p>
              <div className="space-y-3">
                {EXPERIENCE_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setExperienceLevel(e)} className={optionClass(experienceLevel === e)}>{e}</button>
                ))}
              </div>
              {experienceLevel === 'Other' && (
                <input type="text" placeholder="Describe your experience level..." value={experienceLevelOther}
                  onChange={(e) => setExperienceLevelOther(e.target.value)} className={otherInputClass} autoFocus />
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(4)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={!resolvedExperience} onClick={() => setStep(6)} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 6: Interview type */}
          {step === 6 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">What type of interviews are you preparing for?</h2>
              <p className="mb-8 text-sm text-white/55">This shapes which question formats we prioritise.</p>
              <div className="space-y-3">
                {INTERVIEW_TYPE_OPTIONS.map((t) => (
                  <button key={t} onClick={() => setInterviewType(t)} className={optionClass(interviewType === t)}>{t}</button>
                ))}
              </div>
              {interviewType === 'Other' && (
                <input type="text" placeholder="Describe the type of interviews..." value={interviewTypeOther}
                  onChange={(e) => setInterviewTypeOther(e.target.value)} className={otherInputClass} autoFocus />
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(5)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={!resolvedInterviewType} onClick={() => setStep(7)} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 7: Practice frequency */}
          {step === 7 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-white">How often do you plan to practise?</h2>
              <p className="mb-8 text-sm text-white/55">No pressure — just helps us set expectations.</p>
              <div className="space-y-3">
                {FREQUENCY_OPTIONS.map((f) => (
                  <button key={f} onClick={() => setPracticeFrequency(f)} className={optionClass(practiceFrequency === f)}>{f}</button>
                ))}
              </div>
              {practiceFrequency === 'Other' && (
                <input type="text" placeholder="Describe how often you plan to practise..." value={practiceFrequencyOther}
                  onChange={(e) => setPracticeFrequencyOther(e.target.value)} className={otherInputClass} autoFocus />
              )}
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(6)} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={!resolvedFrequency || submitting} onClick={handleSubmit} className="flex-1 rounded-xl bg-[#F9C125] py-3 text-sm font-bold text-[#080d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">
                  {submitting ? 'Saving…' : 'Go to dashboard'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
