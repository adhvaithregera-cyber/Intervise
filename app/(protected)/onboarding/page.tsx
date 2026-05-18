'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Step = 1 | 2 | 3

const ROLE_OPTIONS = [
  'Software Engineering', 'Product Management', 'Data Science / Analytics',
  'Business / Consulting', 'Finance / Banking', 'Marketing', 'Design (UX/UI)', 'Other',
]

const WEAKNESS_OPTIONS = [
  'Taking too long to answer', 'Using too many filler words',
  'Speaking too fast or too slow', 'Rambling without structure',
  'Freezing under pressure', 'Being too vague or generic',
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [roleType, setRoleType] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [justPracticing, setJustPracticing] = useState(false)
  const [biggestWeakness, setBiggestWeakness] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!biggestWeakness) return
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_type: roleType,
        interview_date: justPracticing ? null : (interviewDate || null),
        biggest_weakness: biggestWeakness,
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
        ? 'border-[#170C79] bg-[#170C79]/5 text-[#170C79] shadow-sm'
        : 'border-[#8ACBD0] bg-white text-[#170C79] hover:border-[#56B6C6] hover:bg-[#EFE3CA]'
    }`

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-10">
          <div className="mb-2 flex justify-between text-xs text-[#8ACBD0]">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#8ACBD0]/40">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%`, backgroundColor: '#170C79' }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#8ACBD0] bg-white p-8 shadow-sm sm:p-10">
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#170C79]">What role are you targeting?</h2>
              <p className="mb-8 text-sm text-[#8ACBD0]">We&apos;ll tailor your question bank to your field.</p>
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

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#170C79]">When is your interview?</h2>
              <p className="mb-8 text-sm text-[#8ACBD0]">Helps us track how much time you have to prepare.</p>

              {/* Just practicing toggle */}
              <button
                onClick={() => {
                  setJustPracticing(!justPracticing)
                  setInterviewDate('')
                }}
                className={optionClass(justPracticing)}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      justPracticing ? 'border-[#170C79] bg-[#170C79]' : 'border-[#8ACBD0]'
                    }`}
                  >
                    {justPracticing && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  I&apos;m just practising — no upcoming interview
                </span>
              </button>

              {!justPracticing && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8ACBD0]">Or pick a date</p>
                  <input
                    type="date"
                    value={interviewDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-[#8ACBD0] bg-white px-4 py-3 text-sm text-[#170C79] focus:border-[#170C79] focus:outline-none focus:ring-2 focus:ring-[#170C79]/10"
                  />
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button fullWidth onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-2xl font-bold text-[#170C79]">Your biggest interview weakness?</h2>
              <p className="mb-8 text-sm text-[#8ACBD0]">Honest answers help us focus your drills where it matters most.</p>
              <div className="space-y-3">
                {WEAKNESS_OPTIONS.map((w) => (
                  <button key={w} onClick={() => setBiggestWeakness(w)} className={optionClass(biggestWeakness === w)}>
                    {w}
                  </button>
                ))}
              </div>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button fullWidth disabled={!biggestWeakness || submitting} onClick={handleSubmit}>
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
