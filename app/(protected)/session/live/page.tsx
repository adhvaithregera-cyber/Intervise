'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type LivePhase =
  | 'loading'
  | 'prep'
  | 'recording'
  | 'between'
  | 'transcribing'
  | 'error'

type Question = {
  id: number
  question_text: string
  answer_format: string
  time_limit_seconds: number
  category_name: string
}

type StoredAnswer = {
  blob: Blob
  duration: number
  questionId: number
  index: number
}

export default function LiveSessionPage() {
  const [phase, setPhase] = useState<LivePhase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prepCount, setPrepCount] = useState(5)
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const answerStartTimeRef = useRef<number>(0)
  const storedAnswersRef = useRef<StoredAnswer[]>([])
  const mimeTypeRef = useRef<string | undefined>(undefined)

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

    const init = async () => {
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
        // camera optional
      }

      setPhase('prep')
    }

    init()

    return () => {
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
      if (answerTimerRef.current) clearInterval(answerTimerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Prep countdown
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
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(micStreamRef.current, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current ?? 'audio/webm' })
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      storedAnswersRef.current.push({
        blob,
        duration: elapsed,
        questionId: questions[currentIndex].id,
        index: currentIndex + 1,
      })
      setPhase('between')
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
      mediaRecorderRef.current.stop() // triggers onstop → stores blob → setPhase('between')
    }
  }

  function goNext() {
    setCurrentIndex(i => i + 1)
    setPhase('prep')
  }

  async function finishAndProcess() {
    setPhase('transcribing')
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!

    // Transcribe all stored answers sequentially
    for (const answer of storedAnswersRef.current) {
      const formData = new FormData()
      formData.append('audio', answer.blob, 'answer.webm')
      formData.append('session_id', sessionId)
      formData.append('question_id', String(answer.questionId))
      formData.append('answer_index', String(answer.index))
      formData.append('duration_seconds', String(answer.duration))
      try {
        await fetch('/api/session/transcribe', { method: 'POST', body: formData })
      } catch {
        // continue even if one answer fails — report page handles transcription_failed
      }
    }

    // Complete session and redirect to report
    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } finally {
      window.location.href = '/session/report/' + sessionId
    }
  }

  const isLastQuestion = currentIndex === questions.length - 1

  const glassCard = {
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

        {/* Loading */}
        {phase === 'loading' && (
          <p className="text-white/80 text-lg">Loading your session...</p>
        )}

        {/* Error */}
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

        {/* Prep countdown */}
        {phase === 'prep' && (
          <div className="max-w-2xl w-full text-center">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-3">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug px-4">
              {questions[currentIndex]?.question_text}
            </h2>
            <div className="text-8xl font-black text-[#1C0A00] mb-4">{prepCount}</div>
            <p className="text-white/70 text-sm">Recording starts automatically...</p>
          </div>
        )}

        {/* Recording */}
        {phase === 'recording' && (
          <div className="max-w-2xl w-full text-center">
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-3">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug px-4">
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

        {/* Between questions */}
        {phase === 'between' && (
          <div className="max-w-md w-full text-center">
            <div className="p-8 mb-8" style={glassCard}>
              {/* Checkmark */}
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'rgba(249,193,37,0.2)', border: '2px solid rgba(249,193,37,0.5)' }}
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                Answer {currentIndex + 1} of {questions.length}
              </p>
              <p className="text-white text-xl font-bold mb-1">Answer recorded</p>
              <p className="text-white/55 text-sm">
                {isLastQuestion
                  ? 'Your results will be ready shortly.'
                  : 'Get ready for the next question.'}
              </p>
            </div>

            {isLastQuestion ? (
              <button
                onClick={finishAndProcess}
                className="rounded-xl bg-[#1C0A00] px-10 py-3.5 text-base font-bold text-white hover:bg-black transition-colors shadow-lg"
              >
                See My Results
              </button>
            ) : (
              <button
                onClick={goNext}
                className="rounded-xl bg-[#1C0A00] px-10 py-3.5 text-base font-bold text-white hover:bg-black transition-colors shadow-lg"
              >
                Next Question
              </button>
            )}
          </div>
        )}

        {/* Transcribing all answers */}
        {phase === 'transcribing' && (
          <div className="text-center">
            <div className="generating-loader-wrapper">
              <div className="generating-loader-text">
                {'Generating transcript'.split('').map((char, i) => (
                  <span key={i} className="generating-loader-letter">
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
              <div className="generating-loader-bar" />
            </div>
            <p className="text-white/50 text-xs mt-6">Analysing all your answers...</p>
          </div>
        )}
      </div>

      {/* Camera corner */}
      {cameraStream && (
        <div
          className="fixed bottom-6 right-6 rounded-2xl overflow-hidden shadow-xl w-40 h-28 z-50"
          style={{ border: '2px solid rgba(249,193,37,0.4)' }}
        >
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
