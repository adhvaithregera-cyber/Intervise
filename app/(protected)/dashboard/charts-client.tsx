'use client'

import dynamic from 'next/dynamic'
import type { SessionStat, CategoryStat, ProgressSummary } from './progress-charts'

const StatPills = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.StatPills })),
  { ssr: false }
)
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
const GradeTrendChart = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.GradeTrendChart })),
  { ssr: false }
)

export type { SessionStat, CategoryStat, ProgressSummary }

export function ChartsClient({
  sessionStats,
  categoryStats,
  summary,
}: {
  sessionStats: SessionStat[]
  categoryStats: CategoryStat[]
  summary: ProgressSummary
}) {
  return (
    <div className="space-y-4">
      <StatPills summary={summary} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FillerBarChart data={sessionStats} />
        <WpmLineChart data={sessionStats} />
      </div>
      <CategoryChart data={categoryStats} />
      <GradeTrendChart data={sessionStats} />
    </div>
  )
}
