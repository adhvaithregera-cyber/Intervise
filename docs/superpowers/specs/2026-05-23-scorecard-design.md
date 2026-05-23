# Shareable Scorecard PNG — Design Spec
**Date:** 2026-05-23
**Milestone:** M8

---

## Overview

A shareable OG image (1200×630 PNG) generated server-side for every completed session. Users get a "Share Scorecard" button on the report page with two actions: copy link and download PNG. Available to all tiers — no AI tokens consumed.

---

## OG Image Route

**Path:** `GET /api/og/scorecard/[id]`

- Implemented with `ImageResponse` from `next/og`
- **Public endpoint** — no auth required. The session UUID is unguessable and serves as the access token (standard practice)
- Reads session + answers using the **Supabase service role key** (server-side only, bypasses RLS)
- Returns `404` if session ID does not exist
- Content-type: `image/png`, dimensions: `1200 × 630`

### Data fetched

From `sessions`: `overall_grade`, `difficulty`, `created_at`
From `answers`: `wpm` (to compute avg), `filler_count` (to sum), `ai_feedback` (to extract avg score for Student+ sessions)

### Canvas layout

```
┌─────────────────────────────────────────────────────┐
│ INTERVISE                                            │
│                                                      │
│                      [GRADE]                         │
│                  score / 100 · Label    ← Student+   │
│                  (hidden for free tier)              │
│                                                      │
│       138 wpm  │  4 fillers  │  5 Qs  │  Medium     │
│                                                      │
│                                       @intervisehq  │
└─────────────────────────────────────────────────────┘
```

- **Background:** solid dark colour tinted by grade (see colour table)
- **Radial glow:** `radial-gradient(ellipse at 50% 0%, <grade-colour at 12% opacity> 0%, transparent 65%)` — subtle top glow
- **"INTERVISE" wordmark:** top-left, grade colour, 10px, 800 weight, 3px letter-spacing, uppercase, 80% opacity
- **Grade letter:** centred, 88px (scales to ~200px in actual 1200×630), 900 weight, grade colour. Note: `next/og` (Satori) does not support `text-shadow` — use a large coloured `box-shadow` on a wrapper div or a subtle `opacity` layer as a glow substitute
- **Score line** (`score / 100 · Label`): shown only when `ai_feedback` exists on at least one answer. Hidden entirely for free tier sessions or sessions with no AI feedback. Colour: `rgba(255,255,255,0.45)`, uppercase, letter-spaced
- **Stat row:** avg WPM · total fillers · question count · difficulty. `rgba(255,255,255,0.9)` values, `rgba(255,255,255,0.3)` labels
- **`@intervisehq`:** bottom-right, grade colour at 45% opacity, 10px

### Grade colour + background table

| Grade | Letter / accent | Background | Glow colour |
|-------|----------------|------------|-------------|
| A | `#4ade80` | `#0d1f0d` | `rgba(74,222,128,0.12)` |
| B | `#F9C125` | `#1C0A00` | `rgba(249,193,37,0.12)` |
| C | `#fb923c` | `#1a1000` | `rgba(251,146,60,0.12)` |
| D | `#f97316` | `#140800` | `rgba(249,115,22,0.12)` |
| F | `#ef4444` | `#1a0000` | `rgba(239,68,68,0.15)` |

### Grade label strings

| Grade | Label |
|-------|-------|
| A | Exceptional |
| B | Good |
| C | Average |
| D | Poor |
| F | Failed |

### Score computation

- Average `ai_feedback.score` across all answers that have it
- If no answers have `ai_feedback`, omit the score line entirely
- Round to nearest integer

### Stat computation

- **Avg WPM:** average of non-null `wpm` values; show `—` if none
- **Total fillers:** sum of `filler_count` across all answers
- **Questions:** count of answer rows
- **Difficulty:** `session.difficulty` capitalised (Easy / Medium / Hard / Mixed)

---

## Share UI (Report Page)

### Availability

All tiers (free, student, pro). No gate.

### Placement

In the existing header button row on the report page, alongside "New Session" and "Dashboard". A single "Share" button — clicking it expands inline to reveal two sub-buttons.

### Behaviour

**Copy Link:**
- Copies `https://intervise-ashen.vercel.app/api/og/scorecard/[sessionId]` to clipboard via `navigator.clipboard.writeText()`
- Button label changes to "Copied!" for 2 seconds then resets

**Download PNG:**
- `fetch()` the OG URL → convert to `Blob` → create object URL → trigger `<a download="intervise-scorecard.png">` click → revoke object URL
- No separate server route needed

### Component

A new `ShareScorecard` client component (`components/session/share-scorecard.tsx`):
- Accepts `sessionId: string` as prop
- Manages open/collapsed state and "copied" feedback state internally
- Uses existing `Button` component variants from `components/ui/button.tsx`

---

## Error handling

- OG route: session not found → `NextResponse.json({ error: 'Not found' }, { status: 404 })`
- OG route: DB read failure → `500` with no body (silent to end user)
- Copy link: clipboard API unavailable → fall back to `window.prompt()` with the URL pre-selected
- Download: fetch failure → no-op (button returns to default state silently)

---

## Font loading

`next/og` requires fonts to be passed explicitly — browser fonts are not available. Load **Inter** (or any sans-serif) at weights 700 and 900 via `fetch()` from Google Fonts CDN inside the route handler, and pass them to `ImageResponse` options. This is required for the grade letter to render at 900 weight.

---

## Files changed

| File | Change |
|------|--------|
| `app/api/og/scorecard/[id]/route.tsx` | New — OG image route |
| `components/session/share-scorecard.tsx` | New — share button client component |
| `app/(protected)/session/report/[id]/page.tsx` | Add `<ShareScorecard sessionId={sessionId} />` to header |
| `.gitignore` | Add `.superpowers/` if not present |
