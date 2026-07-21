'use client'

import React from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceArea,
} from 'recharts'

export type SessionStat = {
  label: string       // display label — de-duped by difficulty if same date
  date: string        // formatted date e.g. "12 May"
  isoDate: string     // ISO date string for filtering e.g. "2026-05-25T10:30:00Z"
  fillers: number
  wpm: number | null
  grade: string | null
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
  bestGrade: string | null
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

const GRADE_VALUES: Record<string, number> = { A: 10, B: 8, C: 6, D: 4, F: 2 }
const GRADE_LABELS: Record<number, string> = { 10: 'A', 8: 'B', 6: 'C', 4: 'D', 2: 'F' }

// Show at most ~6 x-axis labels regardless of session count
function xInterval(len: number): number {
  return Math.max(0, Math.ceil(len / 6) - 1)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-3">
      {children}
    </p>
  )
}

// ── Summary stat pills ───────────────────────────────────────────────────────

export const StatPills = React.memo(function StatPills({ summary }: { summary: ProgressSummary }) {
  const { avgFillers, fillerTrend, avgWpm, wpmTrend, bestGrade } = summary

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      {/* Avg fillers */}
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

      {/* Avg WPM */}
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

      {/* Best grade */}
      <div className="rounded-xl px-4 py-3" style={INNER_CARD}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">Best Grade</p>
        <span className="text-2xl font-bold text-[#F9C125]">{bestGrade ?? '—'}</span>
        <p className="text-[10px] text-white/30 mt-0.5">STAR rating</p>
      </div>
    </div>
  )
})

// ── Filler bar chart ─────────────────────────────────────────────────────────

export const FillerBarChart = React.memo(function FillerBarChart({ data }: { data: SessionStat[] }) {
  if (data.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>Filler words per session</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={[{label:'',fillers:0}]} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} height={56} />
              <YAxis tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0,10]} ticks={[0,2,4,6,8,10]} />
              <Bar dataKey="fillers" fill="rgba(249,193,37,0.08)" radius={[4,4,0,0]} maxBarSize={32} />
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
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 10, angle: -35, textAnchor: 'end' }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(data.length)}
            height={56}
          />
          <YAxis
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'auto']}
            tickCount={5}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(249,193,37,0.06)' }}
            formatter={(value) => [Number(value), 'Fillers']}
          />
          <Bar dataKey="fillers" fill="#F9C125" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

// ── WPM line chart with ideal range band ────────────────────────────────────

export const WpmLineChart = React.memo(function WpmLineChart({ data }: { data: SessionStat[] }) {
  const filtered = data.filter((d) => d.wpm !== null)
  if (filtered.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>Speech pace per session (wpm)</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={[{label:'',wpm:null}]} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <ReferenceArea y1={110} y2={160} fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.12)" label={{ value: 'Ideal range', position: 'insideTopRight', fill: 'rgba(34,197,94,0.3)', fontSize: 10 }} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} height={56} />
              <YAxis tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[80,180]} ticks={[80,110,130,160,180]} />
              <Line type="monotone" dataKey="wpm" stroke="rgba(249,193,37,0.15)" strokeWidth={2} dot={false} />
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
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <ReferenceArea
            y1={110}
            y2={160}
            fill="rgba(34,197,94,0.10)"
            stroke="rgba(34,197,94,0.20)"
            label={{ value: 'Ideal range', position: 'insideTopRight', fill: 'rgba(34,197,94,0.55)', fontSize: 10 }}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 10, angle: -35, textAnchor: 'end' }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(filtered.length)}
            height={56}
          />
          <YAxis
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[80, 180]}
            ticks={[80, 100, 110, 130, 160, 180]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value)} wpm`, 'Pace']}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#F9C125"
            strokeWidth={2}
            dot={{ fill: '#F9C125', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#F9C125' }}
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
  // Use absolute max baseline of 5 so a single low-value category doesn't span full width
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

// ── Grade trend chart ────────────────────────────────────────────────────────

export const GradeTrendChart = React.memo(function GradeTrendChart({ data }: { data: SessionStat[] }) {
  const graded = data.filter(d => d.grade !== null && GRADE_VALUES[d.grade!] !== undefined)
  if (graded.length === 0) {
    return (
      <div className="p-5 relative" style={INNER_CARD}>
        <SectionLabel>Overall grade trend</SectionLabel>
        <div className="relative">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={[{label:'',value:null}]} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} height={56} />
              <YAxis tick={{ fill: 'rgba(249,193,37,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0,12]} ticks={[2,4,6,8,10]} tickFormatter={(v: number) => GRADE_LABELS[v] ?? ''} />
              <Line type="monotone" dataKey="value" stroke="rgba(249,193,37,0.15)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-white/30 text-center">Complete at least 1 session to show data</p>
          </div>
        </div>
      </div>
    )
  }

  const chartData = graded.map(s => ({
    label: s.label,
    value: GRADE_VALUES[s.grade!],
    grade: s.grade,
  }))

  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Overall grade trend</SectionLabel>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 10, angle: -35, textAnchor: 'end' }}
            axisLine={false}
            tickLine={false}
            interval={xInterval(chartData.length)}
            height={56}
          />
          <YAxis
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 12]}
            ticks={[2, 4, 6, 8, 10]}
            tickFormatter={(v: number) => GRADE_LABELS[v] ?? ''}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(_value: unknown, _name: unknown, props: { payload?: { grade?: string } }) => [
              props.payload?.grade ?? '—', 'STAR Rating',
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#F9C125"
            strokeWidth={2}
            dot={{ fill: '#F9C125', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#F9C125' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
