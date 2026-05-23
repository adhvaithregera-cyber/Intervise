import { describe, it, expect } from 'vitest'
import {
  GRADE_STYLE,
  computeScorecardStats,
} from '@/lib/scorecard'

describe('GRADE_STYLE', () => {
  it('returns correct colour for each grade', () => {
    expect(GRADE_STYLE['A'].color).toBe('#4ade80')
    expect(GRADE_STYLE['B'].color).toBe('#F9C125')
    expect(GRADE_STYLE['C'].color).toBe('#fb923c')
    expect(GRADE_STYLE['D'].color).toBe('#f97316')
    expect(GRADE_STYLE['F'].color).toBe('#ef4444')
  })

  it('returns correct label for each grade', () => {
    expect(GRADE_STYLE['A'].label).toBe('Exceptional')
    expect(GRADE_STYLE['B'].label).toBe('Good')
    expect(GRADE_STYLE['C'].label).toBe('Average')
    expect(GRADE_STYLE['D'].label).toBe('Poor')
    expect(GRADE_STYLE['F'].label).toBe('Failed')
  })
})

describe('computeScorecardStats', () => {
  const baseAnswers = [
    { wpm: 120, filler_count: 2, ai_feedback: null },
    { wpm: 140, filler_count: 3, ai_feedback: null },
  ]

  it('computes avgWpm as rounded average', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.avgWpm).toBe(130)
  })

  it('computes totalFillers as sum', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.totalFillers).toBe(5)
  })

  it('computes questionCount as number of answers', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.questionCount).toBe(2)
  })

  it('capitalises difficulty correctly', () => {
    expect(computeScorecardStats('easy', baseAnswers).difficulty).toBe('Easy')
    expect(computeScorecardStats('mixed', baseAnswers).difficulty).toBe('Mixed')
  })

  it('returns avgScore null when no ai_feedback', () => {
    const stats = computeScorecardStats('medium', baseAnswers)
    expect(stats.avgScore).toBeNull()
  })

  it('returns averaged ai score when feedback present', () => {
    const answers = [
      { wpm: 120, filler_count: 2, ai_feedback: { score: 80 } },
      { wpm: 140, filler_count: 3, ai_feedback: { score: 60 } },
    ]
    const stats = computeScorecardStats('medium', answers)
    expect(stats.avgScore).toBe(70)
  })

  it('handles null wpm values gracefully', () => {
    const answers = [
      { wpm: null, filler_count: 1, ai_feedback: null },
      { wpm: 130, filler_count: 2, ai_feedback: null },
    ]
    const stats = computeScorecardStats('easy', answers)
    expect(stats.avgWpm).toBe(130)
  })

  it('returns avgWpm null when all wpm values are null', () => {
    const answers = [
      { wpm: null, filler_count: 1, ai_feedback: null },
    ]
    const stats = computeScorecardStats('easy', answers)
    expect(stats.avgWpm).toBeNull()
  })
})
