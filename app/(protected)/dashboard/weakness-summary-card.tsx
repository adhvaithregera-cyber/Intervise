'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  initialSummary: string | null
  initialSummaryAt: string | null
}

export function WeaknessSummaryCard({ initialSummary, initialSummaryAt }: Props) {
  const [summary, setSummary] = useState(initialSummary)
  const [summaryAt, setSummaryAt] = useState(initialSummaryAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/weakness-summary', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate summary')
      }
      const data = await res.json()
      setSummary(data.summary)
      setSummaryAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = summaryAt
    ? new Date(summaryAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div
      className="p-6 space-y-4"
      style={{
        backgroundColor: 'rgba(8,13,26,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(249,193,37,0.20)',
        borderRadius: '1rem',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F9C125]/60 mb-1">Pro</p>
          <h2 className="text-xl font-semibold text-white">Your Biggest Weakness</h2>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#F9C125] transition-all hover:brightness-110 disabled:opacity-50"
          style={{ border: '1px solid rgba(249,193,37,0.25)', backgroundColor: 'rgba(249,193,37,0.08)' }}
          title="Regenerate"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {summary ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400/80">{error}</p>
      )}

      {loading && !summary && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded-full bg-white/10 w-full" />
          <div className="h-3 rounded-full bg-white/10 w-5/6" />
          <div className="h-3 rounded-full bg-white/10 w-4/5" />
          <div className="h-3 rounded-full bg-white/10 w-3/4" />
        </div>
      )}

      {!loading && !summary && !error && (
        <p className="text-sm text-white/40">
          Generate a personalised weakness summary based on your last 10 sessions.
        </p>
      )}

      {summary && (
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(249,193,37,0.12)',
            borderLeft: '3px solid rgba(249,193,37,0.6)',
          }}
        >
          <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
        </div>
      )}

      {formattedDate && !loading && (
        <p className="text-[11px] text-white/25">Last generated {formattedDate}</p>
      )}
    </div>
  )
}
