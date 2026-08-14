# Intervise Security & Bug Audit — 2026-08-02

**Scope:** All API routes, auth middleware, AI integrations, DB migrations, session flow, dashboard  
**Depth:** Deep (cross-file, call-chain tracing)  
**Files reviewed:** 25+

---

## Summary

The codebase has a solid security foundation: every API route calls `supabase.auth.getUser()` before processing, inputs are Zod-validated, Razorpay webhooks verify HMAC signatures with timing-safe comparison, and the DB has layered defences (RLS + SECURITY DEFINER triggers + atomic RPCs). The main risk surface is a **privilege-escalation hole in the quota-decrement RPC**, several **exploitable divergences between migration versions** of the session-creation function, an **information exposure** in the dashboard, and a **missing auth check** on the TTS endpoint.

---

## CRITICAL Issues

### CR-01: `decrement_sessions_used` RPC accepts arbitrary user_id — any user can drain another user's quota

**File:** `supabase/migrations/021_decrement_sessions_used.sql:4-13`  
**Also:** `app/api/session/abandon/route.ts:37`

The function signature is:
```sql
CREATE OR REPLACE FUNCTION public.decrement_sessions_used(p_user_id UUID)
```
It accepts a caller-supplied UUID and runs `UPDATE profiles SET sessions_used_this_month = GREATEST(0, sessions_used_this_month - 1) WHERE id = p_user_id`. There is **no `REVOKE EXECUTE … FROM anon`** and **no `REVOKE EXECUTE … FROM authenticated`** in migration 021 or any subsequent migration (verified by grep).

This means any authenticated user can call this RPC directly via the Supabase client SDK and pass any other user's UUID, reducing that user's `sessions_used_this_month` to 0, effectively resetting their quota. The old `increment_sessions_used` was explicitly dropped in migration 006 for exactly this reason.

The API route (`abandon`) does pass `user.id` (correctly), but the RPC itself has no server-side ownership check — `auth.uid()` is never verified inside the function body.

**Fix:** Replace the externally-callable `p_user_id` parameter with an internal `auth.uid()` lookup, identical to how `create_session_atomic` is structured:

```sql
CREATE OR REPLACE FUNCTION public.decrement_sessions_used()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING errcode = 'P0401';
  END IF;
  UPDATE public.profiles
  SET sessions_used_this_month = GREATEST(0, sessions_used_this_month - 1)
  WHERE id = v_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.decrement_sessions_used() FROM anon;
```

Update the API route call to `.rpc('decrement_sessions_used')` (no argument).

---

### CR-02: Migration version skew — `create_session_atomic` in migration 006 allows Student users to attempt 'mixed' difficulty

**File:** `supabase/migrations/006_rls_and_function_hardening.sql:153-155`  
**vs:** `supabase/migrations/015_fix_difficulty_constraint_and_rpc.sql:71-73`

Migration 006 (applied earlier) only blocks Student from `hard`:
```sql
if v_tier = 'student' and p_difficulty = 'hard' then
  raise exception 'difficulty_not_allowed';
```

Migration 015 (applied later) correctly blocks Student from both `hard` **and** `mixed`:
```sql
if v_tier = 'student' and p_difficulty in ('hard', 'mixed') then
  raise exception 'difficulty_not_allowed';
```

The `CREATE OR REPLACE` in 015 should overwrite 006, so if migrations ran in order this is safe. However, the discrepancy means if 015 is ever skipped or rolled back (during local dev or a migration reset), Students regain access to 'mixed'. There is no guard in the API layer (`app/api/session/start/route.ts`) — it passes the difficulty straight to `createSession()` which calls the RPC. The session creation code in `lib/session.ts` does not independently validate difficulty-by-tier before calling the RPC.

**Fix:** Add an explicit server-side guard in `lib/session.ts` before the RPC call so the application layer is not solely dependent on the DB function version:

```typescript
if (profile.tier === 'student' && (difficulty === 'hard' || difficulty === 'mixed')) {
  return { error: 'difficulty_not_allowed' }
}
if (profile.tier === 'free' && difficulty !== 'easy') {
  return { error: 'difficulty_not_allowed' }
}
```

---

### CR-03: TTS endpoint has no tier check — any authenticated user can invoke ElevenLabs proxy

**File:** `app/api/tts/route.ts:12-19`

