'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
      body: JSON.stringify({
        role_type: roleType,
        interview_date: interviewDate || null,
        biggest_weakness: biggestWeakness,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-gray-400">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">What role are you targeting?</h2>
              <p className="mb-6 text-sm text-gray-500">
                We&apos;ll tailor your question bank to your field.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleType(role)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      roleType === role
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <Button
                className="mt-8"
                fullWidth
                disabled={!roleType}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">When is your interview?</h2>
              <p className="mb-6 text-sm text-gray-500">
                Optional — helps us track how much time you have.
              </p>
              <input
                type="date"
                value={interviewDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button fullWidth onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">
                What&apos;s your biggest interview weakness?
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Honest answers help us focus your drills where it matters most.
              </p>
              <div className="space-y-2">
                {WEAKNESS_OPTIONS.map((weakness) => (
                  <button
                    key={weakness}
                    onClick={() => setBiggestWeakness(weakness)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      biggestWeakness === weakness
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {weakness}
                  </button>
                ))}
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
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
