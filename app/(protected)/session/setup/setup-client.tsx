'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

type PermState = 'idle' | 'granted' | 'denied' | 'requesting'

const ALL_DIFFICULTY_OPTIONS: { value: Difficulty; title: string; desc: string }[] = [
  { value: 'easy',   title: 'Easy',   desc: 'Common openers, strengths & weaknesses' },
  { value: 'medium', title: 'Medium', desc: 'Behavioural, motivation & situational' },
  { value: 'mixed',  title: 'Mixed',  desc: 'Random mix across all categories' },
  { value: 'hard',   title: 'Hard',   desc: 'Curveball, pressure & advanced questions' },
]

const TIER_ALLOWED_DIFFICULTIES: Record<string, Difficulty[]> = {
  free:    ['easy'],
  student: ['easy', 'medium'],
  pro:     ['easy', 'medium', 'mixed', 'hard'],
}

const CARD_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const CARD_SELECTED_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '2px solid #F9C125',
  borderRadius: '1rem',
}

const CARD_LOCKED_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.40)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.08)',
  borderRadius: '1rem',
  opacity: 0.5,
}

export function SetupClient({ tier }: { tier: string }) {
  const router = useRouter()
  const allowedDifficulties = TIER_ALLOWED_DIFFICULTIES[tier] ?? TIER_ALLOWED_DIFFICULTIES.free

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [micPerm, setMicPerm] = useState<PermState>('idle')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(r => {
      if (r.state === 'granted') setMicPerm('granted')
    }).catch(() => {})
  }, [])

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

  function handleStart() {
    if (!difficulty || micPerm !== 'granted') return
    router.push(`/session/briefing?difficulty=${difficulty}`)
  }

  const canStart = difficulty !== null && micPerm === 'granted'

  return (
    // Negate layout's px-6 py-8, lock to viewport height minus navbar
    <div className="-mx-6 -my-8 flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4">
      <div
        className="w-full max-w-2xl rounded-2xl p-6 sm:p-8"
        style={{
          backgroundColor: 'rgba(8,13,26,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,193,37,0.18)',
        }}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Set up your session</h1>
            <p className="mt-1 text-sm text-white/60">Choose difficulty and grant microphone access to begin.</p>
          </div>
        </FadeIn>

        {/* Difficulty */}
        <FadeIn delay={0.08}>
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">Difficulty</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ALL_DIFFICULTY_OPTIONS.map(({ value, title, desc }) => {
                const locked = !allowedDifficulties.includes(value)
                const selected = difficulty === value
                return (
                  <div
                    key={value}
                    onClick={() => !locked && setDifficulty(value)}
                    className={`${locked ? 'cursor-not-allowed' : 'cursor-pointer'} transition-all p-4`}
                    style={locked ? CARD_LOCKED_STYLE : selected ? CARD_SELECTED_STYLE : CARD_STYLE}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[#F9C125] text-sm">{title}</p>
                      {locked && <Lock className="h-3 w-3 text-white/40 shrink-0" />}
                    </div>
                    <p className="text-xs text-white/55 leading-snug">{desc}</p>
                    {locked && (
                      <p className="mt-1.5 text-[10px] font-semibold text-[#F9C125]/50 uppercase tracking-wider">
                        {value === 'hard' || value === 'mixed' ? 'Pro only' : 'Upgrade'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </FadeIn>

        {/* Microphone */}
        <FadeIn delay={0.16}>
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Microphone</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Required</span>
            </div>

            {micPerm === 'granted' ? (
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Access granted</span>
              </div>
            ) : micPerm === 'requesting' ? (
              <button disabled className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/40 cursor-not-allowed">
                Requesting...
              </button>
            ) : (
              <>
                <button
                  onClick={requestMic}
                  className="rounded-xl border border-white/40 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Grant Microphone Access
                </button>
                {micPerm === 'denied' && (
                  <div className="mt-2 flex items-start gap-2 text-red-300">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="text-xs">Permission denied. Allow microphone access in your browser settings.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </FadeIn>

        {/* Camera — coming soon, minimal */}
        <FadeIn delay={0.22}>
          <div className="mb-7 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30">Camera</h2>
            <Badge variant="amber">Coming Soon</Badge>
          </div>
        </FadeIn>

        {/* Start */}
        <FadeIn delay={0.28}>
          <button
            disabled={!canStart}
            onClick={handleStart}
            className="w-full rounded-xl bg-[#F9C125] py-3.5 text-base font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
          >
            Start Session
          </button>
        </FadeIn>
      </div>
    </div>
  )
}
