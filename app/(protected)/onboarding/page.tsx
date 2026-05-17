'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Step = 1 | 2 | 3

const ROLE_OPTIONS = [
  'Software Engineering',
  'Product Management',
  'Data Science / Analytics',
  'Business / Consulting',
  'Finance / Banking',
  'Marketing',
  'Design (UX/UI)',
  'Other',
]

const WEAKNESS_OPTIONS = [
  'Taking too long to answer',
  'Using too many filler words',
  'Speaking too fast or too slow',
  'Rambling without structure',
  'Freezing under pressure',
  'Being too vague or generic',
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [roleType, setRoleType] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
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
      body: JSON.stringify({ role_type: roleType, interview_date: interviewDate || null, biggest_weakness: biggestWeakness }),
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
    `w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
      active
        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm shadow-brand-100'
        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50'
    }`

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all duration-300 shadow-sm shadow-brand-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">What role are you targeting?</h2>
              <p className="mb-6 text-sm text-slate-500">We&apos;ll tailor your question bank to your field.</p>
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
              <h2 className="mb-1 text-xl font-bold text-slate-900">When is your interview?</h2>
              <p className="mb-6 text-sm text-slate-500">Optional — helps us track how much time you have.</p>
              <input
                type="date"
                value={interviewDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button fullWidth onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">Your biggest interview weakness?</h2>
              <p className="mb-6 text-sm text-slate-500">Honest answers help us focus your drills where it matters most.</p>
              <div className="space-y-2">
                {WEAKNESS_OPTIONS.map((weakness) => (
                  <button key={weakness} onClick={() => setBiggestWeakness(weakness)} className={optionClass(biggestWeakness === weakness)}>
                    {weakness}
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
