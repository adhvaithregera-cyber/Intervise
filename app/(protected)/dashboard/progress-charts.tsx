'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type SessionStat = {
  date: string      // formatted date label e.g. "12 May"
  fillers: number
  wpm: number | null
}

type CategoryStat = {
  category: string
  avgFillers: number
  sessions: number
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(28,10,0,0.95)',
  border: '1px solid rgba(249,193,37,0.25)',
  borderRadius: '0.5rem',
  color: '#fff',
  fontSize: '12px',
}

const INNER_CARD = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '0.75rem',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-3">
      {children}
    </p>
  )
}

export function FillerBarChart({ data }: { data: SessionStat[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/30 text-xs">
        No session data yet
      </div>
    )
  }
  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Filler words per session</SectionLabel>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
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
}

export function WpmLineChart({ data }: { data: SessionStat[] }) {
  const filtered = data.filter((d) => d.wpm !== null)
  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/30 text-xs">
        No WPM data yet
      </div>
    )
  }
  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Speech pace per session (wpm)</SectionLabel>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          {/* Ideal range reference band */}
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(249,193,37,0.75)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tickCount={5}
            domain={[
              (dataMin: number) => Math.floor(dataMin / 10) * 10,
              (dataMax: number) => Math.ceil(dataMax / 10) * 10 + 10,
            ]}
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
      <p className="text-[11px] text-white/25 mt-1">Ideal range: 110–160 wpm</p>
    </div>
  )
}

export function CategoryChart({ data }: { data: CategoryStat[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-white/30 text-xs">
        No category data yet
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.avgFillers - a.avgFillers)

  return (
    <div className="p-5" style={INNER_CARD}>
      <SectionLabel>Avg filler words by question category</SectionLabel>
      <div className="space-y-2.5 mt-1">
        {sorted.map((cat) => {
          const max = sorted[0].avgFillers || 1
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
}
