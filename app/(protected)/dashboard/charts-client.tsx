'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { SessionStat, CategoryStat, ProgressSummary } from './progress-charts'

function computeSummary(stats: SessionStat[]): ProgressSummary {
  if (stats.length === 0) return { avgFillers: null, fillerTrend: 'flat', avgWpm: null, wpmTrend: 'flat', bestScore: null }

  const allFillers = stats.map(s => s.fillers)
  const avgFillers = Math.round(allFillers.reduce((a, b) => a + b, 0) / allFillers.length)

  let fillerTrend: 'up' | 'down' | 'flat' = 'flat'
  if (stats.length >= 2) {
    const half = Math.ceil(stats.length / 2)
    const firstAvg = stats.slice(0, half).reduce((a, s) => a + s.fillers, 0) / half
    const lastAvg = stats.slice(-half).reduce((a, s) => a + s.fillers, 0) / half
    if (lastAvg < firstAvg - 0.5) fillerTrend = 'down'
    else if (lastAvg > firstAvg + 0.5) fillerTrend = 'up'
  }

  const wpmData = stats.filter(s => s.wpm !== null)
  const avgWpm = wpmData.length > 0 ? Math.round(wpmData.reduce((a, s) => a + (s.wpm ?? 0), 0) / wpmData.length) : null

  let wpmTrend: 'up' | 'down' | 'flat' = 'flat'
  if (wpmData.length >= 2) {
    const half = Math.ceil(wpmData.length / 2)
    const firstAvg = wpmData.slice(0, half).reduce((a, s) => a + (s.wpm ?? 0), 0) / half
    const lastAvg = wpmData.slice(-half).reduce((a, s) => a + (s.wpm ?? 0), 0) / half
    if (lastAvg > firstAvg + 3) wpmTrend = 'up'
    else if (lastAvg < firstAvg - 3) wpmTrend = 'down'
  }

  const scores = stats.map(s => s.yourScore).filter((s): s is number => s !== null)
  const bestScore = scores.length > 0 ? Math.max(...scores) : null

  return { avgFillers, fillerTrend, avgWpm, wpmTrend, bestScore }
}

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
}: {
  sessionStats: SessionStat[]
  categoryStats: CategoryStat[]
}) {
  const [range, setRange] = useState<Range>('all')

  const filtered = useMemo(() => filterByRange(sessionStats, range), [sessionStats, range])
  const derivedSummary = useMemo(() => computeSummary(filtered), [filtered])

  return (
    <div className="space-y-4">
      <StatPills summary={derivedSummary} />

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricLineChart data={filtered} dataKey="fluency" label="Fluency" color="#60a5fa" />
        <MetricLineChart data={filtered} dataKey="accuracy" label="Grammar" color="#34d399" />
        <MetricLineChart data={filtered} dataKey="skill" label="Skill" color="#a78bfa" />
        <GradeTrendChart data={filtered} />
      </div>
    </div>
  )
}
