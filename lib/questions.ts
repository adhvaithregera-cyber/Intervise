import type { Question } from '@/types/database'

/**
 * maxPerCategory caps how many questions of a category may appear in one set
 * (e.g. { 10: 2 } keeps Open-ended to two). Caps are honoured by preferring other
 * questions first, but are broken as a last resort so the set is never short.
 */
export function selectAdaptiveQuestions(
  allQuestions: Question[],
  askedIds: number[],
  count: number,
  maxPerCategory?: Record<number, number>,
): Question[] {
  const askedSet = new Set(askedIds)
  const unasked = allQuestions.filter(q => !askedSet.has(q.id))

  if (maxPerCategory) {
    const asked = allQuestions.filter(q => askedSet.has(q.id))
    const ordered = [...shuffle(unasked), ...shuffle(asked)]
    const taken = new Set<number>()
    const perCategory: Record<number, number> = {}
    const selected: Question[] = []
    const take = (q: Question) => {
      taken.add(q.id)
      perCategory[q.category_id] = (perCategory[q.category_id] ?? 0) + 1
      selected.push(q)
    }
    for (const q of ordered) {
      if (selected.length >= count) break
      const cap = maxPerCategory[q.category_id]
      if (cap === undefined || (perCategory[q.category_id] ?? 0) < cap) take(q)
    }
    // Last resort: cap would leave the set short, so relax it.
    for (const q of ordered) {
      if (selected.length >= count) break
      if (!taken.has(q.id)) take(q)
    }
    return shuffle(selected)
  }

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
