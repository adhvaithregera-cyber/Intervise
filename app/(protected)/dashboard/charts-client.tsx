'use client'

import { useState, useMemo } from 'react'
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
const MetricLineChart = dynamic(
  () => import('./progress-charts').then((m) => ({ default: m.MetricLineChart })),
  { ssr: false }
)

export type { SessionStat, CategoryStat, ProgressSummary }

type Range = 'today' | 'week' | 'month' | 'all'

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all',   label: 'All' },
]

function filterByRange(stats: SessionStat[], range: Range): SessionStat[] {
  if (range === 'all') return stats
  const now = new Date()
  const cutoff = new Date(now)
  if (range === 'today') {
    cutoff.setHours(0, 0, 0, 0)
  } else if (range === 'week') {
    cutoff.setDate(now.getDate() - 7)
  } else {
    cutoff.setDate(now.getDate() - 30)
  }
  return stats.filter(s => new Date(s.isoDate) >= cutoff)
}

export function ChartsClient({
  sessionStats,
  categoryStats,
  summary,
}: {
  sessionStats: SessionStat[]
  categoryStats: CategoryStat[]
  summary: ProgressSummary
}) {
  const [range, setRange] = useState<Range>('all')

  const filtered = useMemo(() => filterByRange(sessionStats, range), [sessionStats, range])

  return (
    <div className="space-y-4">
      <StatPills summary={summary} />

      {/* Range selector */}
      <div className="flex gap-1.5">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={range === r.key
              ? { background: '#F9C125', color: '#080d1a' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
            }
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/30 self-center">
          {filtered.length} session{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FillerBarChart data={filtered} />
        <WpmLineChart data={filtered} />
      </div>
      <CategoryChart data={categoryStats} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricLineChart data={filtered} dataKey="fluency" label="Fluency" />
        <MetricLineChart data={filtered} dataKey="accuracy" label="Grammar" />
        <MetricLineChart data={filtered} dataKey="skill" label="Skill" />
      </div>
      <GradeTrendChart data={filtered} />
    </div>
  )
}
