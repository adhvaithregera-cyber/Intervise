'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const TOTAL_STEPS = 7

const ROLE_OPTIONS = [
  'Software Engineering', 'Product Management', 'Data Science / Analytics',
  'Business / Consulting', 'Finance / Banking', 'Marketing', 'Design (UX/UI)', 'Other',
]

const WEAKNESS_OPTIONS = [
  'Taking too long to answer', 'Using too many filler words',
  'Speaking too fast or too slow', 'Rambling without structure',
  'Freezing under pressure', 'Being too vague or generic',
]

const EXPERIENCE_OPTIONS = [
  'Fresher (0–1 year)', 'Early career (1–3 years)', 'Mid-level (3–7 years)', 'Senior (7+ years)',
]

const INTERVIEW_TYPE_OPTIONS = [
  'Behavioural only', 'Technical only', 'Both behavioural & technical',
]

const FREQUENCY_OPTIONS = [
  'Every day', 'A few times a week', 'Once a week', 'Just exploring',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)

  // Step 1
  const [roleType, setRoleType] = useState('')
  // Step 2
  const [interviewDate, setInterviewDate] = useState('')
  const [justPracticing, setJustPracticing] = useState(false)
  // Step 3
  const [biggestWeakness, setBiggestWeakness] = useState('')
  // Step 4
  const [experienceLevel, setExperienceLevel] = useState('')
  // Step 5
  const [interviewType, setInterviewType] = useState('')
  // Step 6
  const [practiceFrequency, setPracticeFrequency] = useState('')
  // Step 7
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState(22)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  async function handleSubmit() {
    if (!fullName.trim()) return
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        age,
        role_type: roleType,
        interview_date: justPracticing ? null : (interviewDate || null),
        biggest_weakness: biggestWeakness,
        experience_level: experienceLevel,
        interview_type: interviewType,
        practice_frequency: practiceFrequency,
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
    `w-full rounded-2xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
      active
        ? 'border-[#E07A2F] bg-[#E07A2F]/5 text-[#E07A2F] shadow-sm'
        : 'border-[#A0622A] bg-white text-[#E07A2F] hover:border-[#F9C125] hover:bg-[#FEFDF0]'
    }`

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEFDF0] px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-[#A0622A]">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#A0622A]/30">
            <div
              className="h-1.5 rounded-full bg-[#E07A2F] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#A0622A] bg-white p-8 shadow-sm sm:p-10">

          {/* Step 1: Role */}
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">What role are you targeting?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">We&apos;ll tailor your question bank to your field.</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button key={role} onClick={() => setRoleType(role)} className={optionClass(roleType === role)}>
                    {role}
                  </button>
                ))}
              </div>
              <Button className="mt-8" fullWidth disabled={!roleType} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Interview date */}
          {step === 2 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">When is your interview?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">Helps us track how much time you have to prepare.</p>
              <button onClick={() => { setJustPracticing(!justPracticing); setInterviewDate('') }} className={optionClass(justPracticing)}>
                <span className="flex items-center gap-3">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${justPracticing ? 'border-[#E07A2F] bg-[#E07A2F]' : 'border-[#A0622A]'}`}>
                    {justPracticing && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  I&apos;m just practising — no upcoming interview
                </span>
              </button>
              {!justPracticing && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#A0622A]">Or pick a date</p>
                  <input
                    type="date"
                    value={interviewDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-[#A0622A] bg-white px-4 py-3 text-sm text-[#E07A2F] focus:border-[#E07A2F] focus:outline-none focus:ring-2 focus:ring-[#E07A2F]/10"
                  />
                </div>
              )}
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button fullWidth onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3: Biggest weakness */}
          {step === 3 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">Your biggest interview weakness?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">Honest answers help us focus your drills where it matters most.</p>
              <div className="space-y-3">
                {WEAKNESS_OPTIONS.map((w) => (
                  <button key={w} onClick={() => setBiggestWeakness(w)} className={optionClass(biggestWeakness === w)}>
                    {w}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button fullWidth disabled={!biggestWeakness} onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 4: Experience level */}
          {step === 4 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">How much experience do you have?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">We&apos;ll calibrate question difficulty to your level.</p>
              <div className="space-y-3">
                {EXPERIENCE_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setExperienceLevel(e)} className={optionClass(experienceLevel === e)}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                <Button fullWidth disabled={!experienceLevel} onClick={() => setStep(5)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 5: Interview type */}
          {step === 5 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">What type of interviews are you preparing for?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">This shapes which question formats we prioritise.</p>
              <div className="space-y-3">
                {INTERVIEW_TYPE_OPTIONS.map((t) => (
                  <button key={t} onClick={() => setInterviewType(t)} className={optionClass(interviewType === t)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
                <Button fullWidth disabled={!interviewType} onClick={() => setStep(6)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 6: Practice frequency */}
          {step === 6 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">How often do you plan to practise?</h2>
              <p className="mb-8 text-sm text-[#A0622A]">No pressure — just helps us set expectations.</p>
              <div className="space-y-3">
                {FREQUENCY_OPTIONS.map((f) => (
                  <button key={f} onClick={() => setPracticeFrequency(f)} className={optionClass(practiceFrequency === f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(5)}>Back</Button>
                <Button fullWidth disabled={!practiceFrequency} onClick={() => setStep(7)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 7: Full name + Age */}
          {step === 7 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#E07A2F]">Almost done — tell us about you</h2>
              <p className="mb-8 text-sm text-[#A0622A]">Your name and age help personalise your experience.</p>

              <div className="space-y-6">
                {/* Full name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E07A2F]">Full name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border-2 border-[#A0622A] bg-white px-4 py-3 text-sm text-[#E07A2F] placeholder-[#A0622A] focus:border-[#E07A2F] focus:outline-none focus:ring-2 focus:ring-[#E07A2F]/10"
                  />
                </div>

                {/* Age slider */}
                <div>
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-[#E07A2F]">
                    <span>Age</span>
                    <span className="text-2xl font-bold text-[#E07A2F]">{age}</span>
                  </label>
                  <input
                    type="range"
                    min={16}
                    max={60}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-[#E07A2F]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-[#A0622A]">
                    <span>16</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(6)}>Back</Button>
                <Button fullWidth disabled={!fullName.trim() || submitting} onClick={handleSubmit}>
                  {submitting ? 'Saving…' : 'Go to dashboard'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
