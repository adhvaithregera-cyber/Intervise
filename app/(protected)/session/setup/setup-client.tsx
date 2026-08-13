'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Lock, AlertTriangle, Mic } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/fade-in'
import type { Difficulty } from '@/types/database'

type PermState  = 'idle' | 'requesting' | 'granted' | 'denied'
type LevelState = 'idle' | 'requesting' | 'listening' | 'good' | 'quiet' | 'skipped'

// RMS thresholds (time-domain, 0–1 scale)
const GOOD_THRESHOLD          = 0.05  // sustained audible voice
const INSTANT_PASS_THRESHOLD  = 0.08  // strong voice — pass immediately
const EVAL_DURATION_MS        = 3500  // sampling window before auto-evaluate

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

  const [difficulty,  setDifficulty]  = useState<Difficulty | null>(null)
  const [micPerm,     setMicPerm]     = useState<PermState>('idle')
  const [levelState,  setLevelState]  = useState<LevelState>('idle')
  const [audioLevel,  setAudioLevel]  = useState(0)

  const checkStreamRef  = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef    = useRef<number | null>(null)
  const evalTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const peakLevelRef    = useRef(0)
  const evaluatedRef    = useRef(false)

  // Detect if permission is already granted on mount (return visits)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(r => {
      if (r.state === 'granted') setMicPerm('granted')
    }).catch(() => {})
  }, [])

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopAnalyser()
      checkStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Analyser helpers ──────────────────────────────────────────────────────

  function stopAnalyser() {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    if (evalTimerRef.current !== null) clearTimeout(evalTimerRef.current)
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    animFrameRef.current = null
    evalTimerRef.current = null
  }

  // Starts the rAF loop. The stream stays alive until handleStart / unmount.
  // The loop never stops on its own — only stopAnalyser() ends it.
  function startAnalyser(stream: MediaStream) {
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
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      setAudioLevel(rms)
      if (rms > peakLevelRef.current) peakLevelRef.current = rms

      // Instant pass — strong voice, no need to wait for the full window
      if (!evaluatedRef.current && rms > INSTANT_PASS_THRESHOLD) {
        evaluatedRef.current = true
        if (evalTimerRef.current !== null) {
          clearTimeout(evalTimerRef.current)
          evalTimerRef.current = null
        }
        setLevelState('good')
        // rAF continues — bar stays live
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    // Auto-evaluate after the window — stream + rAF keep running regardless
    evalTimerRef.current = setTimeout(() => {
      if (evaluatedRef.current) return
      evaluatedRef.current = true
      setLevelState(peakLevelRef.current >= GOOD_THRESHOLD ? 'good' : 'quiet')
    }, EVAL_DURATION_MS)
  }

  // ── Step 1: request mic permission ────────────────────────────────────────
  // On first visit this shows the browser permission dialog.
  // On return visits with permission already granted, goes straight to the
  // level check (still needs getUserMedia to get an actual stream).
  async function requestPermission() {
    setMicPerm('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      checkStreamRef.current = stream
      setMicPerm('granted')
      // Immediately move to step 2 — bar appears right away
      setLevelState('listening')
      startAnalyser(stream)
    } catch {
      setMicPerm('denied')
    }
  }

  // ── Step 2: start level check (return visits where perm is pre-granted) ───
  async function startLevelCheck() {
    setLevelState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      checkStreamRef.current = stream
      setLevelState('listening')
      startAnalyser(stream)
    } catch {
      setLevelState('idle')
    }
  }

  // ── Retry: reset eval window, bar keeps running without interruption ───────
  function retryEval() {
    if (evalTimerRef.current !== null) {
      clearTimeout(evalTimerRef.current)
      evalTimerRef.current = null
    }
    peakLevelRef.current = 0
    evaluatedRef.current = false
    setLevelState('listening')

    evalTimerRef.current = setTimeout(() => {
      if (evaluatedRef.current) return
      evaluatedRef.current = true
      setLevelState(peakLevelRef.current >= GOOD_THRESHOLD ? 'good' : 'quiet')
    }, EVAL_DURATION_MS)
  }

  function skipLevel() {
    setLevelState('skipped')
    // Stream + analyser stay alive until handleStart
  }

  // ── Start session — stop check stream, live page re-acquires fresh ─────────
  function handleStart() {
    if (!canStart) return
    stopAnalyser()
    checkStreamRef.current?.getTracks().forEach(t => t.stop())
    checkStreamRef.current = null
    router.push(`/session/briefing?difficulty=${difficulty}`)
  }

  const canStart   = difficulty !== null && micPerm === 'granted' && (levelState === 'good' || levelState === 'skipped')
  const barVisible = levelState === 'listening' || levelState === 'good' || levelState === 'quiet'

  // Colour of the status text / bar accent based on level result
  const statusColor = levelState === 'good' ? 'text-green-300' : levelState === 'quiet' ? 'text-amber-300' : 'text-white/40'

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
                const locked   = !allowedDifficulties.includes(value)
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

        {/* ── Microphone: two distinct steps ───────────────────────────────── */}
        <FadeIn delay={0.16}>
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Microphone</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Required</span>
            </div>

            <div className="space-y-4">

              {/* ── Step 1: Allow access ───────────────────────────────────── */}
              <div className="flex items-start gap-3">
                {/* Step indicator */}
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={
                    micPerm === 'granted'
                      ? { background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }
                      : { background: 'rgba(249,193,37,0.12)', border: '1px solid rgba(249,193,37,0.35)', color: '#F9C125' }
                  }
                >
                  {micPerm === 'granted' ? '✓' : '1'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-1.5">Allow microphone access</p>

                  {micPerm === 'idle' || micPerm === 'requesting' ? (
                    <div className="space-y-2">
                      <button
                        onClick={requestPermission}
                        disabled={micPerm === 'requesting'}
                        className="flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Mic className="h-3.5 w-3.5 shrink-0" />
                        {micPerm === 'requesting' ? 'Waiting for permission…' : 'Allow Microphone'}
                      </button>
                      <p className="text-[10px] text-white/30 leading-relaxed">
                        Your browser will ask for permission. Required to record your answers.
                      </p>
                    </div>
                  ) : micPerm === 'granted' ? (
                    <p className="text-xs text-green-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Microphone access granted
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-red-300 flex items-start gap-1.5">
                        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Permission denied — allow microphone access in your browser settings, then reload.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Step 2: Level check (only after permission granted) ───── */}
              {micPerm === 'granted' && (
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={
                      levelState === 'good'
                        ? { background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }
                        : levelState === 'skipped'
                        ? { background: 'rgba(249,193,37,0.10)', border: '1px solid rgba(249,193,37,0.25)', color: 'rgba(249,193,37,0.6)' }
                        : { background: 'rgba(249,193,37,0.12)', border: '1px solid rgba(249,193,37,0.35)', color: '#F9C125' }
                    }
                  >
                    {levelState === 'good' ? '✓' : levelState === 'skipped' ? '–' : '2'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-1.5">Check your audio level</p>

                    {/* Not yet started (return visit — perm pre-granted, no stream yet) */}
                    {(levelState === 'idle' || levelState === 'requesting') && (
                      <button
                        onClick={startLevelCheck}
                        disabled={levelState === 'requesting'}
                        className="rounded-xl border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {levelState === 'requesting' ? 'Starting…' : 'Test microphone'}
                      </button>
                    )}

                    {/* Persistent level meter — visible for listening / good / quiet */}
                    {barVisible && (
                      <div className="space-y-3">
                        {/* Guidance tip */}
                        <p className="text-[10px] text-white/35 leading-relaxed">
                          Speak clearly at normal volume, sit close to your mic, and find a quiet room.
                        </p>

                        {/* Sentence prompt */}
                        <div>
                          <p className="text-[10px] text-white/40 mb-1">Read this out loud:</p>
                          <p className="text-sm font-medium text-white/80 italic">
                            &ldquo;I&rsquo;m ready for my interview.&rdquo;
                          </p>
                        </div>

                        {/* 10-bar volume meter — always visible, always updating */}
                        <div>
                          <div className="flex items-center gap-1 h-6">
                            {Array.from({ length: 10 }, (_, i) => {
                              const threshold  = (i + 1) / 10
                              const displayPct = Math.min(audioLevel / 0.15, 1)
                              const lit        = displayPct >= threshold
                              const barColor   =
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

                          {/* Status message beneath the bar */}
                          <div className="mt-2 min-h-[1.25rem]">
                            {levelState === 'listening' && (
                              <p className="text-[10px] text-white/30">Listening&hellip;</p>
                            )}
                            {levelState === 'good' && (
                              <p className={`text-xs font-medium flex items-center gap-1.5 ${statusColor}`}>
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                Great, we can hear you clearly!
                              </p>
                            )}
                            {levelState === 'quiet' && (
                              <p className={`text-xs flex items-start gap-1.5 ${statusColor}`}>
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                We can barely hear you — move closer to your mic or speak up.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions — only shown once evaluated */}
                        {(levelState === 'good' || levelState === 'quiet') && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {levelState === 'quiet' && (
                              <button
                                onClick={retryEval}
                                className="rounded-xl bg-[#F9C125] px-4 py-1.5 text-xs font-bold text-[#080d1a] hover:brightness-110 transition-all cursor-pointer"
                              >
                                Try again
                              </button>
                            )}
                            {levelState === 'good' && (
                              <button
                                onClick={retryEval}
                                className="text-[10px] text-white/30 hover:text-white/50 transition-colors underline underline-offset-2 cursor-pointer"
                              >
                                Re-test
                              </button>
                            )}
                            {levelState === 'quiet' && (
                              <button
                                onClick={skipLevel}
                                className="rounded-xl border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/45 hover:bg-white/5 hover:text-white/65 transition-all cursor-pointer"
                              >
                                Proceed anyway
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skipped state — bar hidden, brief acknowledgement */}
                    {levelState === 'skipped' && (
                      <div className="flex items-center gap-2.5 text-amber-400/65">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Proceeding with caution — audio may be quiet.</span>
                        <button
                          onClick={retryEval}
                          className="text-[10px] text-white/30 hover:text-white/50 transition-colors underline underline-offset-2 cursor-pointer shrink-0"
                        >
                          Re-test
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </FadeIn>

        {/* Camera — coming soon */}
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
