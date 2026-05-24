'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

type StoredAnswer =
  | { type: 'audio'; blob: Blob; duration: number; questionId: number; index: number }
  | { type: 'text'; transcript: string; duration: number; questionId: number; index: number }

const glassCard = {
  backgroundColor: 'rgba(8,13,26,0.70)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(249,193,37,0.25)',
  borderRadius: '1.25rem',
}

export default function LiveSessionPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<LivePhase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prepCount, setPrepCount] = useState(5)
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  // Shared refs
  const tierRef = useRef<string>('free')
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerStartTimeRef = useRef<number>(0)
  const storedAnswersRef = useRef<StoredAnswer[]>([])
  const endingSessionRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Audio path refs (Student/Pro)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string | undefined>(undefined)

  // Text path refs (Free)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const recognitionManualStopRef = useRef(false)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const q = params.get('q')
    tierRef.current = params.get('tier') ?? 'free'

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

      if (tierRef.current === 'free') {
        // Free path: check SpeechRecognition support
        const SR = typeof window !== 'undefined'
          ? (window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
          : null
        if (!SR) {
          setPhase('error')
          setErrorMessage('Your browser does not support speech recognition. Please use Chrome, Safari, or Edge for free sessions.')
          return
        }
      } else {
        // Paid path: request mic via MediaDevices
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          micStreamRef.current = stream
        } catch {
          setPhase('error')
          setErrorMessage('Microphone access is required to record answers.')
          return
        }

        // Camera (optional, Coming Soon — will never be granted until feature launches)
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
      if (recognitionRef.current) {
        recognitionManualStopRef.current = true
        recognitionRef.current.stop()
      }
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
    if (tierRef.current === 'free') {
      startRecordingFree()
    } else {
      startRecordingAudio()
    }
  }

  // ── Free path: SpeechRecognition ─────────────────────────────────────────

  function startRecordingFree() {
    const SR = window.SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    recognitionManualStopRef.current = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      interimTranscriptRef.current = interim
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setPhase('error')
        setErrorMessage('Microphone access is required. Please allow microphone access in your browser settings.')
      }
      // network/aborted errors are non-fatal — onend will fire and restart
    }

    recognition.onend = () => {
      if (!recognitionManualStopRef.current) {
        // Browser auto-stopped (silence timeout) — restart to keep recording
        try { recognition.start() } catch { /* already stopped manually */ }
        return
      }
      // Manual stop — combine final + any remaining interim as fallback
      const transcript = (finalTranscriptRef.current + interimTranscriptRef.current).trim()
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      storedAnswersRef.current.push({
        type: 'text',
        transcript,
        duration: elapsed,
        questionId: questions[currentIndex].id,
        index: currentIndex + 1,
      })
      if (endingSessionRef.current) {
        finishAndProcess()
      } else {
        setPhase('between')
      }
    }

    recognition.start()
    recognitionRef.current = recognition
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

  // ── Audio path: MediaRecorder ─────────────────────────────────────────────

  function startRecordingAudio() {
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
        type: 'audio',
        blob,
        duration: elapsed,
        questionId: questions[currentIndex].id,
        index: currentIndex + 1,
      })
      if (endingSessionRef.current) {
        finishAndProcess()
      } else {
        setPhase('between')
      }
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

  // ── Shared stop ───────────────────────────────────────────────────────────

  function stopRecording() {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current)
    if (tierRef.current === 'free') {
      if (recognitionRef.current) {
        recognitionManualStopRef.current = true
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } else {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }

  function goNext() {
    setCurrentIndex(i => i + 1)
    setPhase('prep')
  }

  function skipPrep() {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    startRecording()
  }

  function endSession() {
    endingSessionRef.current = true
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    const isRecording = tierRef.current === 'free'
      ? recognitionRef.current !== null
      : mediaRecorderRef.current?.state === 'recording'
    if (isRecording) {
      stopRecording()
    } else {
      finishAndProcess()
    }
  }

  async function finishAndProcess() {
    setPhase('transcribing')
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!

    for (const answer of storedAnswersRef.current) {
      try {
        if (answer.type === 'audio') {
          const formData = new FormData()
          formData.append('audio', answer.blob, 'answer.webm')
          formData.append('session_id', sessionId)
          formData.append('question_id', String(answer.questionId))
          formData.append('answer_index', String(answer.index))
          formData.append('duration_seconds', String(answer.duration))
          await fetch('/api/session/transcribe', { method: 'POST', body: formData })
        } else {
          const transcript = answer.transcript || 'No response recorded.'
          const duration = Math.max(1, answer.duration)
          await fetch('/api/session/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              question_id: answer.questionId,
              answer_index: answer.index,
              duration_seconds: duration,
              transcript,
            }),
          })
        }
      } catch {
        // continue even if one answer fails
      }
    }

    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } finally {
      router.push('/session/report/' + sessionId)
    }
  }

  const isLastQuestion = currentIndex === questions.length - 1
  const q = questions[currentIndex]
  const timerPct = q ? (answerTimeLeft / q.time_limit_seconds) * 100 : 100

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Loading */}
        {phase === 'loading' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-white/70 text-lg">Loading your session...</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-white text-lg mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/session/setup')}
              className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all"
            >
              Back to Setup
            </button>
          </div>
        )}

        {/* Prep countdown */}
        {phase === 'prep' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-2 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-6 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <h2 className="text-2xl font-bold text-white mb-10 leading-snug">
              {q?.question_text}
            </h2>
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-black text-[#F9C125]"
              style={{ border: '3px solid rgba(249,193,37,0.4)', background: 'rgba(249,193,37,0.08)' }}
            >
              {prepCount}
            </div>
            <p className="text-white/50 text-sm mb-6">Recording starts automatically...</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={skipPrep}
                className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
              >
                Start Now
              </button>
              <button
                onClick={endSession}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Recording */}
        {phase === 'recording' && (
          <div style={glassCard} className="p-10 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-2 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-6 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <h2 className="text-2xl font-bold text-white mb-8 leading-snug">
              {q?.question_text}
            </h2>

            {/* Timer bar */}
            <div className="mb-2 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPct}%`,
                  backgroundColor: timerPct > 40 ? '#F9C125' : timerPct > 20 ? '#F97316' : '#EF4444',
                }}
              />
            </div>
            <p className="text-white/50 text-xs mb-8">{answerTimeLeft}s remaining</p>

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white/80 font-semibold text-sm">Recording</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={stopRecording}
                className="rounded-xl bg-[#F9C125] px-10 py-3 text-base font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
              >
                Done
              </button>
              <button
                onClick={endSession}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Between questions */}
        {phase === 'between' && (
          <div style={glassCard} className="p-10 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(249,193,37,0.15)', border: '2px solid rgba(249,193,37,0.4)' }}
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#F9C125]/60 text-xs uppercase tracking-widest mb-1 font-semibold">
              Answer {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-white text-xl font-bold mb-2">Answer recorded</p>
            <p className="text-white/50 text-sm mb-8">
              {isLastQuestion ? 'Your results will be ready shortly.' : 'Get ready for the next question.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              {isLastQuestion ? (
                <button
                  onClick={finishAndProcess}
                  className="rounded-xl bg-[#F9C125] px-10 py-3.5 text-base font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                >
                  See My Results
                </button>
              ) : (
                <>
                  <button
                    onClick={goNext}
                    className="rounded-xl bg-[#F9C125] px-10 py-3.5 text-base font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                  >
                    Next Question
                  </button>
                  <button
                    onClick={endSession}
                    className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
                  >
                    End Session
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Transcribing */}
        {phase === 'transcribing' && (
          <div style={glassCard} className="p-10 text-center">
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
            <p className="text-white/40 text-xs mt-6">Analysing all your answers...</p>
          </div>
        )}
      </div>

      {/* Camera corner — hidden until camera feature launches */}
      {cameraStream && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-2xl overflow-hidden shadow-xl w-28 h-20 sm:w-40 sm:h-28 z-50"
          style={{ border: '2px solid rgba(249,193,37,0.4)' }}
        >
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
