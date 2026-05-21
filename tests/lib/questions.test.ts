import { describe, it, expect } from 'vitest'
import { selectAdaptiveQuestions } from '@/lib/questions'
import type { Question } from '@/types/database'

const makeQuestions = (count: number, categoryId = 1): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    rank: i + 1,
    category_id: categoryId,
    category_name: 'Test Category',
    question_text: `Question ${i + 1}`,
    frequency: 'High',
    difficulty: 'medium' as const,
    answer_format: 'Format',
    time_limit_seconds: 60,
    notes: '',
  }))

describe('selectAdaptiveQuestions', () => {
  it('returns exactly the requested count when enough questions available', () => {
    const result = selectAdaptiveQuestions(makeQuestions(10), [], 3)
    expect(result).toHaveLength(3)
  })

  it('returns fewer than count when pool is smaller', () => {
    const result = selectAdaptiveQuestions(makeQuestions(2), [], 3)
    expect(result).toHaveLength(2)
  })

  it('excludes already-asked questions when enough unasked remain', () => {
    const askedIds = [1, 2, 3, 4, 5, 6, 7]
    const result = selectAdaptiveQuestions(makeQuestions(10), askedIds, 3)
    const resultIds = result.map(q => q.id)
    expect(resultIds.every(id => !askedIds.includes(id))).toBe(true)
  })

  it('falls back to asked questions when not enough unasked remain', () => {
    const askedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const result = selectAdaptiveQuestions(makeQuestions(10), askedIds, 3)
    expect(result).toHaveLength(3)
    expect(result.some(q => q.id === 10)).toBe(true)
  })

  it('does not return duplicate questions', () => {
    const result = selectAdaptiveQuestions(makeQuestions(10), [], 5)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