The route authenticates the user and applies a rate limit (50/hour), but does not verify the user's tier before proxying to ElevenLabs. Per CLAUDE.md, TTS was "considered and rejected" as a cost item, meaning it should not be accessible at all in the current product — yet the endpoint exists and accepts any authenticated user. A Free user who discovers the endpoint URL can make 50 TTS calls per hour per warm Vercel instance, each of which costs ~$0.13 (the exact figure cited in CLAUDE.md as making Pro unprofitable).

Additionally, the rate limiter is in-memory and resets on cold starts (acknowledged in `lib/ratelimit.ts`), so on Vercel serverless, multiple concurrent warm instances multiply this cap.

**Fix:** Either add a hard `return NextResponse.json({ error: 'TTS not available' }, { status: 404 })` at the top of the handler to disable it entirely (consistent with the product decision), or gate it behind a `profile.tier === 'pro'` check if you intend to enable it for Pro users in the future.

---

### CR-04: `question_id` is validated by category but NOT by the session's assigned question list

**File:** `app/api/session/transcribe/route.ts:116-139`

The transcribe route verifies that `question_id` belongs to a category allowed for the session's tier. However, it does **not** verify that the specific `question_id` was among the questions originally assigned to this session. This allows a user to:
1. Start a session (gets 5 questions assigned)
2. Submit answers for arbitrary questions not in their session — any question from allowed categories

Since `question_history` is populated at session start (in `lib/session.ts:118`) based on the selected questions, this also means question history is not accurately tracking what was actually answered during feedback.

More seriously, a user on the Free tier is limited to categories 1 and 2. But if Pro or Student questions exist in categories 1-2 (just at higher difficulty), a Free user could submit answers for `hard` difficulty questions in those categories by guessing/enumerating integer `question_id` values.

**Fix:** At session creation time, store the list of assigned `question_id`s in the sessions table (or in a `session_questions` join table). In the transcribe route, verify that the submitted `question_id` is in that list:

```typescript
// After fetching session:
const { data: assignedQuestions } = await supabase
  .from('session_questions')
  .select('question_id')
  .eq('session_id', session_id)
const allowed = new Set(assignedQuestions?.map(q => q.question_id) ?? [])
if (!allowed.has(question_id)) {
  return NextResponse.json({ error: 'Question not assigned to this session' }, { status: 403 })
}
```

---

## HIGH Issues

### HI-01: In-memory rate limiter is per-instance and resets on cold start — not a reliable guard for expensive operations

**File:** `lib/ratelimit.ts:1-12` (warning comment present but downstream code treats limits as reliable)

The comment on line 7-8 acknowledges this: "Cold starts reset the window." On Vercel's serverless architecture, a single user can exceed the rate limits by triggering requests on multiple concurrent instances. For `transcribe` (100/hour per user), this means a user could realistically make hundreds of OpenAI + AssemblyAI calls before any single warm instance hits its limit.

The `transcribeSession` limit (15/session) partially mitigates this because the per-session key `session:${session_id}:transcribe` would hit 15 on each separate instance but across instances it's unbounded.

**Fix:** For the high-cost endpoints (`/api/session/transcribe` and `/api/dashboard/weakness-summary`), replace the in-memory limiter with an Upstash Redis rate limiter using `@upstash/ratelimit`. The existing `checkRateLimit` call signature is clean enough to swap the implementation without changing callers.

---

### HI-02: Session report page fetches all answers without verifying session ownership at query time

**File:** `app/(protected)/session/report/[id]/page.tsx:77-83`

```typescript
const [{ data: session }, { data: answers }, { data: profile }] = await Promise.all([
  supabase.from('sessions').select('*').eq('id', sessionId).single(),
  supabase.from('answers').select('*').eq('session_id', sessionId).order('answer_index'),
  supabase.from('profiles').select('tier').eq('id', user.id).single(),
])
if (!session || session.user_id !== user.id) notFound()
```

The answers query runs **in parallel** with the session fetch, before the ownership check on line 83 is evaluated. If RLS is correctly configured on the `answers` table (which it is — `answers` are only selectable when `session.user_id = auth.uid()`), this is safe in production. However, if RLS is ever misconfigured or disabled, answers from another user's session leak before the `notFound()` guard fires.

Additionally, the ownership check `session.user_id !== user.id` is done in application code rather than in the query (`WHERE user_id = user.id`). This is defence-in-depth missing one layer.

**Fix:** Add `eq('user_id', user.id)` to the sessions query and change the answers query to run after the ownership check:

