# Intervise — Grading & AI Feedback System

## Overview

Every completed answer is scored by Claude Haiku using a 100-point rubric combining delivery metrics and category-specific content evaluation. The result is a letter grade (A–F) plus a structured feedback object stored in `answers.ai_feedback`.

---

## Delivery Scoring (applies to all categories)

These are pre-computed from audio analysis before Claude is called. Claude receives them as scoring tables and assigns points — it does not compute the raw numbers.

| Metric | Source | Scoring |
|--------|--------|---------|
| Filler words | `lib/analysis.ts` → `filler_count` | 0 fillers = full marks, scales down |
| WPM (words per minute) | `lib/analysis.ts` → `wpm` | Ideal range: 120–160 WPM |
| Duration | Audio recording length | Per-category ideal duration (see below) |

### Automatic Grade Caps

These are applied **before** Claude scores. Even a perfect content score cannot exceed the cap if a delivery threshold is breached:

| Trigger | Cap |
|---------|-----|
| >15 filler words | Max B |
| Answer too short (below tooShort threshold) | Max C |
| Answer too long (above tooLong threshold) | Max B |
| WPM significantly outside ideal range | Max B |

---

## Category-Specific Rubrics

Eight answer formats each have their own component scoring:

| Category ID | Format | Components scored |
|-------------|--------|-------------------|
| 1 | STAR | Situation, Task, Action, Result |
| 2 | PACE | Problem, Action, Conclusion, Effect |
| 3 | SOAR | Situation, Obstacle, Action, Result |
| 4 | CAR | Context, Action, Result |
| 5 | PARADE | Problem, Anticipation, Role, Action, Decision, Evaluation |
| 6 | SARI | Situation, Action, Result, Impact |
| 7 | SAO | Situation, Action, Outcome |
| 8 | General | Clarity, Relevance, Depth |

Each component has a defined max score. Claude evaluates the transcript against the format and assigns a score per component with written feedback.

---

## AI Feedback Schema (`answers.ai_feedback`)

```typescript
type AiFeedback = {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number                          // 0–100
  component_scores: Record<string, {
    score: number
    max: number
    feedback: string
  }>
  delivery_scores: {
    filler_words: { score: number; max: number; count: number }
    wpm: { score: number; max: number; wpm: number; label: string }
    duration: { score: number; max: number; seconds: number; label: string }
  }
  automatic_caps_applied: string[]       // e.g. ["Too many filler words (max B)"]
  biggest_gap: string                    // Single sentence identifying the weakest area
  ideal_answer_opening: string           // How a strong answer would have started
  coaching_tip: string                   // One actionable improvement tip
}
```

---

## Grade Scale

| Grade | Score range | Colour | Label |
|-------|-------------|--------|-------|
| A | 85–100 | `#4ade80` (green) | Exceptional |
| B | 70–84 | `#F9C125` (gold) | Good |
| C | 55–69 | `#fb923c` (amber) | Average |
| D | 40–54 | `#f97316` (deep orange) | Poor |
| F | 0–39 | `#ef4444` (red) | Failed |

---

## Session Grade

`sessions.overall_grade` is computed in `app/api/session/complete/route.ts`:
- **Preferred:** average of `ai_feedback.score` across all answers (when at least one answer has AI feedback)
- **Fallback:** WPM + filler heuristic (used for free tier, which doesn't get Claude feedback)

---

## Tier Behaviour

| Tier | Gets Claude feedback? | Score visible on report? | Score on scorecard PNG? |
|------|-----------------------|--------------------------|-------------------------|
| Free | No (Web Speech API only) | No (blurred overlay) | No (score line hidden) |
| Student | Yes | Yes | Yes |
| Pro | Yes | Yes | Yes |

Free tier sessions use the Web Speech API for transcription (not AssemblyAI), so `generateAnswerFeedback` is never called and `ai_feedback` remains null. The blur overlay is a CSS-only effect — the data simply isn't there.

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/aifeedback.ts` | `generateAnswerFeedback()` — calls Claude, returns `AiFeedback \| null` |
| `lib/analysis.ts` | `countFillerWords()`, `calculateWPM()` — pre-compute delivery metrics |
| `lib/scorecard.ts` | `GRADE_STYLE`, `computeScorecardStats()` — grade colours + OG image stats |
| `types/database.ts` | `AiFeedback`, `AiFeedbackComponentScore` type definitions |
| `app/api/session/transcribe/route.ts` | Calls `generateAnswerFeedback` after transcription, stores result |
| `app/api/session/complete/route.ts` | Computes `overall_grade` from answer scores |
| `app/(protected)/session/report/[id]/page.tsx` | Renders AI feedback per answer on report page |
| `app/api/og/scorecard/[id]/route.tsx` | Public OG image endpoint (1200×630 PNG) |
| `components/session/share-scorecard.tsx` | Share button — copy link + download PNG |
