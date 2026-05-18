'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  // Initialization
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
      // Re-sort to match URL order
      const sorted = questionIds.map(id => data.find(q => q.id === id)!).filter(Boolean)
      setQuestions(sorted as Question[])

      // Request mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
      } catch {
        setPhase('error')
        setErrorMessage('Microphone access is required to record answers.')
        return
      }

      // Check camera (non-blocking)
      try {
        const perm = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (perm.state === 'granted') {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setCameraStream(camStream)
          cameraStreamRef.current = camStream
        }
      } catch {
        // camera is optional — silently skip
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

  // Camera video binding
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
      mediaRecorderRef.current.stop() // triggers onstop → submitAnswer
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

  return (
    <>
      {/* Phase content */}
      {phase === 'loading' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[#8697C4]">Loading your session...</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-red-500 mb-4">{errorMessage}</p>
          <Button variant="outline" onClick={() => window.location.href = '/session/setup'}>Back to Setup</Button>
        </div>
      )}

      {phase === 'prep' && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-[#8697C4] text-sm uppercase tracking-widest mb-4">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h2 className="text-2xl font-semibold text-[#3D52A0] mb-8">
            {questions[currentIndex]?.question_text}
          </h2>
          <div className="text-6xl font-bold text-[#3D52A0] mb-4">{prepCount}</div>
          <p className="text-[#8697C4]">Recording starts automatically...</p>
        </div>
      )}

      {phase === 'recording' && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-[#8697C4] text-sm uppercase tracking-widest mb-4">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h2 className="text-2xl font-semibold text-[#3D52A0] mb-8">
            {questions[currentIndex]?.question_text}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500 font-medium">Recording</span>
            <span className="text-[#8697C4] ml-4">{answerTimeLeft}s remaining</span>
          </div>
          <Button variant="outline" onClick={stopRecording}>Done</Button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[#8697C4]">Analysing your answer...</p>
        </div>
      )}

      {phase === 'between' && (
        <div className="max-w-2xl mx-auto py-16">
          <h2 className="text-2xl font-semibold text-[#3D52A0] mb-6 text-center">
            Answer {currentIndex + 1} complete
          </h2>
          {lastResult && !lastResult.transcriptionFailed ? (
            <Card className="mb-6 p-6">
              <div className="flex gap-8 justify-center">
                <div className="text-center">
                  <p className="text-sm text-[#8697C4] mb-1">Speaking pace</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    lastResult.wpm && lastResult.wpm >= 130 && lastResult.wpm <= 160
                      ? 'text-green-600'
                      : 'text-amber-500'
                  )}>
                    {lastResult.wpm ?? '—'} wpm
                  </p>
                  <p className="text-xs text-[#8697C4]">Target: 130–160 wpm</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#8697C4] mb-1">Filler words</p>
                  <p className="text-2xl font-bold text-[#3D52A0]">{lastResult.fillerCount ?? '—'}</p>
                  {lastResult.fillerBreakdown && Object.keys(lastResult.fillerBreakdown).length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-center mt-1">
                      {Object.entries(lastResult.fillerBreakdown).map(([word, count]) => (
                        <Badge key={word} variant="gray">{word} ×{count}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : lastResult?.transcriptionFailed ? (
            <Card className="mb-6 p-6 text-center">
              <Badge variant="amber">Transcription unavailable</Badge>
              <p className="text-[#8697C4] mt-2 text-sm">
                We couldn&apos;t process this answer. You can still continue.
              </p>
            </Card>
          ) : null}
          <div className="text-center">
            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => { setCurrentIndex(i => i + 1); setPhase('prep') }}
              >
                Next Question
              </Button>
            ) : (
              <Button variant="primary" onClick={completeSession}>
                See My Results
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === 'completing' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[#8697C4]">Calculating your results...</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[#8697C4]">Redirecting to your results...</p>
        </div>
      )}

      {/* Camera corner — always rendered when stream is available */}
      {cameraStream && (
        <div className="fixed bottom-6 right-6 rounded-2xl overflow-hidden border-2 border-[#ADBBDA] shadow-lg w-40 h-28 z-50">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
    </>
  )
}
