import { computeThreeMetrics } from '@/lib/scorecard'
import type { AiFeedback } from '@/types/database'

export type WeaknessKey = 'skill' | 'weak_category' | 'fillers' | 'pace_fast' | 'pace_slow' | 'fluency'

export type FocusArea = {
  key: WeaknessKey
  priority: 'high' | 'medium'
  title: string
  stat: string
  advice: string
  rank: number // 1 = highest priority
}

export type FocusAreasResult =
  | { type: 'not_enough_data' }
  | { type: 'all_good' }
  | { type: 'areas'; items: FocusArea[] }

export type AnswerForFocus = {
  session_id: string
  ai_feedback: AiFeedback | null
  filler_count: number | null
  wpm: number | null
  question_id: number
}

/**
 * Rule-based weakness detection. No AI calls.
 *
 * Ranking is by impactScore — how far below "good" the user is,
 * weighted by how much each metric affects the overall score:
 *   skill weakness:   (40 - avg) × 3   (highest weight — directly drives grade)
 *   weak category:    gap × 2           (category-level skill gap)
 *   fluency low:      (60 - avg) × 1.5
 *   fillers high:     (avg - 3) × 10    (noticeable at small excess)
 *   pace issues:      delta × 0.5       (milder impact, easy to self-correct)
 */
export function detectFocusAreas(
  answers: AnswerForFocus[],
  categoryMap: Record<string, string>, // question_id (as string) → category_name
): FocusAreasResult {
  const MIN_SESSIONS  = 2
  const MIN_FEEDBACK  = 3

  const withFb = answers.filter(a => a.ai_feedback !== null)
  const sessionIds = new Set(withFb.map(a => a.session_id))

  if (sessionIds.size < MIN_SESSIONS || withFb.length < MIN_FEEDBACK) {
    return { type: 'not_enough_data' }
  }

  // Per-answer skill + fluency derived from ai_feedback
  const perAnswer = withFb.map(a => computeThreeMetrics(a.ai_feedback!))
  const avgSkill   = mean(perAnswer.map(m => m.skill))
  const avgFluency = mean(perAnswer.map(m => m.fluency))

  // WPM + fillers — require enough samples to avoid noise
  const wpms        = answers.map(a => a.wpm).filter((v): v is number => v !== null)
  const fillers     = answers.map(a => a.filler_count).filter((v): v is number => v !== null)
  const avgWpm      = wpms.length >= 3    ? mean(wpms)    : null
  const avgFillers  = fillers.length >= 3 ? mean(fillers) : null

  // Weak-category: group answers-with-feedback by category,
  // require ≥ 2 categories each with ≥ 2 answers, and a gap ≥ 20 pts below overall avg.
  const catSkills: Record<string, number[]> = {}
  for (let i = 0; i < withFb.length; i++) {
    const cat = categoryMap[String(withFb[i].question_id)] ?? 'Unknown'
    if (!catSkills[cat]) catSkills[cat] = []
    catSkills[cat].push(perAnswer[i].skill)
  }
  const qualifyingCats = Object.entries(catSkills)
    .filter(([, scores]) => scores.length >= 2)
    .map(([name, scores]) => ({ name, avg: mean(scores) }))

  let weakestCat: { name: string; avg: number } | null = null
  if (qualifyingCats.length >= 2) {
    const worst = qualifyingCats.reduce((a, b) => a.avg < b.avg ? a : b)
    if (avgSkill - worst.avg >= 20) weakestCat = worst
  }

  // Build candidate list
  type Candidate = {
    key: WeaknessKey
    priority: 'high' | 'medium'
    impactScore: number
    title: string
    stat: string
    advice: string
  }
  const candidates: Candidate[] = []

  // ── Skill weakness (avg skill < 40) ──────────────────────────────────────
  if (avgSkill < 40) {
    candidates.push({
      key: 'skill',
      priority: 'high',
      impactScore: (40 - avgSkill) * 5,
      title: 'Answer structure',
      stat: `Your average skill score is ${Math.round(avgSkill)}/100`,
      advice: "Your answers need clearer structure. Use the STAR method for behavioural questions: Situation, Task, Action, Result. Structure every answer this way — it's the single biggest thing that will raise your score.",
    })
  }

  // ── Weak category (≥ 20 pts below overall skill avg) ─────────────────────
  if (weakestCat) {
    const gap = avgSkill - weakestCat.avg
    candidates.push({
      key: 'weak_category',
      priority: 'high',
      impactScore: gap * 2,
      title: `${weakestCat.name} questions`,
      stat: `Your ${weakestCat.name} answers score ${Math.round(weakestCat.avg)}/100 on structure`,
      advice: `Your ${weakestCat.name} answers are your weakest area. Focus your next few sessions here, and apply the STAR structure to give clear, complete answers.`,
    })
  }

  // ── Fluency low (avg fluency < 60) ───────────────────────────────────────
  if (avgFluency < 60) {
    candidates.push({
      key: 'fluency',
      priority: 'medium',
      impactScore: (60 - avgFluency) * 1.5,
      title: 'Delivery fluency',
      stat: `Your average fluency score is ${Math.round(avgFluency)}/100`,
      advice: "Your delivery could be smoother. Focus on speaking in complete, steady sentences, and pause between thoughts rather than filling the gaps.",
    })
  }

  // ── Fillers high (avg > 3 per answer) ────────────────────────────────────
  if (avgFillers !== null && avgFillers > 3) {
    const x = Math.round(avgFillers)
    candidates.push({
      key: 'fillers',
      priority: 'medium',
      impactScore: (avgFillers - 3) * 7,
      title: 'Filler words',
      stat: `You average ${x} filler word${x === 1 ? '' : 's'} per answer`,
      advice: `You average ${x} filler word${x === 1 ? '' : 's'} per answer. The fix isn't replacing them, it's pausing. When you feel a filler coming, stop silently for a beat instead. A pause sounds thoughtful; a filler sounds unsure.`,
    })
  }

  // ── Pace too fast (> 165 wpm) ────────────────────────────────────────────
  if (avgWpm !== null && avgWpm > 165) {
    candidates.push({
      key: 'pace_fast',
      priority: 'medium',
      impactScore: (avgWpm - 165) * 0.5,
      title: 'Speaking pace',
      stat: `You speak at ${Math.round(avgWpm)} wpm on average`,
      advice: `You're speaking at ${Math.round(avgWpm)} words per minute, too fast. Aim for 140–150. Slowing down cuts filler words and makes you sound more confident and in control.`,
    })
  }

  // ── Pace too slow (< 110 wpm) ────────────────────────────────────────────
  if (avgWpm !== null && avgWpm < 110) {
    candidates.push({
      key: 'pace_slow',
      priority: 'medium',
      impactScore: (110 - avgWpm) * 0.5,
      title: 'Speaking pace',
      stat: `You speak at ${Math.round(avgWpm)} wpm on average`,
      advice: `You're speaking at ${Math.round(avgWpm)} words per minute, a bit slow. Aim for 140–150. Practise a steadier, more energetic pace to sound more engaged.`,
    })
  }

  if (candidates.length === 0) return { type: 'all_good' }

  const items = candidates
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3)
    .map((c, i) => ({
      key: c.key,
      priority: c.priority,
      title: c.title,
      stat: c.stat,
      advice: c.advice,
      rank: i + 1,
    }))

  return { type: 'areas', items }
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
