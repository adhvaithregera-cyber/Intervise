import type { Answer, Difficulty } from '@/types/database'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export type GradeStyle = {
  color: string
  bg: string
  glowColor: string
  label: string
}

export const GRADE_STYLE: Record<Grade, GradeStyle> = {
  A: { color: '#4ade80', bg: '#0d1f0d', glowColor: 'rgba(74,222,128,0.12)',  label: 'Exceptional' },
  B: { color: '#F9C125', bg: '#1C0A00', glowColor: 'rgba(249,193,37,0.12)',  label: 'Good'        },
  C: { color: '#fb923c', bg: '#1a1000', glowColor: 'rgba(251,146,60,0.12)',  label: 'Average'     },
  D: { color: '#f97316', bg: '#140800', glowColor: 'rgba(249,115,22,0.12)',  label: 'Poor'        },
  F: { color: '#ef4444', bg: '#1a0000', glowColor: 'rgba(239,68,68,0.15)',   label: 'Failed'      },
}

export type ScorecardStats = {
  avgWpm: number | null
  totalFillers: number
  questionCount: number
  difficulty: string
  avgScore: number | null
}

export function computeScorecardStats(
  difficulty: Difficulty,
  answers: Pick<Answer, 'wpm' | 'filler_count' | 'ai_feedback'>[],
): ScorecardStats {
  const wpms = answers.map(a => a.wpm).filter((v): v is number => v !== null)
  const avgWpm = wpms.length > 0
    ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
    : null

  const totalFillers = answers.reduce((sum, a) => sum + (a.filler_count ?? 0), 0)

  const aiScores = answers
    .map(a => a.ai_feedback?.score)
    .filter((v): v is number => typeof v === 'number')
  const avgScore = aiScores.length > 0
    ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length)
    : null

  const capitalised = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)

  return {
    avgWpm,
    totalFillers,
    questionCount: answers.length,
    difficulty: capitalised,
    avgScore,
  }
}