```typescript
const { data: session } = await supabase
  .from('sessions').select('*').eq('id', sessionId).eq('user_id', user.id).single()
if (!session) notFound()
const { data: answers } = await supabase
  .from('answers').select('*').eq('session_id', sessionId).order('answer_index')
```

---

### HI-03: `live/page.tsx` fetches questions client-side using the question IDs from URL params — no server-side validation

**File:** `app/(protected)/session/live/page.tsx:82-103`

```typescript
const params = new URLSearchParams(window.location.search)
const q = params.get('q')
const questionIds = q.split(',').map(Number)
const { data } = await supabase.from('questions').select('*').in('id', questionIds)
```

The question IDs are taken directly from the URL query string without any validation that:
1. They are non-negative integers (`.map(Number)` on a non-numeric string produces `NaN`)
2. They correspond to questions actually assigned to the session
3. The session belongs to this user

A user could manually craft a URL like `/session/live?session_id=...&q=1,2,3,999` and load arbitrary questions for display during recording (though the API route does re-validate on submission, the user-facing question text would be from unassigned questions).

The `NaN` case (`q.split(',').map(Number)` where a segment is non-numeric) is passed to `.in('id', questionIds)` — Supabase will reject the query or return no rows, causing a confusing error screen.

**Fix:** Validate that all parsed IDs are positive integers before the DB call:

```typescript
const questionIds = q.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0)
if (questionIds.length === 0) {
  setPhase('error'); setErrorMessage('Invalid session parameters.'); return
}
```

---

### HI-04: `refreshWeaknessSummary` in `complete/route.ts` has no per-user rate limit for Pro users

**File:** `app/api/session/complete/route.ts:141`

```typescript
refreshWeaknessSummary(user.id).catch(...)
```

This is a fire-and-forget call to Gemini every time a Pro user completes a session. The `complete` endpoint itself has a rate limit of 25/hour per user, but that limit is for the overall session-complete endpoint. If a Pro user hammers the complete endpoint (25 times/hour), they trigger 25 Gemini calls per hour — 25× the `weaknessSummary` limit of 5/hour that the `dashboard/weakness-summary` route enforces.

The `refreshWeaknessSummary` function has no rate limit of its own, meaning the call in `complete/route.ts` bypasses the rate limit entirely.

**Fix:** Add a `checkRateLimit` call inside `refreshWeaknessSummary` before calling `generateWeaknessSummary`:

```typescript
const rl = checkRateLimit(`${userId}:weakness-summary`, RATE_LIMITS.weaknessSummary)
if (!rl.allowed) return
```

---

## MEDIUM Issues

### ME-01: Dashboard leaks a debug `console.log` with session IDs and metric data to server logs

**File:** `app/(protected)/dashboard/page.tsx:164`

```typescript
console.log(`[chart-debug] session ${s.id.slice(0,8)}: feedbacks=${st.feedbacks.length}, m=`, m)
```

This fires for **every session** of every Student/Pro user on every dashboard load. It logs partial session UUIDs and computed metric objects to Vercel function logs. Vercel logs are accessible to team members and third-party log aggregators. This is a debug artifact that should have been removed before production.

**Fix:** Remove the `console.log` call entirely.

---

### ME-02: `onboarding/route.ts` does not prevent re-submission after `onboarding_complete = true`

**File:** `app/api/onboarding/route.ts:41-54`

The route sets `onboarding_complete: true` but does not check whether it is already `true` before accepting the update. This means a user can call the endpoint repeatedly (up to the rate limit of 10/10min) to overwrite any onboarding field with arbitrary values. Combined with the middleware check that only redirects users who have NOT completed onboarding, this is exploitable for profile spam.

The `profileUpdateSchema` at least limits string lengths, but a user can change their `role_type`, `biggest_weakness`, etc. after onboarding indefinitely via this endpoint — which was presumably meant only for the one-time onboarding flow.

**Fix:** Either check and reject re-submission when `onboarding_complete` is already true, or consolidate onboarding edits into the existing `PATCH /api/profile` endpoint with its stricter schema.

---

### ME-03: `answer_index` validation allows 1–10 but session design uses exactly 5 questions

**File:** `lib/validation.ts:122-123`

```typescript
answer_index: z.string()
  .regex(/^[1-9]\d*$/, '...')
  .transform(Number)
  .pipe(z.number().int().min(1).max(10)),
```

