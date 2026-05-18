'use client'
import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type LivePhase =
  | 'loading'
  | 'prep'
  | 'recording'
  | 'analyzing'
  | 'between'
  | 'completing'
  | 'done'
  | 'error'

type Question = {
  id: number
  question_text: string
  answer_format: string
  time_limit_seconds: number
  category_name: string
}

type AnswerResult = {
  transcript: string | null
  fillerCount: number | null
  fillerBreakdown: Record<string, number> | null
  wpm: number | null
  transcriptionFailed: boolean
}

function calculateStars(wpm: number | null, fillerCount: number | null): number {
  let total = 0
  let count = 0
  if (wpm !== null) {
    if (wpm >= 130 && wpm <= 160) total += 5
    else if ((wpm >= 110 && wpm < 130) || (wpm > 160 && wpm <= 180)) total += 4
    else if ((wpm >= 90 && wpm < 110) || (wpm > 180 && wpm <= 200)) total += 3
    else if (wpm >= 70) total += 2
    else total += 1
    count++
  }
  if (fillerCount !== null) {
    if (fillerCount <= 1) total += 5
    else if (fillerCount <= 3) total += 4
    else if (fillerCount <= 6) total += 3
    else if (fillerCount <= 10) total += 2
    else total += 1
    count++
  }
  return count > 0 ? Math.round(total / count) : 3
}

