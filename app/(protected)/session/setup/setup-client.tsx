'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Lock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

type PermState = 'idle' | 'granted' | 'denied' | 'requesting'
type CheckState = 'idle' | 'requesting' | 'sampling' | 'pass' | 'warn' | 'skipped'

// RMS thresholds (time-domain, 0–1 scale)
const GOOD_THRESHOLD = 0.05         // sustained voice at normal volume
const INSTANT_PASS_THRESHOLD = 0.08 // clearly audible — pass immediately
const CHECK_DURATION_MS = 3500      // sampling window before auto-evaluating

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
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)

  const checkStreamRef   = useRef<MediaStream | null>(null)
  const audioContextRef  = useRef<AudioContext | null>(null)
  const animFrameRef     = useRef<number | null>(null)
  const checkTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const peakLevelRef     = useRef(0)
  const evaluatedRef     = useRef(false)

  // Check if permission already granted (e.g. return visit)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(r => {
      if (r.state === 'granted') setMicPerm('granted')
    }).catch(() => {})
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCheck()
      checkStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function stopCheck() {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    if (checkTimerRef.current !== null) clearTimeout(checkTimerRef.current)
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    animFrameRef.current = null
    checkTimerRef.current = null
  }

  function runSampling(stream: MediaStream) {
    peakLevelRef.current = 0
    evaluatedRef.current = false

    const ctx = new AudioContext()
    audioContextRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.3
    ctx.createMediaStreamSource(stream).connect(analyser)

    const data = new Uint8Array(analyser.fftSize)

    function tick() {
      analyser.getByteTimeDomainData(data)
      // RMS of deviation from silence (128 = zero crossing in time-domain data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      setAudioLevel(rms)
      if (rms > peakLevelRef.current) peakLevelRef.current = rms

      // Strong voice detected — pass immediately without waiting for the full window
      if (!evaluatedRef.current && rms > INSTANT_PASS_THRESHOLD) {
        evaluatedRef.current = true
        stopCheck()
        stream.getTracks().forEach(t => t.stop())
        checkStreamRef.current = null
        setCheckState('pass')
        return
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    // Auto-evaluate after the sampling window ends
    checkTimerRef.current = setTimeout(() => {
      if (evaluatedRef.current) return
      evaluatedRef.current = true
      stopCheck()
      stream.getTracks().forEach(t => t.stop())
      checkStreamRef.current = null
      setAudioLevel(0)
      setCheckState(peakLevelRef.current >= GOOD_THRESHOLD ? 'pass' : 'warn')
    }, CHECK_DURATION_MS)
  }

  async function startMicCheck() {
    setCheckState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPerm('granted')
      checkStreamRef.current = stream
      setCheckState('sampling')
      runSampling(stream)
    } catch {
      setMicPerm('denied')
      setCheckState('idle')
    }
  }

  async function retryCheck() {
    stopCheck()
    checkStreamRef.current?.getTracks().forEach(t => t.stop())
    checkStreamRef.current = null
    setAudioLevel(0)
    setCheckState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      checkStreamRef.current = stream
      setCheckState('sampling')
      runSampling(stream)
    } catch {
      setCheckState('idle')
    }
  }

  function skipCheck() {
    stopCheck()
    checkStreamRef.current?.getTracks().forEach(t => t.stop())
    checkStreamRef.current = null
    setAudioLevel(0)
    setCheckState('skipped')
  }

  function handleStart() {
    if (!canStart) return
    router.push(`/session/briefing?difficulty=${difficulty}`)
  }

  // Start is enabled once the mic check is done (pass) or consciously skipped
  const canStart = difficulty !== null && (checkState === 'pass' || checkState === 'skipped')

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4">
      <div
        className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 max-h-[calc(100dvh-5rem)] overflow-y-auto"
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
            <p className="mt-1 text-sm text-white/60">Choose difficulty and check your mic before you begin.</p>
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

        {/* Microphone / Audio Check */}
        <FadeIn delay={0.16}>
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Microphone</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Required</span>
            </div>

            {/* idle / requesting — show check button */}
            {(checkState === 'idle' || checkState === 'requesting') && (
              <div className="space-y-2">
                <button
                  onClick={startMicCheck}
                  disabled={checkState === 'requesting'}
                  className="rounded-xl border border-white/40 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {checkState === 'requesting'
                    ? 'Checking...'
                    : micPerm === 'granted'
                    ? 'Test your microphone'
                    : 'Check microphone'}
                </button>
                {micPerm === 'denied' && (
                  <div className="flex items-start gap-2 text-red-300">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="text-xs">Permission denied. Allow microphone access in your browser settings.</p>
                  </div>
                )}
              </div>
            )}

            {/* sampling — live volume meter */}
            {checkState === 'sampling' && (
              <div className="space-y-3">
                {/* Guidance */}
                <div
                  className="rounded-xl px-4 py-3 text-xs text-white/50 leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  For accurate feedback, speak clearly at normal volume, sit close to your mic, and find a quiet room.
                </div>

                {/* Prompt */}
                <div>
                  <p className="text-xs text-white/50 mb-1.5">Read this out loud:</p>
                  <p className="text-sm font-semibold text-white/90 italic">
                    &ldquo;I&rsquo;m ready for my interview.&rdquo;
                  </p>
                </div>

                {/* 10-bar volume meter: red → amber → green */}
                <div>
                  <div className="flex items-center gap-1 h-7">
                    {Array.from({ length: 10 }, (_, i) => {
                      const threshold = (i + 1) / 10
                      const displayLevel = Math.min(audioLevel / 0.15, 1)
                      const lit = displayLevel >= threshold
                      const barColor =
                        i < 4 ? 'rgba(239,68,68,0.85)'
                        : i < 7 ? 'rgba(249,193,37,0.85)'
                        : 'rgba(74,222,128,0.85)'
                      return (
                        <div
                          key={i}
                          className="flex-1 h-full rounded-sm transition-colors duration-75"
                          style={{ backgroundColor: lit ? barColor : 'rgba(255,255,255,0.08)' }}
                        />
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-white/30 mt-1.5">Listening&hellip;</p>
                </div>
              </div>
            )}

            {/* pass */}
            {checkState === 'pass' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Great, we can hear you clearly!</span>
                </div>
                <button
                  onClick={retryCheck}
                  className="text-[10px] text-white/30 hover:text-white/50 transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Re-test microphone
                </button>
              </div>
            )}

            {/* warn — audio too quiet */}
            {checkState === 'warn' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-300 leading-snug">
                    We can barely hear you — move closer to your mic or speak up, then try again.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={retryCheck}
                    className="rounded-xl bg-[#F9C125] px-4 py-2 text-xs font-bold text-[#080d1a] hover:brightness-110 transition-all cursor-pointer"
                  >
                    Try again
                  </button>
                  <button
                    onClick={skipCheck}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/50 hover:bg-white/5 hover:text-white/70 transition-all cursor-pointer"
                  >
                    Proceed anyway
                  </button>
                </div>
              </div>
            )}

            {/* skipped — user acknowledged the warning and continued */}
            {checkState === 'skipped' && (
              <div className="flex items-center gap-3 text-amber-400/70">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm">Proceeding with caution — audio may be quiet.</span>
                <button
                  onClick={retryCheck}
                  className="text-[10px] text-white/30 hover:text-white/50 transition-colors underline underline-offset-2 cursor-pointer shrink-0"
                >
                  Re-test
                </button>
              </div>
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
