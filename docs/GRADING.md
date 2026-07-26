# Intervise — Grading & AI Feedback System

## Overview

Every completed answer is scored by GPT-4o-mini using a 100-point rubric combining delivery metrics (30 pts) and category-specific content evaluation (70 pts). The result is a letter grade (A–F) plus a structured feedback object stored in `answers.ai_feedback`.

**The AI does not compute the grade or final score.** It scores content components only. Delivery scores, automatic cap detection, and the final grade are all computed server-side in `lib/aifeedback.ts`.

---

## Delivery Scoring (30 pts, applies to all categories)

Pre-computed from audio analysis before the AI is called. Max 10 pts each.

| Metric | Max | Scoring |
|--------|-----|---------|
| Filler words | 10 | 0 fillers = 10, ≤2 = 8, ≤4 = 6, ≤7 = 3, ≤10 = 1, >10 = 0 |
| WPM | 10 | Ideal range varies by difficulty (see WPM Ranges below) |
| Duration | 10 | Ideal range varies by category (see Duration below) |

### WPM Ideal Ranges by Difficulty

| Difficulty | Ideal | Slightly off | Too far off | Significantly off |
|---|---|---|---|---|
| Easy | 130–170 | 120–129 / 171–185 | 105–119 / 186–205 | 90–104 / 206–230 |
| Medium | 120–160 | 110–119 / 161–175 | 95–109 / 176–195 | 80–94 / 196–220 |
| Hard | 100–140 | 90–99 / 141–155 | 75–89 / 156–175 | 60–74 / 176–200 |

### Ideal Duration by Category

| Category | Min | Max | Too short | Too long |
|---|---|---|---|---|
| 1 Identity & Background | 60s | 90s | <30s | >150s |
| 2 Behavioural / Experience | 90s | 120s | <45s | >180s |
| 3 Strengths | 45s | 75s | <20s | >120s |
| 4/9 Weaknesses | 60s | 90s | <30s | >150s |
| 5 Motivation & Fit | 45s | 75s | <20s | >120s |
| 6 Future & Ambition | 45s | 60s | <20s | >120s |
| 7 Situational / Hypothetical | 75s | 120s | <40s | >180s |
| 8 Curveball / Pressure | 45s | 75s | <15s | >120s |

---

## Category-Specific Content Rubrics (70 pts max)

The rubric is selected deterministically from the question's `category_id`. The AI receives the full rubric as injected text and fills in component scores only.

### Category 1 — Identity & Background
*Format: Present → Past → Future*

| Component | Max |
|---|---|
| present | 20 |
| past | 25 |
| future | 25 |

**Automatic caps:** Started with place of birth / school marks → D max. Read CV chronologically → D max. No connection to the role → C max. Ended with "that's basically it" → −10 pts.

---

### Category 2 — Behavioural / Experience
*Format: STAR — Situation · Task · Action · Result*

| Component | Max |
|---|---|
| situation | 10 |
| task | 15 |
| action | 25 |
| result | 20 |

**Automatic caps:** "We" used >3× in Action → D max. No Result → D max. No quantified result → C max. Situation >30% of answer → C max. Answer <60s → F.

---

### Category 3 — Strengths
*Format: Name it → Prove it → Connect it*

| Component | Max |
|---|---|
| name_it | 15 |
| prove_it | 35 |
| connect_it | 20 |

**Automatic caps:** Strength is hardworking / dedicated / passionate / perfectionist → D max. No example given → D max. "We" in proof section → −10 pts.

---

### Category 4 / 9 — Weaknesses
*Format: Name it → Show awareness → Show action → Show progress*

Category 4 = original Weaknesses questions. Category 9 = Weaknesses split from "Strengths & Weaknesses" in migration 019. Identical rubric.

| Component | Max |
|---|---|
| name_it | 15 |
| show_awareness | 20 |
| show_action | 25 |
| show_progress | 10 |

**Automatic caps:** "I'm a perfectionist" (any variant) → automatic F. "I work too hard / care too much" → automatic F. No action plan → D max. Reframed weakness as strength immediately → −20 pts.

---

### Category 5 — Motivation & Fit
*Format: Them → You → Together*

| Component | Max |
|---|---|
| them | 25 |
| you | 25 |
| together | 20 |

**Automatic caps:** "Your company is very reputed" → F. Salary / job security mentioned as motivation → F. No company research → D max. Generic answer that applies to any company → D max.

---

### Category 6 — Future & Ambition
*Format: Near-term → Long-term → Bridge to this role*

| Component | Max |
|---|---|
| near_term | 25 |
| long_term | 20 |
| bridge | 25 |

**Automatic caps:** "I want to be CEO in 5 years" → D max. "I don't know where I'll be" → F. MBA as near-term plan → −15 pts. Generic answer → C max.