export default function LiveSessionPage() {
  const [phase, setPhase] = useState<LivePhase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prepCount, setPrepCount] = useState(5)
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const answerStartTimeRef = useRef<number>(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const q = params.get('q')
    if (!sessionId || !q) {
      setPhase('error')
      setErrorMessage('Missing session parameters.')
      return
    }

    const questionIds = q.split(',').map(Number)

    const fetchQuestions = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.from('questions').select('*').in('id', questionIds)
      if (!data || data.length === 0) {
        setPhase('error')
        setErrorMessage('Could not load questions.')
        return
      }
      const sorted = questionIds.map(id => data.find(q => q.id === id)!).filter(Boolean)
      setQuestions(sorted as Question[])

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
      } catch {
        setPhase('error')
        setErrorMessage('Microphone access is required to record answers.')
        return
      }

      try {
        const perm = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (perm.state === 'granted') {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setCameraStream(camStream)
          cameraStreamRef.current = camStream
        }
      } catch {
        // camera is optional
      }

      setPhase('prep')
    }

    fetchQuestions()

    return () => {
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
      if (answerTimerRef.current) clearInterval(answerTimerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'prep') return
    setPrepCount(5)
    let count = 5
    const id = setInterval(() => {
      count -= 1
      setPrepCount(count)
      if (count <= 0) {
        clearInterval(id)
        startRecording()
      }
    }, 1000)
    prepTimerRef.current = id
    return () => clearInterval(id)
  }, [phase, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  function startRecording() {
    if (!micStreamRef.current) return
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : undefined
    const recorder = new MediaRecorder(micStreamRef.current, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType ?? 'audio/webm' })
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      submitAnswer(blob, elapsed)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    answerStartTimeRef.current = Date.now()
    setPhase('recording')

    const timeLimit = questions[currentIndex]?.time_limit_seconds ?? 60
    setAnswerTimeLeft(timeLimit)
    const id = setInterval(() => {
      setAnswerTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          stopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    answerTimerRef.current = id
  }

  function stopRecording() {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      setPhase('analyzing')
      mediaRecorderRef.current.stop()
    }
  }

  async function submitAnswer(audioBlob: Blob, durationSeconds: number) {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!
    const question = questions[currentIndex]
    const formData = new FormData()
    formData.append('audio', audioBlob, 'answer.webm')
    formData.append('session_id', sessionId)
    formData.append('question_id', String(question.id))
    formData.append('answer_index', String(currentIndex + 1))
    formData.append('duration_seconds', String(durationSeconds))

    try {
      const res = await fetch('/api/session/transcribe', { method: 'POST', body: formData })
      const data: AnswerResult = await res.json()
      setLastResult(data)
    } catch {
      setLastResult({ transcript: null, fillerCount: null, fillerBreakdown: null, wpm: null, transcriptionFailed: true })
    } finally {
      setPhase('between')
    }
  }

  async function completeSession() {
    setPhase('completing')
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!
    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } finally {
      setPhase('done')
      window.location.href = '/session/report/' + sessionId
    }
  }

  const card = {
    background: 'rgba(28,10,0,0.45)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(249,193,37,0.25)',
    borderRadius: '1rem',
  }

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{ backgroundColor: '#E07A2F' }}
    >
      {/* Radial golden glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 75% 60% at 50% 40%, rgba(249,193,37,0.45) 0%, rgba(249,193,37,0.12) 50%, transparent 75%)',
        }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">

        {phase === 'loading' && (
          <p className="text-white/80 text-lg">Loading your session...</p>
        )}

        {phase === 'error' && (
          <div className="max-w-md text-center">
            <p className="text-white mb-6 text-lg">{errorMessage}</p>
            <button
              onClick={() => window.location.href = '/session/setup'}
              className="rounded-xl bg-[#1C0A00] px-8 py-3 text-sm font-bold text-white hover:bg-black transition-colors"
            >
              Back to Setup
            </button>
          </div>
        )}

        {phase === 'prep' && (
          <div className="max-w-2xl w-full text-center">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-3">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug">
              {questions[currentIndex]?.question_text}
            </h2>
            <div className="text-8xl font-black text-[#1C0A00] mb-4">{prepCount}</div>
            <p className="text-white/70">Recording starts automatically...</p>
          </div>
        )}

        {phase === 'recording' && (
          <div className="max-w-2xl w-full text-center">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-3">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug">
              {questions[currentIndex]?.question_text}
            </h2>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white font-semibold">Recording</span>
              <span className="text-white/60 text-sm ml-2">{answerTimeLeft}s remaining</span>
            </div>
            <button
              onClick={stopRecording}
              className="rounded-xl border-2 border-white/40 bg-white/10 px-10 py-3 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="generating-loader-wrapper">
            <div className="generating-loader-text">
              {'Generating transcript'.split('').map((char, i) => (
                <span key={i} className="generating-loader-letter">{char === ' ' ? '\u00A0' : char}</span>
              ))}
            </div>
            <div className="generating-loader-bar" />
          </div>
        )}

        {phase === 'between' && (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-2">
                Answer {currentIndex + 1} of {questions.length} complete
              </p>
              <h2 className="text-3xl font-bold text-white">Here&apos;s how you did</h2>
            </div>

            {lastResult && !lastResult.transcriptionFailed ? (
              <>
                {/* Star rating */}
                <div className="flex justify-center gap-1 mb-8">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const stars = calculateStars(lastResult.wpm, lastResult.fillerCount)
                    return (
                      <span
                        key={i}
                        className="text-4xl"
                        style={{ color: i < stars ? '#F9C125' : 'rgba(255,255,255,0.2)' }}
                      >
                        ★
                      </span>
                    )
                  })}
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-6 text-center" style={card}>
                    <p className="text-xs text-white/55 uppercase tracking-widest mb-2">Speaking pace</p>
                    <p className={cn(
                      'text-4xl font-black mb-1',
                      lastResult.wpm && lastResult.wpm >= 130 && lastResult.wpm <= 160
                        ? 'text-green-400'
                        : 'text-amber-300'
                    )}>
                      {lastResult.wpm ?? '—'}
                    </p>
                    <p className="text-white/50 text-xs">wpm · target 130–160</p>
                  </div>
                  <div className="p-6 text-center" style={card}>
                    <p className="text-xs text-white/55 uppercase tracking-widest mb-2">Filler words</p>
                    <p className="text-4xl font-black text-white mb-1">{lastResult.fillerCount ?? '—'}</p>
                    {lastResult.fillerBreakdown && Object.keys(lastResult.fillerBreakdown).length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-center mt-2">
                        {Object.entries(lastResult.fillerBreakdown).map(([word, count]) => (
                          <span
                            key={word}
                            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                            style={{ background: 'rgba(249,193,37,0.25)', border: '1px solid rgba(249,193,37,0.35)' }}
                          >
                            {word} ×{count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transcript */}
                {lastResult.transcript && (
                  <div className="p-6 mb-8" style={card}>
                    <p className="text-xs text-white/55 uppercase tracking-widest mb-3">What you said</p>
                    <p className="text-white/85 text-sm leading-relaxed">{lastResult.transcript}</p>
                  </div>
                )}
              </>
            ) : lastResult?.transcriptionFailed ? (
              <div className="p-6 text-center mb-8" style={card}>
                <Badge variant="amber">Transcription unavailable</Badge>
                <p className="text-white/60 mt-3 text-sm">
                  We couldn&apos;t process this answer. You can still continue.
                </p>
              </div>
            ) : null}

            <div className="text-center">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => { setCurrentIndex(i => i + 1); setPhase('prep') }}
                  className="rounded-xl bg-[#1C0A00] px-10 py-3.5 text-base font-bold text-white hover:bg-black transition-colors shadow-lg"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={completeSession}
                  className="rounded-xl bg-[#1C0A00] px-10 py-3.5 text-base font-bold text-white hover:bg-black transition-colors shadow-lg"
                >
                  See My Results
                </button>
              )}
            </div>
          </div>
        )}

        {(phase === 'completing' || phase === 'done') && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80 text-lg">Calculating your results...</p>
          </div>
        )}
      </div>

      {/* Camera corner */}
      {cameraStream && (
        <div className="fixed bottom-6 right-6 rounded-2xl overflow-hidden shadow-xl w-40 h-28 z-50"
          style={{ border: '2px solid rgba(249,193,37,0.4)' }}>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
