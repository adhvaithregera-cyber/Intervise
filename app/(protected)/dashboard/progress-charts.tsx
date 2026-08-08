'use client'

import React from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceArea,
} from 'recharts'

export type SessionStat = {
  label: string       // display label — de-duped by difficulty if same date (used in tooltip)
  date: string        // short date e.g. "12 May" (used as x-axis tick)
  isoDate: string     // ISO date string for filtering e.g. "2026-05-25T10:30:00Z"
  fillers: number
  wpm: number | null
  grade: string | null
  yourScore: number | null
  fluency: number | null
  accuracy: number | null
  skill: number | null
}

export type CategoryStat = {
  category: string
  avgFillers: number
  sessions: number
}

export type ProgressSummary = {
  avgFillers: number | null
  fillerTrend: 'up' | 'down' | 'flat'
  avgWpm: number | null
  wpmTrend: 'up' | 'down' | 'flat'
  bestScore: number | null
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.95)',
  border: '1px solid rgba(249,193,37,0.25)',
  borderRadius: '0.5rem',
  color: '#fff',
  fontSize: '12px',
}

const INNER_CARD = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1.5px solid rgba(249,193,37,0.28)',
  borderRadius: '0.75rem',
}

// Show at most ~4 x-axis labels regardless of session count
function xInterval(len: number): number {
  return Math.max(0, Math.ceil(len / 4) - 1)
}

// X-axis shows date only; tooltip shows full label (including difficulty when same-day sessions exist)
function tooltipLabel(_: unknown, payload: Array<{ payload?: { label?: string } }>): string {
  return payload?.[0]?.payload?.label ?? String(_)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125] mb-3">
      {children}
    </p>
  )
}

// ── Summary stat pills ───────────────────────────────────────────────────────

export const StatPills = React.memo(function StatPills({ summary }: { summary: ProgressSummary }) {
  const { avgFillers, fillerTrend, avgWpm, wpmTrend, bestScore } = summary

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <div className="rounded-xl px-4 py-3" style={INNER_CARD}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">Avg Fillers</p>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-white">{avgFillers ?? '—'}</span>
          {avgFillers !== null && fillerTrend !== 'flat' && (
            <span className={`text-lg font-bold ${fillerTrend === 'down' ? 'text-green-400' : 'text-red-400'}`}>
              {fillerTrend === 'down' ? '↓' : '↑'}
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">per answer</p>
      </div>

      <div className="rounded-xl px-4 py-3" style={INNER_CARD}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">Avg WPM</p>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-white">{avgWpm ?? '—'}</span>
          {avgWpm !== null && wpmTrend !== 'flat' && (
            <span className={`text-lg font-bold ${wpmTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {wpmTrend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">words per minute</p>
      </div>

      <div className="rounded-xl px-4 py-3" style={INNER_CARD}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">Best Score</p>
        <span className="text-2xl font-bold text-[#F9C125]">{bestScore ?? '—'}</span>
        <p className="text-[10px] text-white/30 mt-0.5">out of 100</p>
      </div>
    </div>
  )
})

// ── Filler bar chart — orange ────────────────────────────────────────────────

export const FillerBarChart = React.memo(function FillerBarChart({ data }: { data: SessionStat[] }) {
  if (data.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>Filler words per session</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ date: '', fillers: 0 }]} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} height={28} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
              <Bar dataKey="fillers" fill="rgba(251,146,60,0.08)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/30 text-center">Complete at least 1 session to show data</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Filler words per session</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(data.length)}
            height={28}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'auto']}
            tickCount={5}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(251,146,60,0.08)' }}
            labelFormatter={tooltipLabel}
            formatter={(value) => [Number(value), 'Fillers']}
          />
          <Bar dataKey="fillers" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

// ── WPM line chart — cyan ────────────────────────────────────────────────────

export const WpmLineChart = React.memo(function WpmLineChart({ data }: { data: SessionStat[] }) {
  const filtered = data.filter((d) => d.wpm !== null)
  if (filtered.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>Speech pace per session (wpm)</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={[{ date: '', wpm: null }]} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <ReferenceArea y1={110} y2={160} fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.12)" label={{ value: 'Ideal range', position: 'insideTopRight', fill: 'rgba(34,197,94,0.3)', fontSize: 10 }} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} height={28} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 200]} ticks={[60, 80, 100, 120, 140, 160, 180, 200]} />
              <Line type="monotone" dataKey="wpm" stroke="rgba(34,211,238,0.15)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/30 text-center">Complete at least 1 session to show data</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Speech pace per session (wpm)</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <ReferenceArea
            y1={110}
            y2={160}
            fill="rgba(34,197,94,0.10)"
            stroke="rgba(34,197,94,0.20)"
            label={{ value: 'Ideal range', position: 'insideTopRight', fill: 'rgba(34,197,94,0.55)', fontSize: 10 }}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(filtered.length)}
            height={28}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[60, 200]}
            ticks={[60, 80, 100, 120, 140, 160, 180, 200]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={tooltipLabel}
            formatter={(value) => [`${Number(value)} wpm`, 'Pace']}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#22d3ee' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

// ── Category filler chart ────────────────────────────────────────────────────

export const CategoryChart = React.memo(function CategoryChart({ data }: { data: CategoryStat[] }) {
  if (data.length === 0) {
    return (
      <div className="p-5" style={INNER_CARD}>
        <SectionLabel>Avg filler words by question category</SectionLabel>
        <div className="space-y-2.5 mt-1">
          {['Opening & Strengths', 'Behavioural', 'Motivation', 'Situational'].map((cat) => (
            <div key={cat}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-white/25 truncate max-w-[70%]">{cat}</span>
                <span className="text-sm font-semibold text-white/20">—</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-1.5 rounded-full w-0" style={{ background: 'rgba(249,193,37,0.2)' }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/25 text-center mt-4">Complete at least 1 session to show data</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.avgFillers - a.avgFillers)
  const max = Math.max(sorted[0]?.avgFillers ?? 0, 5)

  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Avg filler words by question category</SectionLabel>
      <div className="space-y-2.5 mt-1">
        {sorted.map((cat) => {
          const pct = Math.round((cat.avgFillers / max) * 100)
          return (
            <div key={cat.category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-white/70 truncate max-w-[70%]">{cat.category}</span>
                <span className="text-sm font-semibold text-[#F9C125]">
                  {cat.avgFillers.toFixed(1)} avg · {cat.sessions}s
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: '#F9C125' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

// ── Generic 0–100 metric line chart ─────────────────────────────────────────

const METRIC_TICKS = [0, 20, 40, 60, 80, 100]

export const MetricLineChart = React.memo(function MetricLineChart({
  data,
  dataKey,
  label,
  color,
}: {
  data: SessionStat[]
  dataKey: 'fluency' | 'accuracy' | 'skill' | 'yourScore'
  label: string
  color: string
}) {
  const filtered = data.filter(d => d[dataKey] !== null)
  if (filtered.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>{label} per session</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={[{ date: '', [dataKey]: null }]} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} height={28} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={METRIC_TICKS} />
              <Line type="monotone" dataKey={dataKey} stroke={`${color}26`} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/30 text-center">Complete at least 1 session to show data</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>{label} per session</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(filtered.length)}
            height={28}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={METRIC_TICKS}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={tooltipLabel}
            formatter={(value: unknown) => [`${value}/100`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

// ── Score trend chart — gold (headline metric) ───────────────────────────────

export const GradeTrendChart = React.memo(function GradeTrendChart({ data }: { data: SessionStat[] }) {
  return <MetricLineChart data={data} dataKey="yourScore" label="Your Score" color="#F9C125" />
})
