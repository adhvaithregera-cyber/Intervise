import type { Question } from '@/types/database'

export function selectAdaptiveQuestions(
  allQuestions: Question[],
  askedIds: number[],
  count: number
): Question[] {
  const askedSet = new Set(askedIds)
  const unasked = allQuestions.filter(q => !askedSet.has(q.id))

  if (unasked.length >= count) {
    return shuffle(unasked).slice(0, count)
  }

  // Not enough unasked — fill remaining slots from the asked pool
  const needed = count - unasked.length
  const fallback = shuffle(allQuestions.filter(q => askedSet.has(q.id))).slice(0, needed)
  return shuffle([...unasked, ...fallback])
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