The `answer_index` upper bound is 10, but all tiers use exactly 5 questions. A user can submit `answer_index: 6` through `answer_index: 10` as extra answers for the same session, bypassing the `existing` check (line 142-151 in `transcribe/route.ts`). These extra answers are stored in the DB and included in the `calculateGrade` function via the `answers ?? []` fetch, potentially boosting the grade by adding more AI-scored entries.

**Fix:** Change the max to 5 (matching `TIER_QUESTION_COUNT`):

```typescript
.pipe(z.number().int().min(1).max(5))
```

Or fetch the expected question count from the session and validate dynamically.

---

### ME-04: `duration_seconds` is fully client-controlled — no server-side cap

**File:** `lib/validation.ts:126-129`, `app/api/session/transcribe/route.ts:89`

The `duration_seconds` field is submitted by the client and used directly in WPM calculation and AI scoring. There is no server-side maximum — a user could submit `duration_seconds: 999999`, making their WPM appear tiny (benefiting some rubrics) or gaming the duration scoring bands.

The actual audio file duration is never validated against the submitted `duration_seconds`.

**Fix:** Add a reasonable server-side cap in the validation schema. Given 15 MB max audio size and ~128 kbps, that's roughly 16 minutes maximum. A sane cap is 3600 (1 hour) for safety, but realistically sessions are 5 questions × 3 minutes = 900 seconds maximum:

```typescript
duration_seconds: z.string()
  .regex(/^[1-9]\d*$/, '...')
  .transform(Number)
  .pipe(z.number().int().min(1).max(900)),
```

---

### ME-05: Webhook IP rate limiting uses `x-forwarded-for` without validation — susceptible to IP spoofing

**File:** `app/api/payments/webhook/route.ts:14`

```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
const rl = checkRateLimit(`webhook:${ip}`, RATE_LIMITS.webhook)
```

