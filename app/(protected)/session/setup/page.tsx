'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Difficulty = 'easy' | 'medium' | 'mixed'
type PermState = 'idle' | 'granted' | 'denied' | 'requesting'

type Question = { id: number }

const DIFFICULTY_OPTIONS: { value: Difficulty; title: string; desc: string }[] = [
  { value: 'easy',   title: 'Easy',   desc: 'Common openers and strength/weakness questions' },
  { value: 'medium', title: 'Medium', desc: 'Behavioural, motivation, and situational questions' },
  { value: 'mixed',  title: 'Mixed',  desc: 'Random selection across all categories' },
]

export default function SessionSetupPage() {
  const router = useRouter()

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [micPerm, setMicPerm] = useState<PermState>('idle')
  const [cameraPerm, setCameraPerm] = useState<PermState>('idle')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function requestMic() {
    setMicPerm('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setMicPerm('granted')
    } catch {
      setMicPerm('denied')
    }
  }

  async function requestCamera() {
    setCameraPerm('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      setCameraPerm('granted')
    } catch {
      setCameraPerm('denied')
    }
  }

  async function handleStart() {
    if (!difficulty || micPerm !== 'granted') return
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'quota_exceeded') {
          setError("You've used all your sessions this month. Upgrade your plan to continue.")
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }
      const questionIds = (data.questions as Question[]).map((q) => q.id).join(',')
      router.push(`/session/briefing?session_id=${data.sessionId}&q=${questionIds}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Page header */}
      <h1 className="mb-2 text-3xl font-bold text-[#E07A2F]">Set up your session</h1>
      <p className="mb-10 text-[#A0622A]">
        Choose your difficulty and grant the permissions we need to get started.
      </p>

      {/* Section 1: Difficulty selector */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[#E07A2F]">Difficulty</h2>
        <div className="grid grid-cols-3 gap-4">
          {DIFFICULTY_OPTIONS.map(({ value, title, desc }) => (
            <Card
              key={value}
              onClick={() => setDifficulty(value)}
              className={cn(
                'cursor-pointer transition-all',
                difficulty === value
                  ? 'border-[#E07A2F] bg-[#E07A2F]/5'
                  : 'hover:border-[#F9C125]'
              )}
            >
              <p className="mb-1 font-semibold text-[#E07A2F]">{title}</p>
              <p className="text-sm text-[#A0622A]">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Microphone */}
      <section className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#E07A2F]">Microphone</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Required</span>
        </div>
        <p className="mb-4 text-sm text-[#A0622A]">
          Required to record your answers. Audio is transcribed by AssemblyAI and never stored as a raw file.
        </p>

        {micPerm === 'granted' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Microphone access granted</span>
          </div>
        ) : micPerm === 'requesting' ? (
          <Button variant="outline" disabled>Requesting...</Button>
        ) : (
          <>
            <Button variant="outline" onClick={requestMic}>
              Grant Microphone Access
            </Button>
            {micPerm === 'denied' && (
              <div className="mt-3 flex items-start gap-2 text-red-500">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">Permission denied. Please allow microphone access in your browser settings.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Section 3: Camera */}
      <section className="mb-10">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#E07A2F]">Camera</h2>
          <Badge variant="brand">Student+ feature</Badge>
        </div>
        <p className="mb-4 text-sm text-[#A0622A]">
          Used for real-time eye contact analysis. All facial processing happens in your browser — no video is ever
          sent to our servers. Grant for best results.
        </p>

        {cameraPerm === 'granted' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Camera access granted</span>
          </div>
        ) : cameraPerm === 'requesting' ? (
          <Button variant="outline" disabled>Requesting...</Button>
        ) : (
          <>
            <Button variant="outline" onClick={requestCamera}>
              Grant Camera Access
            </Button>
            {cameraPerm === 'denied' && (
              <p className="mt-3 text-sm text-[#A0622A]">
                That&apos;s okay — eye contact tracking will be skipped.
              </p>
            )}
          </>
        )}
      </section>

      {/* Start button */}
      <Button
        variant="primary"
        fullWidth
        disabled={difficulty === null || micPerm !== 'granted' || starting}
        onClick={handleStart}
      >
        {starting ? 'Starting…' : 'Start Session'}
      </Button>

      {error && (
        <p className="mt-3 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
