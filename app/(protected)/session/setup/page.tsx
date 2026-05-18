'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'

type Difficulty = 'easy' | 'medium' | 'mixed'
type PermState = 'idle' | 'granted' | 'denied' | 'requesting'

type Question = { id: number }

const DIFFICULTY_OPTIONS: { value: Difficulty; title: string; desc: string }[] = [
  { value: 'easy',   title: 'Easy',   desc: 'Common openers and strength/weakness questions' },
  { value: 'medium', title: 'Medium', desc: 'Behavioural, motivation, and situational questions' },
  { value: 'mixed',  title: 'Mixed',  desc: 'Random selection across all categories' },
]

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(249,193,37,0.13)',
  borderRadius: '1rem',
}

const CARD_SELECTED_STYLE = {
  backgroundColor: 'rgba(249,193,37,0.08)',
  border: '1px solid #F9C125',
  borderRadius: '1rem',
}

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

  const canStart = difficulty !== null && micPerm === 'granted' && !starting

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Page header */}
      <FadeIn delay={0}>
        <h1 className="mb-2 text-3xl font-bold text-white">Set up your session</h1>
        <p className="mb-10 text-white/55">
          Choose your difficulty and grant the permissions we need to get started.
        </p>
      </FadeIn>

      {/* Section 1: Difficulty selector */}
      <FadeIn delay={0.08}>
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Difficulty</h2>
          <div className="grid grid-cols-3 gap-4">
            {DIFFICULTY_OPTIONS.map(({ value, title, desc }) => (
              <div
                key={value}
                onClick={() => setDifficulty(value)}
                className="cursor-pointer transition-all p-5"
                style={difficulty === value ? CARD_SELECTED_STYLE : CARD_STYLE}
              >
                <p className="mb-1 font-semibold text-white">{title}</p>
                <p className="text-sm text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Section 2: Microphone */}
      <FadeIn delay={0.16}>
        <section className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Microphone</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Required</span>
          </div>
          <p className="mb-4 text-sm text-white/55">
            Required to record your answers. Audio is transcribed by AssemblyAI and never stored as a raw file.
          </p>

          {micPerm === 'granted' ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Microphone access granted</span>
            </div>
          ) : micPerm === 'requesting' ? (
            <button
              disabled
              className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/40 cursor-not-allowed"
            >
              Requesting...
            </button>
          ) : (
            <>
              <button
                onClick={requestMic}
                className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                Grant Microphone Access
              </button>
              {micPerm === 'denied' && (
                <div className="mt-3 flex items-start gap-2 text-red-400">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">Permission denied. Please allow microphone access in your browser settings.</p>
                </div>
              )}
            </>
          )}
        </section>
      </FadeIn>

      {/* Section 3: Camera */}
      <FadeIn delay={0.24}>
        <section className="mb-10">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Camera</h2>
            <Badge variant="brand">Student+ feature</Badge>
          </div>
          <p className="mb-4 text-sm text-white/55">
            Used for real-time eye contact analysis. All facial processing happens in your browser — no video is ever
            sent to our servers. Grant for best results.
          </p>

          {cameraPerm === 'granted' ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Camera access granted</span>
            </div>
          ) : cameraPerm === 'requesting' ? (
            <button
              disabled
              className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/40 cursor-not-allowed"
            >
              Requesting...
            </button>
          ) : (
            <>
              <button
                onClick={requestCamera}
                className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                Grant Camera Access
              </button>
              {cameraPerm === 'denied' && (
                <p className="mt-3 text-sm text-white/55">
                  That&apos;s okay — eye contact tracking will be skipped.
                </p>
              )}
            </>
          )}
        </section>
      </FadeIn>

      {/* Start button */}
      <FadeIn delay={0.32}>
        <button
          disabled={!canStart}
          onClick={handleStart}
          className="w-full rounded-xl bg-[#F9C125] py-3.5 text-base font-bold text-[#1C0A00] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {starting ? 'Starting…' : 'Start Session'}
        </button>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}
      </FadeIn>
    </div>
  )
}
