'use client'

import { useState, useEffect } from 'react'
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

  // Auto-generate on first load if no cached summary
  useEffect(() => {
    if (!initialSummary) {
      generate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        {summary && (
          <button
            onClick={generate}
            disabled={loading}
            className="shrink-0 rounded-lg p-2 text-white/25 transition-all hover:text-white/50 disabled:opacity-40"
            title="Refresh analysis"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400/80">{error}</p>
      )}

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded-full bg-white/10 w-full" />
          <div className="h-3 rounded-full bg-white/10 w-5/6" />
          <div className="h-3 rounded-full bg-white/10 w-4/5" />
          <div className="h-3 rounded-full bg-white/10 w-3/4" />
        </div>
      )}

      {!loading && summary && (
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
        <p className="text-[11px] text-white/25">Last analysed {formattedDate}</p>
      )}
    </div>
  )
}
