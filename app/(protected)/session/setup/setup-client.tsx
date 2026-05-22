'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

type PermState = 'idle' | 'granted' | 'denied' | 'requesting'

const ALL_DIFFICULTY_OPTIONS: { value: Difficulty; title: string; desc: string }[] = [
  { value: 'easy',   title: 'Easy',   desc: 'Common openers and strength/weakness questions' },
  { value: 'medium', title: 'Medium', desc: 'Behavioural, motivation, and situational questions' },
  { value: 'mixed',  title: 'Mixed',  desc: 'Random selection across all categories' },
  { value: 'hard',   title: 'Hard',   desc: 'Curveball, pressure, and advanced situational questions' },
]

const TIER_ALLOWED_DIFFICULTIES: Record<string, Difficulty[]> = {
  free:    ['easy'],
  student: ['easy', 'medium'],
  pro:     ['easy', 'medium', 'mixed', 'hard'],
}

const CARD_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const CARD_SELECTED_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '2px solid #F9C125',
  borderRadius: '1rem',
}

const CARD_LOCKED_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.40)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.08)',
  borderRadius: '1rem',
  opacity: 0.5,
}

export function SetupClient({ tier }: { tier: string }) {
  const router = useRouter()
  const allowedDifficulties = TIER_ALLOWED_DIFFICULTIES[tier] ?? TIER_ALLOWED_DIFFICULTIES.free
  const cameraAllowed = tier === 'student' || tier === 'pro'

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [micPerm, setMicPerm] = useState<PermState>('idle')
  const [cameraPerm, setCameraPerm] = useState<PermState>('idle')

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

  function handleStart() {
    if (!difficulty || micPerm !== 'granted') return
    router.push(`/session/briefing?difficulty=${difficulty}`)
  }

  const canStart = difficulty !== null && micPerm === 'granted'

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Page header */}
      <FadeIn delay={0}>
        <h1 className="mb-2 text-3xl font-bold text-white">Set up your session</h1>
        <p className="mb-10 text-white/70 font-medium">
          Choose your difficulty and grant the permissions we need to get started.
        </p>
      </FadeIn>

      {/* Section 1: Difficulty selector */}
      <FadeIn delay={0.08}>
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Difficulty</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ALL_DIFFICULTY_OPTIONS.map(({ value, title, desc }) => {
              const locked = !allowedDifficulties.includes(value)
              const selected = difficulty === value
              return (
                <div
                  key={value}
                  onClick={() => !locked && setDifficulty(value)}
                  className={locked ? 'cursor-not-allowed transition-all p-5' : 'cursor-pointer transition-all p-5'}
                  style={locked ? CARD_LOCKED_STYLE : selected ? CARD_SELECTED_STYLE : CARD_STYLE}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[#F9C125]">{title}</p>
                    {locked && <Lock className="h-3.5 w-3.5 text-white/40 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/65">{desc}</p>
                  {locked && (
                    <p className="mt-2 text-[10px] font-semibold text-[#F9C125]/60 uppercase tracking-wider">
                      {value === 'hard' || value === 'mixed' ? 'Pro only' : 'Upgrade to unlock'}
                    </p>
                  )}
                </div>
              )
            })}
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
          <p className="mb-4 text-sm text-white/70">
            Required to record your answers. Audio is transcribed by AssemblyAI and never stored as a raw file.
          </p>

          {micPerm === 'granted' ? (
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Microphone access granted</span>
            </div>
          ) : micPerm === 'requesting' ? (
            <button disabled className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/40 cursor-not-allowed">
              Requesting...
            </button>
          ) : (
            <>
              <button
                onClick={requestMic}
                className="border border-white/40 rounded-xl px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Grant Microphone Access
              </button>
              {micPerm === 'denied' && (
                <div className="mt-3 flex items-start gap-2 text-red-300">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">Permission denied. Please allow microphone access in your browser settings.</p>
                </div>
              )}
            </>
          )}
        </section>
      </FadeIn>

      {/* Section 3: Camera — Student+ only */}
      <FadeIn delay={0.24}>
        <section className="mb-10">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Camera</h2>
            {cameraAllowed
              ? <Badge variant="brand">Student+ feature</Badge>
              : <Badge variant="gray">Student+ only</Badge>
            }
          </div>
          <p className="mb-4 text-sm text-white/70">
            {cameraAllowed
              ? 'Used for real-time eye contact analysis. All facial processing happens in your browser — no video is ever sent to our servers.'
              : 'Eye contact analysis is available on Student and Pro plans.'}
          </p>

          {!cameraAllowed ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/40">Upgrade to Student to unlock camera analysis</span>
            </div>
          ) : cameraPerm === 'granted' ? (
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Camera access granted</span>
            </div>
          ) : cameraPerm === 'requesting' ? (
            <button disabled className="border border-white/20 rounded-xl px-4 py-2 text-sm text-white/40 cursor-not-allowed">
              Requesting...
            </button>
          ) : (
            <>
              <button
                onClick={requestCamera}
                className="border border-white/40 rounded-xl px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
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
          Start Session
        </button>
      </FadeIn>
    </div>
  )
}
