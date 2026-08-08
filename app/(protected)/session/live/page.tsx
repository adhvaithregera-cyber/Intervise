'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mic } from 'lucide-react'

type LivePhase =
  | 'loading'
  | 'need_mic'          // iOS Safari: getUserMedia requires a direct user gesture per page
  | 'need_mic_blocked'  // Permission denied even after user gesture — blocked in OS/browser settings
  | 'prep'
  | 'reading'           // 8s: question shown clearly before recording begins
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
  const [prepCount, setPrepCount] = useState(3)
  const [readingCount, setReadingCount] = useState(8)
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [micErrorName, setMicErrorName] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [transcribeProgress, setTranscribeProgress] = useState({ current: 0, total: 0 })
  const [estimatedSecondsLeft, setEstimatedSecondsLeft] = useState(0)
  const estimateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [waitMsgIndex, setWaitMsgIndex] = useState(0)
  const waitMsgRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const WAIT_MSGS = ['Analysing your answers…', 'Almost there…', 'Crunching the numbers…', 'Just a moment…', 'Processing your session…', 'Hang tight…']

  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const readingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerStartTimeRef = useRef<number>(0)
  const storedAnswersRef = useRef<StoredAnswer[]>([])
  const endingSessionRef = useRef(false)
  const processingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string | undefined>(undefined)

  // Question blur: blurs immediately when recording starts; reveal button to unblur
  const [questionBlurred, setQuestionBlurred] = useState(false)
  const [questionRevealed, setQuestionRevealed] = useState(false)

  // Exit button (first 10s of Q1 only)
  const [showExitBtn, setShowExitBtn] = useState(false)

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
        // iOS Safari requires getUserMedia to be triggered by a direct user gesture.
        // Calling it automatically in useEffect after page navigation will fail.
        // Show a tap-to-enable screen instead of redirecting (which causes a loop).
        setPhase('need_mic')
        return
      }

      // Camera (optional, Coming Soon)
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
      if (readingTimerRef.current) clearInterval(readingTimerRef.current)
      if (answerTimerRef.current) clearInterval(answerTimerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'prep') return
    setPrepCount(3)
    let count = 3
    const id = setInterval(() => {
      count -= 1
      setPrepCount(count)
      if (count <= 0) {
        clearInterval(id)
        setPhase('reading')
      }
    }, 1000)
    prepTimerRef.current = id
    return () => clearInterval(id)
  }, [phase, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'reading') return
    setReadingCount(8)
    let count = 8
    const id = setInterval(() => {
      count -= 1
      setReadingCount(count)
      if (count <= 0) {
        clearInterval(id)
        startRecording()
      }
    }, 1000)
    readingTimerRef.current = id
    return () => clearInterval(id)
  }, [phase, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Exit button: show for first 10s after Q1 appears
  useEffect(() => {
    if (phase === 'prep' && currentIndex === 0) {
      setShowExitBtn(true)
      const id = setTimeout(() => setShowExitBtn(false), 10_000)
      return () => clearTimeout(id)
    }
  }, [phase, currentIndex])

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  function startRecording() {
    if (!micStreamRef.current || !questions[currentIndex]) return
    // Safari only supports audio/mp4 — must be checked explicitly.
    // webm/ogg are Chrome/Firefox; mp4 is Safari on macOS/iOS.
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
      ? 'audio/ogg;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : undefined
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(micStreamRef.current, mimeType ? { mimeType } : undefined)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      // Use the recorder's actual mimeType — never assume webm as fallback.
      // recorder.mimeType reflects what the browser actually recorded.
      const actualType = recorder.mimeType || mimeTypeRef.current || 'audio/mp4'
      const blob = new Blob(chunksRef.current, { type: actualType })
      const elapsed = Math.round((Date.now() - answerStartTimeRef.current) / 1000)
      storedAnswersRef.current.push({
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
    recorder.start(1000) // flush chunks every 1s — fixes Brave/Safari truncation on stop
    mediaRecorderRef.current = recorder
    answerStartTimeRef.current = Date.now()
    setPhase('recording')

    // Blur immediately when recording begins — user had 8s reading time before this
    setQuestionBlurred(true)
    setQuestionRevealed(false)

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
      mediaRecorderRef.current.stop()
    }
  }

  function goNext() {
    setQuestionBlurred(false)
    setQuestionRevealed(false)
    setCurrentIndex(i => i + 1)
    setPhase('prep')
  }

  function endSession() {
    endingSessionRef.current = true
    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    const isRecording = mediaRecorderRef.current?.state === 'recording'
    if (isRecording) {
      stopRecording()
    } else {
      finishAndProcess()
    }
  }

  async function requestMicPermission() {
    // Called from a button click — satisfies iOS Safari's user-gesture requirement.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream
      setPhase('prep')
    } catch (err) {
      const name = (err as DOMException)?.name ?? 'Unknown'
      console.error('[mic] getUserMedia failed:', name, err)
      setMicErrorName(name)
      setPhase('need_mic_blocked')
    }
  }

  async function handleExit() {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (sessionId) {
      await fetch('/api/session/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => { /* best-effort */ })
    }
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    window.location.href = '/dashboard'
  }

  async function finishAndProcess() {
    if (processingRef.current) return
    processingRef.current = true
    const answers = storedAnswersRef.current
    const total = answers.length
    const SECS_PER_ANSWER = 18
    const initialEstimate = total * SECS_PER_ANSWER

    setTranscribeProgress({ current: 0, total })
    setEstimatedSecondsLeft(initialEstimate)
    setPhase('transcribing')

    estimateTimerRef.current = setInterval(() => {
      setEstimatedSecondsLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    setWaitMsgIndex(0)
    waitMsgRef.current = setInterval(() => {
      setWaitMsgIndex(prev => (prev + 1) % WAIT_MSGS.length)
    }, 3000)

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')!

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]
      const ext = answer.blob.type.includes('mp4') ? 'mp4' : answer.blob.type.includes('ogg') ? 'ogg' : 'webm'

      // Retry up to 3 times on transient failures (network errors, 5xx, 429).
      // 409 = duplicate already stored, treat as success.
      // 4xx other than 429 = permanent error, no point retrying.
      let submitted = false
      for (let attempt = 0; attempt < 3 && !submitted; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 3000))
        try {
          const formData = new FormData()
          formData.append('audio', answer.blob, `answer.${ext}`)
          formData.append('session_id', sessionId)
          formData.append('question_id', String(answer.questionId))
          formData.append('answer_index', String(answer.index))
          formData.append('duration_seconds', String(answer.duration))
          const res = await fetch('/api/session/transcribe', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(310_000), // slightly above server maxDuration
          })
          if (res.ok || res.status === 409) {
            submitted = true
          } else if (res.status !== 429 && res.status < 500) {
            // Permanent client error — no retry
            break
          }
          // 429 or 5xx → retry after delay
        } catch {
          // Network error or timeout — retry
        }
      }
      setTranscribeProgress({ current: i + 1, total })
    }

    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } finally {
      if (estimateTimerRef.current) clearInterval(estimateTimerRef.current)
      if (waitMsgRef.current) clearInterval(waitMsgRef.current)
      router.push('/session/report/' + sessionId)
    }
  }

  const isLastQuestion = currentIndex === questions.length - 1
  const q = questions[currentIndex]
  const timerPct = q ? (answerTimeLeft / q.time_limit_seconds) * 100 : 100

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-2xl">

        {/* Loading */}
        {phase === 'loading' && (
          <div style={glassCard} className="p-8 text-center">
            <p className="text-white/70 text-lg">Loading your session...</p>
          </div>
        )}

        {/* Need mic — tap to enable (iOS Safari requires user gesture) */}
        {phase === 'need_mic' && (
          <div style={glassCard} className="p-8 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(249,193,37,0.12)', border: '2px solid rgba(249,193,37,0.4)' }}
            >
              <Mic className="h-7 w-7 text-[#F9C125]" />
            </div>
            <p className="text-white text-lg font-bold mb-2">Microphone access needed</p>
            <p className="text-white/60 text-sm mb-6">
              Tap the button below to enable your microphone and start the session.
            </p>
            <button
              onClick={requestMicPermission}
              className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/25"
            >
              Enable Microphone
            </button>
          </div>
        )}

        {/* Mic blocked in OS/browser settings */}
        {phase === 'need_mic_blocked' && (
          <div style={glassCard} className="p-8 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)' }}
            >
              <Mic className="h-7 w-7 text-red-400" />
            </div>
            {micErrorName === 'NotReadableError' || micErrorName === 'TrackStartError' ? (
              <>
                <p className="text-white text-lg font-bold mb-2">Microphone in use</p>
                <p className="text-white/60 text-sm mb-4">Another app (Teams, Zoom, Discord, etc.) has exclusive control of your microphone.</p>
                <p className="text-white/40 text-xs mb-6">Close or mute the other app, then tap Try Again.</p>
              </>
            ) : micErrorName === 'NotFoundError' ? (
              <>
                <p className="text-white text-lg font-bold mb-2">No microphone found</p>
                <p className="text-white/60 text-sm mb-4">Make sure a microphone is plugged in and recognised by your device.</p>
                <p className="text-white/40 text-xs mb-6">Error: {micErrorName}</p>
              </>
            ) : (
              <>
                <p className="text-white text-lg font-bold mb-2">Microphone blocked</p>
                <p className="text-white/60 text-sm mb-1">Your browser or OS is blocking microphone access.</p>
                <p className="text-white/40 text-xs mb-6">
                  <strong className="text-white/60">Chrome / Edge:</strong> lock icon in address bar → Microphone → Allow → reload.
                  <br />
                  <strong className="text-white/60">Windows:</strong> Settings → Privacy &amp; Security → Microphone → allow browser apps.
                  <br />
                  <strong className="text-white/60">iPhone:</strong> Settings → Privacy &amp; Security → Microphone → enable Safari.
                  {micErrorName && <><br /><span className="text-white/25">Error: {micErrorName}</span></>}
                </p>
              </>
            )}
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/25"
              >
                Reload Page
              </button>
              <button
                onClick={requestMicPermission}
                className="rounded-xl border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={glassCard} className="p-8 text-center">
            <p className="text-white text-lg mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/session/setup')}
              className="rounded-xl bg-[#F9C125] px-8 py-3 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all"
            >
              Back to Setup
            </button>
          </div>
        )}

        {/* Prep countdown — blank breathing space, no question shown */}
        {phase === 'prep' && (
          <div style={glassCard} className="p-6 sm:p-8 text-center">
            <p className="text-white/35 text-xs uppercase tracking-[0.2em] mb-6 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl font-black text-[#F9C125]"
              style={{ border: '3px solid rgba(249,193,37,0.4)', background: 'rgba(249,193,37,0.08)' }}
            >
              {prepCount}
            </div>
            <p className="text-white/40 text-sm">Take a breath...</p>
            {showExitBtn && (
              <div className="mt-6">
                <button
                  onClick={handleExit}
                  className="text-xs text-white/30 hover:text-white/55 transition-colors underline underline-offset-2"
                >
                  Exit session
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reading phase — question shown clearly for 8s before recording starts */}
        {phase === 'reading' && (
          <div style={glassCard} className="p-6 sm:p-8 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-1.5 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-4 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white leading-snug">
                {q?.question_text}
              </h2>
            </div>
            <div className="mb-1 h-1 w-full rounded-full bg-white/10">
              <div
                className="h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(readingCount / 8) * 100}%`, backgroundColor: 'rgba(249,193,37,0.6)' }}
              />
            </div>
            <p className="text-white/40 text-xs mb-4">
              Recording starts in {readingCount}s · question will blur
            </p>
            {showExitBtn && (
              <div className="mt-2">
                <button
                  onClick={handleExit}
                  className="text-xs text-white/30 hover:text-white/55 transition-colors underline underline-offset-2"
                >
                  Exit session
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recording */}
        {phase === 'recording' && (
          <div style={glassCard} className="p-6 sm:p-8 text-center">
            <p className="text-[#F9C125]/70 text-xs uppercase tracking-[0.2em] mb-1.5 font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </p>
            {q && (
              <p className="text-xs text-white/50 mb-4 font-medium">
                {q.answer_format.split(' ')[0]} · {q.category_name}
              </p>
            )}
            <div className="mb-5">
              <h2
                className="text-xl font-bold text-white leading-snug transition-all duration-500"
                style={{
                  filter: questionBlurred && !questionRevealed ? 'blur(6px)' : 'none',
                  userSelect: questionBlurred && !questionRevealed ? 'none' : 'auto',
                }}
              >
                {q?.question_text}
              </h2>
              {questionBlurred && !questionRevealed && (
                <button
                  onClick={() => setQuestionRevealed(true)}
                  className="mt-2 text-xs text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Reveal question
                </button>
              )}
            </div>

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
            <p className="text-white/50 text-xs mb-5">{answerTimeLeft}s remaining</p>

            <div className="flex items-center justify-center gap-3 mb-5">
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
          <div style={glassCard} className="p-6 sm:p-8 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(249,193,37,0.15)', border: '2px solid rgba(249,193,37,0.4)' }}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#F9C125]/60 text-xs uppercase tracking-widest mb-1 font-semibold">
              Answer {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-white text-xl font-bold mb-1.5">Answer recorded</p>
            <p className="text-white/50 text-sm mb-6">
              {isLastQuestion ? 'Your results will be ready shortly.' : 'Get ready for the next question.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              {isLastQuestion ? (
                <button
                  onClick={finishAndProcess}
                  className="rounded-xl bg-[#F9C125] px-10 py-3 text-base font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                >
                  See My Results
                </button>
              ) : (
                <>
                  <button
                    onClick={goNext}
                    className="rounded-xl bg-[#F9C125] px-10 py-3 text-base font-bold text-[#080d1a] hover:brightness-110 transition-all shadow-lg shadow-[#F9C125]/20"
                  >
                    Next Question
                  </button>
                  <button
                    onClick={endSession}
                    className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
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
          <div style={glassCard} className="p-8 text-center">
            <div className="generating-loader-wrapper">
              <p className="text-white text-base font-semibold tracking-wide">{WAIT_MSGS[waitMsgIndex]}</p>
              <div className="generating-loader-bar" />
            </div>
            <p className="text-white/60 text-sm mt-5">
              {transcribeProgress.total > 0
                ? `Answer ${Math.min(transcribeProgress.current + 1, transcribeProgress.total)} of ${transcribeProgress.total}`
                : 'Preparing…'}
            </p>
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