---

### Category 7 — Situational / Hypothetical
*Format: PACE — Prioritise · Act · Communicate · Evaluate*

| Component | Max |
|---|---|
| prioritise | 20 |
| act | 25 |
| communicate | 15 |
| evaluate | 10 |

**Automatic caps:** Only vague principles, no concrete steps → D max. No mention of involving others → −15 pts. Apology before action plan → −10 pts.

---

### Category 8 — Curveball / Pressure
*Format: Pause → Reframe → Redirect*

| Component | Max |
|---|---|
| pause | 10 |
| reframe | 35 |
| redirect | 25 |

**Automatic caps:** "I don't really have any failures" → automatic F. "I can't think of anything" → automatic F. Blames others for failure → D max. Answer <20s → D max.

---

## Scoring Pipeline

```
1. computeDeliveryScores()   → filler_words/wpm/duration scores (no AI)
2. detectAutomaticCaps()     → rule-based regex scan fires caps server-side
3. preCheckGrammar()         → if no grammar errors detected, skip AI grammar check
4. buildUserPrompt()         → injects rubric + transcript into AI prompt
5. OpenAI call               → AI returns component_scores, biggest_gap,
                               ideal_answer_opening, coaching_tip, [grammar_feedback]
6. parseAndValidate()        → validates structure; rejects malformed output
7. computeGradeAndScore()    → contentTotal + deliveryTotal → apply caps → score → grade
8. selectCoachingTemplate()  → overrides AI coaching tip with deterministic template
                               if one component is clearly the weakest
```

---

## AI Feedback Schema (`answers.ai_feedback`)

```typescript
type AiFeedback = {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number                          // 0–100, cap-applied, stored
  component_scores: Record<string, {
    score: number
    max: number
    feedback: string
  }>
  delivery_scores: {
    filler_words: { score: number; max: number; count: number }
    wpm:          { score: number; max: number; wpm: number; label: string }
    duration:     { score: number; max: number; seconds: number; label: string }
  }
  automatic_caps_applied: string[]
  biggest_gap: string
  ideal_answer_opening: string
  ideal_answer_pointers?: string[]
  grammar_feedback?: { score: number; max: number; issues: string[]; overall: string }
  coaching_tip: string
}
```

---

## Grade Scale

Thresholds vary by difficulty. Values shown are for Easy.

| Grade | Easy | Medium | Hard | Label |
|---|---|---|---|---|
| A | ≥90 | ≥90 | ≥90 | Exceptional |
| B | ≥75 | ≥77 | ≥80 | Good |
| C | ≥55 | ≥58 | ≥62 | Average |
| D | ≥35 | ≥37 | ≥40 | Poor |
| F | <35 | <37 | <40 | Failed |

---

## Session-Level Metrics (Fluency / Grammar / Skill / Your Score)

Computed in `lib/scorecard.ts → computeThreeMetrics()` from each answer's stored `ai_feedback`.

| Metric | Formula |
|---|---|
| Fluency | `(filler_words.score + wpm.score + duration.score) / 30 × 100` |
| Grammar | `grammar_feedback.score / grammar_feedback.max × 100` (defaults to 100 if grammar was clean) |
| Skill | `contentTotal / contentMax × 100` |
| Your Score | `ai_feedback.score` (the stored, cap-applied score — matches letter grade) |

Session-level values are averages across all answers with non-null `ai_feedback`.

---

## Session Grade

`sessions.overall_grade` is computed in `app/api/session/complete/route.ts` as the average of `ai_feedback.score` across all answers with non-null feedback.

---

## Tier Behaviour

| Tier | Gets AI feedback? | AI feedback visible? | Progress charts? |
|---|---|---|---|
| Free | Yes (runs always) | No (CSS blur overlay) | No |
| Student | Yes | Yes | Yes |
| Pro | Yes | Yes | Yes |

AI feedback always runs for all tiers. Free users see a blur overlay — the data is simply not displayed, not absent.

---

## Key Files

| File | Purpose |
|---|---|
| `lib/aifeedback.ts` | `generateAnswerFeedback()` — rubrics, delivery scoring, AI call, grade computation |
| `lib/analysis.ts` | `countFillerWords()`, `calculateWPM()` — pre-compute delivery metrics |
| `lib/scorecard.ts` | `computeThreeMetrics()`, `computeSessionMetrics()` — session-level F/G/S/Your Score |
| `types/database.ts` | `AiFeedback`, `AiFeedbackComponentScore` type definitions |
| `app/api/session/transcribe/route.ts` | Calls `generateAnswerFeedback` after transcription, stores result |
| `app/api/session/complete/route.ts` | Computes `overall_grade` from answer scores |
| `app/(protected)/session/report/[id]/page.tsx` | Renders AI feedback per answer on report page |
