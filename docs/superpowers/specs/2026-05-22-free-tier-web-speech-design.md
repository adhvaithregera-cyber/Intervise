# Free Tier Web Speech API — Design Spec

## Goal

Eliminate AssemblyAI and Claude API costs for Free users by using the browser's built-in `SpeechRecognition` API for transcription and skipping AI feedback entirely. Student and Pro users are unaffected.

## Architecture

Two completely separate recording paths, selected at session start based on tier:

```
Free user
  └─ SpeechRecognition (browser, real-time streaming)
       └─ POST /api/session/transcribe  { transcript, duration_seconds, ... }
            └─ detectFillers() + WPM calc  (lib/analysis.ts, already exists)
            └─ Save to DB  (no AssemblyAI, no Claude)

Student / Pro user  (unchanged)
  └─ MediaRecorder → audio blob
       └─ POST /api/session/transcribe  { audio, ... }
            └─ AssemblyAI transcription
            └─ detectFillers() + WPM calc
            └─ Claude feedback (STAR, ideal answer, grammar)
            └─ Save to DB
```

## Files changed

### 1. `app/(protected)/session/briefing/page.tsx`
- Fetch `profile.tier` from DB (already fetches profile for quota check)
- Append `&tier=<tier>` to the Start Interview URL so the live page can branch without an extra DB call

### 2. `app/(protected)/session/live/page.tsx`
- Read `tier` from `URLSearchParams` on mount
- **Free path:**
  - No `MediaRecorder`, no audio chunks, no `micStreamRef` for recording (mic still needed for permission check only)
  - Create `SpeechRecognition` instance (`window.SpeechRecognition || window.webkitSpeechRecognition`)
  - `continuous: true`, `interimResults: true`, `lang: 'en-US'`
  - Accumulate `finalTranscript` string from `onresult` events (use `result.isFinal` flag)
  - On "Done" / timer end: stop recognition, POST `{ transcript, duration_seconds, session_id, question_id, answer_index }` as JSON to `/api/session/transcribe`
  - If `SpeechRecognition` not available: show error state — "Intervise requires Chrome, Safari, or Edge for free sessions."
- **Student/Pro path:** existing `MediaRecorder` flow, no changes

### 3. `app/api/session/transcribe/route.ts`
- Detect request type:
  - `Content-Type: application/json` → transcript text path (Free)
  - `Content-Type: multipart/form-data` → audio file path (Student/Pro)
- **Text path:**
  - Parse `{ session_id, question_id, answer_index, duration_seconds, transcript }`
  - Validate with Zod
  - Fetch user tier from DB — if NOT free, reject (prevents tier bypass)
  - Run `detectFillers(transcript)` and compute `wpm = Math.round((wordCount / duration_seconds) * 60)`
  - Save answer row: `transcription_failed: false`, `transcript`, `filler_count`, `filler_breakdown`, `wpm`, no `star_scores`, no `ideal_answer`, no `grammar_feedback`
- **Audio path (Student/Pro):** existing flow unchanged; will add Claude feedback in M4

### 4. `lib/analysis.ts` — no changes needed

## Fallback behaviour

| Browser | Web Speech API | Result |
|---|---|---|
| Chrome | Supported | Works |
| Safari | Supported | Works |
| Edge | Supported | Works |
| Firefox | Not supported | Error state shown, user prompted to switch browser |

## Tier validation

Tier is **always read from the database** in the API route. The `tier` URL param passed to the live page is only used for the client-side UI branch (which recording method to show). A free user cannot access the AssemblyAI or Claude path by tampering with the URL param — the server rejects it.

## Cost impact

| User type | Before | After |
|---|---|---|
| Free | ~$0.08/session | ~$0.003/session |
| Student / Pro | ~$0.08/session | ~$0.08/session (unchanged) |

## Out of scope

- AI feedback for Student/Pro (M4)
- Shareable scorecard (M8)
- Any changes to the report page UI for free users