`x-forwarded-for` is a client-controlled header in many environments. If Vercel does not strip/sanitise this header (it doesn't on free/hobby plans; only the outermost proxy value is reliable on Pro), an attacker can set `X-Forwarded-For: 1.2.3.4, 5.6.7.8` and rotate through unlimited IPs, completely bypassing the 60-req/min cap.

The HMAC signature check that follows is the real guard here, but if the secret is ever compromised the IP limit provides no backstop.

**Fix:** Use `request.ip` (Vercel Edge) or the rightmost `x-forwarded-for` entry (which is injected by the infrastructure and not spoofable) rather than the leftmost/first value.

---

### ME-06: `weakness_summary` is written to `profiles` via the user-auth client, not the service client

**File:** `app/api/dashboard/weakness-summary/route.ts:72-78`

```typescript
await supabase  // ← user-scoped client
  .from('profiles')
  .update({ weakness_summary: summary, ... })
  .eq('id', user.id)
```

The `profiles` table has a `lock_protected_profile_fields` trigger that silently resets several fields when `current_role = 'authenticated'`. The `weakness_summary` field is NOT in the locked list, so this write succeeds. However, this means `weakness_summary` is written as the authenticated user role, which is correct. But if a future migration adds `weakness_summary` to the trigger's locked fields (to protect it), this write will silently fail without error because the trigger does not raise an exception — it just resets the value. The write in `refreshWeaknessSummary` in `complete/route.ts` correctly uses the service client.

**Fix:** For consistency and to avoid silent trigger-induced write failures, use `createServiceClient()` in the weakness-summary API route as is done in `complete/route.ts`.

---

### ME-07: `lib/session.ts` — question pool fallback can serve wrong-difficulty questions to Free users

**File:** `lib/session.ts:83-98`

```typescript
if (questionPool.length < questionCount) {
  const basePool = profile.tier === 'free'
    ? allQuestions.filter(q => FREE_CATEGORY_IDS.includes(q.category_id))
    : allQuestions
  // Re-apply difficulty filter in fallback to prevent wrong-difficulty questions
  if (difficulty === 'easy') {
    questionPool = basePool.filter(q => q.difficulty === 'easy')
  } else if (difficulty === 'hard') {
    questionPool = basePool.filter(q => q.difficulty === 'hard')
  } else {
    questionPool = basePool  // ← medium/mixed: includes ALL difficulties in base pool
  }
  // Last resort: if still not enough, use the full base pool
  if (questionPool.length < questionCount) questionPool = basePool
}
```

The last-resort fallback `questionPool = basePool` is reached when even the difficulty-filtered pool has fewer than `questionCount` questions. For a Free user, `basePool` is correctly limited to categories 1+2. But `basePool` itself is not filtered by difficulty — it includes all difficulties in those categories. The last resort thus allows a Free user to receive `medium` or `hard` questions if the `easy` pool in categories 1+2 runs dry.

This is a data-integrity bug not a security exploit (tier enforcement is at the RPC level for session creation), but it violates the stated tier rules.

**Fix:** Apply the difficulty filter to the last-resort pool as well, or log a warning instead of silently falling back to unfiltered questions.

---

## LOW Issues

### LO-01: `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed in the `create-subscription` response — intentional but worth noting

**File:** `app/api/payments/create-subscription/route.ts:106`

```typescript
key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
```

The Razorpay public key (publishable key) is intentionally public and required by the Razorpay Checkout.js SDK. This is not a vulnerability — Razorpay's design requires the public key on the client. Confirmed by the variable being `NEXT_PUBLIC_*` (intentionally exposed). No action needed, documenting for completeness.

---

### LO-02: `transcribe/route.ts` makes two separate DB queries for the same session row

**File:** `app/api/session/transcribe/route.ts:103-124`

```typescript
const { data: session } = await supabase
  .from('sessions').select('id, status').eq('id', session_id).eq('user_id', userId).single()
// ...
const { data: sessionRow } = await supabase
  .from('sessions').select('difficulty, tier_at_time').eq('id', session_id).single()
```

Two sequential round-trips to the same row. The second query (line 116) does not re-assert `.eq('user_id', userId)`, relying on the earlier ownership check to have returned a 403. If the RLS policies are correct (they are), this is safe but wasteful and harder to read. It could also cause a subtle bug if a session is transferred between users in between calls (impossible with current schema, but the pattern is fragile).

**Fix:** Merge into a single query: `select('id, status, difficulty, tier_at_time')`.

---

### LO-03: `abandon/route.ts` error on `decrement_sessions_used` RPC is silently swallowed

**File:** `app/api/session/abandon/route.ts:37`

```typescript
await (supabase as any).rpc('decrement_sessions_used', { p_user_id: user.id })
```

The result of this RPC call is not checked. If the RPC fails (e.g., the function doesn't exist, DB is under load, or the argument type changes), the quota is NOT decremented, the session is still marked `failed`, and the user permanently loses a session quota slot. There is no error logging here either.

**Fix:**

```typescript
const { error: rpcError } = await (supabase as any).rpc('decrement_sessions_used', { p_user_id: user.id })
if (rpcError) {
  console.error('[abandon] decrement_sessions_used failed:', rpcError.message)
  // Return 500 so client can retry, which will hit the 'Session already ended' guard
  return NextResponse.json({ error: 'Failed to restore quota. Please contact support.' }, { status: 500 })
}
```

---

### LO-04: `live/page.tsx` — `finishAndProcess` can be called twice via double-click on "See My Results"

**File:** `app/(protected)/session/live/page.tsx:305-308`, `636`

```typescript
async function finishAndProcess() {
  if (processingRef.current) return
  processingRef.current = true
```

The guard at line 307 prevents double-processing. However, the "See My Results" button (line 636) does not disable itself after click and remains clickable for the duration of the async operation. While `processingRef` prevents double-execution, both presses will fire `finishAndProcess` and the second will silently return. If the button remains visible and the user keeps clicking, there is no feedback that processing is underway.

**Fix:** Set a `useState` boolean to disable the button immediately on first click, in addition to the ref guard.

---

### LO-05: `dashboard/page.tsx` — "Quick Tip" selection using `charCodeAt(0)` leaks user ID structure

**File:** `app/(protected)/dashboard/page.tsx:385`

```typescript
{QUICK_TIPS[user.id.charCodeAt(0) % QUICK_TIPS.length]}
```

Supabase UUID user IDs always start with a hex character (`0-9`, `a-f`). This means `charCodeAt(0)` only produces values in `{48-57, 97-102}` (10 digits + 6 letters = 16 distinct values). With 25 tips in the array, tips at indices 16-24 are **never shown** to any user. This is a functional bug — 9 tips are unreachable.

**Fix:** Use a more distributed hash of the full user ID to select a tip, or pick a random tip seeded by the full UUID string.

---

### LO-06: Password minimum length is 6 characters — below NIST recommendation

**File:** `app/api/profile/password/route.ts:7`

```typescript
password: z.string().min(6, 'Password must be at least 6 characters').max(128),
```

NIST SP 800-63B recommends a minimum of 8 characters. 6-character passwords are brute-forceable with modest compute. Supabase Auth's own default minimum is 6, but enforcing a higher minimum at the API layer is easy and meaningful.

**Fix:** Change `min(6, ...)` to `min(8, 'Password must be at least 8 characters')`.

---

### LO-07: `weaknesssummary.ts` — `maxOutputTokens: 8192` is extremely high for a 3-sentence output

**File:** `lib/weaknesssummary.ts:41`

```typescript
generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
```

The prompt explicitly requests exactly 3 sentences. Setting `maxOutputTokens` to 8192 allows Gemini to generate far more than needed if the model goes off-track, increasing cost significantly. The practical output is ~100-200 tokens.

**Fix:** Set `maxOutputTokens: 512` to cap runaway generation while leaving ample room for 3 sentences.

---

### LO-08: Auth error from `supabase.auth.getUser()` is destructured but not checked in most routes

**File:** All API routes (e.g., `app/api/session/transcribe/route.ts:20`)

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

The pattern correctly handles the `!user` case, but ignores the `error` field from `getUser()`. If Supabase is temporarily unreachable, `getUser()` may return `{ data: { user: null }, error: AuthError }`. The current code treats this identically to "user not logged in" and returns 401 — which is correct behaviour (deny access on auth failure), but the error is not logged. Transient Supabase outages would appear as a surge of 401s with no error trace.

**Fix:** Log the error when it is non-null:

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError) console.error('[transcribe] auth error:', authError.message)
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

---

## Summary Table

| ID | Severity | Area | Description |
|----|----------|------|-------------|
| CR-01 | CRITICAL | DB / RPC | `decrement_sessions_used` accepts arbitrary user_id — quota manipulation across users |
| CR-02 | CRITICAL | DB / Session | Migration skew allows Student to use 'mixed' difficulty if migration 015 skipped |
| CR-03 | CRITICAL | API / Cost | TTS endpoint has no tier check — any auth user can trigger ElevenLabs calls |
| CR-04 | CRITICAL | API / Auth | Transcribe accepts any category-valid question_id, not just session-assigned ones |
| HI-01 | HIGH | Infrastructure | In-memory rate limiter is per-instance, not distributed — bypassed on concurrent instances |
| HI-02 | HIGH | API / Data | Report page fetches answers in parallel before ownership check completes |
| HI-03 | HIGH | Client | Live session loads questions from URL params without validating against session record |
| HI-04 | HIGH | AI / Cost | `refreshWeaknessSummary` bypasses the weakness-summary rate limit |
| ME-01 | MEDIUM | Info Exposure | Debug `console.log` on dashboard logs session IDs and metrics on every page load |
| ME-02 | MEDIUM | Logic | Onboarding endpoint allows repeated re-submission after `onboarding_complete = true` |
| ME-03 | MEDIUM | Logic | `answer_index` max is 10 but sessions use 5 questions — extra slots inflate grade |
| ME-04 | MEDIUM | Logic | `duration_seconds` is fully client-controlled with no server-side upper bound |
| ME-05 | MEDIUM | Security | Webhook IP rate limit uses spoofable `x-forwarded-for` leftmost value |
| ME-06 | MEDIUM | Logic | Weakness summary written via user-auth client — will silently fail if field locked |
| ME-07 | MEDIUM | Logic | Question pool last-resort fallback can serve wrong-difficulty questions to Free users |
| LO-01 | LOW | Info | Razorpay public key in API response — intentional, not a vulnerability |
| LO-02 | LOW | Quality | Two sequential DB queries for same session row in transcribe route |
| LO-03 | LOW | Quality | `decrement_sessions_used` RPC errors silently swallowed in abandon route |
| LO-04 | LOW | UX | "See My Results" button not disabled during processing — misleading UX |
| LO-05 | LOW | Logic | 9 of 25 quick tips unreachable due to charCodeAt range of UUID characters |
| LO-06 | LOW | Security | Password minimum is 6 characters — below NIST 800-63B recommendation of 8 |
| LO-07 | LOW | Cost | Gemini `maxOutputTokens: 8192` for a 3-sentence output — unnecessary cost exposure |
| LO-08 | LOW | Quality | Auth errors from `getUser()` are not logged — transient outages invisible in logs |

---

_Audited: 2026-08-02_  
_Reviewer: Manual deep review of 25 source files_
