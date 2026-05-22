'use client'

import dynamic from 'next/dynamic'

type SessionStat = { date: string; fillers: number; wpm: number | null }
type CategoryStat = { category: string; avgFillers: number; sessions: number }

const FillerBarChart = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.FillerBarChart })),
  { ssr: false }
)
const WpmLineChart = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.WpmLineChart })),
  { ssr: false }
)
const CategoryChart = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.CategoryChart })),
  { ssr: false }
)

export function ChartsClient({
  sessionStats,
  categoryStats,
}: {
  sessionStats: SessionStat[]
  categoryStats: CategoryStat[]
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FillerBarChart data={sessionStats} />
        <WpmLineChart data={sessionStats} />
      </div>
      <CategoryChart data={categoryStats} />
    </div>
  )
}
