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
        ? 'border-[#7091E6] bg-[#7091E6]/10 text-[#3D52A0] shadow-sm'
        : 'border-[#ADBBDA] bg-white text-[#3D52A0] hover:border-[#7091E6] hover:bg-[#EDE8F5]'
    }`

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EDE8F5 0%, #ADBBDA 100%)' }}
    >
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-[#8697C4]">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#ADBBDA]">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%`, backgroundColor: '#3D52A0' }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-[#3D52A0]/10">
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-[#3D52A0]">What role are you targeting?</h2>
              <p className="mb-6 text-sm text-[#8697C4]">We&apos;ll tailor your question bank to your field.</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button key={role} onClick={() => setRoleType(role)} className={optionClass(roleType === role)}>{role}</button>
                ))}
              </div>
              <Button className="mt-8" fullWidth disabled={!roleType} onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-[#3D52A0]">When is your interview?</h2>
              <p className="mb-6 text-sm text-[#8697C4]">Optional — helps us track how much time you have.</p>
              <input
                type="date"
                value={interviewDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full rounded-xl border border-[#ADBBDA] bg-[#EDE8F5]/50 px-3 py-2.5 text-sm text-[#3D52A0] focus:border-[#7091E6] focus:outline-none focus:ring-2 focus:ring-[#7091E6]/20"
              />
              <div className="mt-8 flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button fullWidth onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-[#3D52A0]">Your biggest interview weakness?</h2>
              <p className="mb-6 text-sm text-[#8697C4]">Honest answers help us focus your drills where it matters most.</p>
              <div className="space-y-2">
                {WEAKNESS_OPTIONS.map((w) => (
                  <button key={w} onClick={() => setBiggestWeakness(w)} className={optionClass(biggestWeakness === w)}>{w}</button>
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
