// Server-only module — relies on ASSEMBLYAI_API_KEY env var (never NEXT_PUBLIC_)

export interface TranscriptionResult {
  text: string
  words: Array<{ text: string; start: number; end: number }>
  audioDuration: number // seconds
}

export interface TranscriptionError {
  failed: true
  reason: string
}

export function isTranscriptionError(
  r: TranscriptionResult | TranscriptionError
): r is TranscriptionError {
  return (r as TranscriptionError).failed === true
}

const BASE_URL = 'https://api.assemblyai.com/v2'
const POLL_INTERVAL_MS = 1500
const MAX_POLLS = 80 // 80 × 1500ms = 120 seconds

function authHeaders(): Record<string, string> {
  return {
    Authorization: process.env.ASSEMBLYAI_API_KEY ?? '',
  }
}

async function uploadAudio(
  audioBlob: Blob
): Promise<{ upload_url: string } | TranscriptionError> {
  let response: Response
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/octet-stream',
      },
      body: arrayBuffer,
    })
  } catch {
    return { failed: true, reason: 'upload_failed' }
  }

  if (!response.ok) {
    return { failed: true, reason: 'upload_failed' }
  }

  const data = (await response.json()) as { upload_url: string }
  return data
}

async function requestTranscription(
  audioUrl: string
): Promise<{ id: string } | TranscriptionError> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_url: audioUrl }),
    })
  } catch {
    return { failed: true, reason: 'request_failed' }
  }

  if (!response.ok) {
    return { failed: true, reason: 'request_failed' }
  }

  const data = (await response.json()) as { id: string }
  return data
}

type AssemblyAITranscript = {
  status: 'queued' | 'processing' | 'completed' | 'error'
  text: string | null
  words: Array<{ text: string; start: number; end: number }> | null
  audio_duration: number | null
  error: string | null
}

async function pollForCompletion(
  transcriptId: string
): Promise<TranscriptionResult | TranscriptionError> {
  for (let poll = 0; poll < MAX_POLLS; poll++) {
    await new Promise<void>(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    let response: Response
    try {
      response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
        headers: authHeaders(),
      })
    } catch {
      // Transient network error — continue polling
      continue
    }

    if (response.status === 429) {
      return { failed: true, reason: 'rate_limited' }
    }

    if (!response.ok) {
      // Other HTTP error — continue polling
      continue
    }

    const transcript = (await response.json()) as AssemblyAITranscript

    if (transcript.status === 'completed') {
      return {
        text: transcript.text ?? '',
        words: transcript.words ?? [],
        audioDuration: transcript.audio_duration ?? 0,
      }
    }

    if (transcript.status === 'error') {
      return {
        failed: true,
        reason: transcript.error ?? 'transcription_failed',
      }
    }

    // 'queued' or 'processing' — keep polling
  }

  return { failed: true, reason: 'timeout' }
}

export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptionResult | TranscriptionError> {
  const uploadResult = await uploadAudio(audioBlob)
  if (isTranscriptionError(uploadResult)) return uploadResult

  const transcriptRequest = await requestTranscription(uploadResult.upload_url)
  if (isTranscriptionError(transcriptRequest)) return transcriptRequest

  return pollForCompletion(transcriptRequest.id)
}
