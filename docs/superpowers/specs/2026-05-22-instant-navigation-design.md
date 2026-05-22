# Instant Navigation Design

**Date:** 2026-05-22  
**Status:** Approved

## Problem

When a user clicks "Start Session" on the setup page, the app makes an API call to `/api/session/start` (creates a DB session row + selects questions) and holds the user on the setup page until the response arrives. Only then does it navigate to the briefing page. The user sees a loading button with no page transition, making clicks feel unregistered.

## Goal

Click any CTA → navigate instantly → destination shows a loading skeleton → content renders when the server is done. Zero time spent waiting on the source page.

## Scope

This design covers the setup → briefing navigation specifically, which is the primary bottleneck. Other CTAs (dashboard → setup, briefing → live) already use `<Link>` and are not blocking.

---

## Architecture

### Current Flow

```
[Setup] user clicks "Start Session"
  → setStarting(true)
  → fetch('/api/session/start', { difficulty })   ← user waits here
  → receive { sessionId, questions }
  → router.push('/session/briefing?session_id=X&q=id1,id2,...')
  → briefing loading.tsx skeleton
  → briefing page.tsx renders
```

### New Flow

```
[Setup] user clicks "Start Session"
  → router.push('/session/briefing?difficulty=easy')   ← instant
  → briefing loading.tsx skeleton (immediately visible)
  → briefing page.tsx server component runs:
      · validates user auth
      · checks quota (rate limit)
      · creates session row in DB
      · selects questions via selectAdaptiveQuestions()
      · on quota_exceeded → redirect('/dashboard?error=quota_exceeded')
      · on success → renders briefing UI with session_id + question data
  → "Start Interview" link includes session_id + q in URL as before
```

---

## Changes

### 1. `app/(protected)/session/setup/setup-client.tsx`

- Remove `fetch('/api/session/start')` and all associated state (`starting`, `error` related to API)
- Remove `handleStart` async function
- Replace the Start button's `onClick={handleStart}` with `router.push('/session/briefing?difficulty=${difficulty}')`
- The button is disabled while `difficulty === null || micPerm !== 'granted'` — this guard stays
- Remove the error message UI that was tied to API failures (quota exceeded message moves to dashboard)

### 2. `app/(protected)/session/briefing/page.tsx`

- Accept `difficulty` in `searchParams` instead of `session_id` + `q`
- Auth check stays (redirect to `/login` if no user)
- Extract session creation logic from `/api/session/start/route.ts` into a new shared server-side function `lib/session.ts → createSession(userId, difficulty)`:
  - Check `profiles.sessions_used_this_month` against tier limit
  - Return `{ error: 'quota_exceeded' }` if over limit
  - Call `selectAdaptiveQuestions()` from `lib/questions.ts`
  - Insert session row into `sessions` table
  - Increment `sessions_used_this_month` on profile
  - Return `{ sessionId, questions }` on success
- Briefing page calls `createSession()` and handles the result:
  - On `quota_exceeded`: `redirect('/dashboard?error=quota_exceeded')`
  - On success: render briefing UI
- Render briefing content with the real `session_id` and questions (same UI as today)
- "Start Interview" button link: `/session/live?session_id=${session_id}&q=${questionIds}`

### 3. `app/(protected)/dashboard/page.tsx`

- Read `error` from `searchParams`
- If `error === 'quota_exceeded'`, render a dismissible banner or inline message above the Start CTA explaining the quota is exhausted
- This replaces the error state that previously lived on the setup page

### 4. `app/(protected)/dashboard/loading.tsx`

- No change needed — skeleton already exists

### 5. `/api/session/start/route.ts`

- Keep the file but it is no longer called from the client
- Can be removed in a follow-up cleanup once the new flow is confirmed stable

---

## Error Handling

| Scenario | Current | New |
|---|---|---|
| Quota exceeded | Error message on setup page | Redirect to `/dashboard?error=quota_exceeded`, banner shown |
| Auth expired | API returns 401 | Server component redirects to `/login` |
| DB insert fails | Error message on setup page | Server component throws → Next.js error boundary |
| Invalid difficulty param | N/A | Server component redirects to `/session/setup` |

---

## What Does Not Change

- Briefing page UI (format card, what-to-expect cards, Start Interview button)
- Live session page — receives `session_id` + `q` from briefing link as before
- Report page — unchanged
- Dashboard → Setup navigation — already instant via `<Link>`
- Briefing → Live navigation — already instant via `<Link>`

---

## Testing

- Click "Start Session" with valid difficulty + mic permission → navigate to briefing skeleton instantly, briefing content loads with correct question format
- Click "Start Session" when quota is exhausted → redirect to dashboard, quota error banner visible
- Navigate directly to `/session/briefing?difficulty=easy` without auth → redirect to `/login`
- Navigate directly to `/session/briefing` without difficulty param → redirect to `/session/setup`
