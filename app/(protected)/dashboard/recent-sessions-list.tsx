'use client'

import { useState } from 'react'
import { SessionRow } from './session-row'
import type { Session } from '@/types/database'

export function RecentSessionsList({ sessions, scores }: { sessions: Session[]; scores?: Record<string, number | null> }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? sessions : sessions.slice(0, 5)
  const hidden = sessions.length - 5

  return (
    <div className="space-y-3">
      {visible.map((session) => (
        <SessionRow key={session.id} session={session} yourScore={scores?.[session.id] ?? null} />
      ))}
      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 text-xs font-semibold text-[#F9C125] hover:brightness-110 transition-colors"
          style={{
            background: 'rgba(249,193,37,0.05)',
            border: '1px solid rgba(249,193,37,0.12)',
            borderRadius: '0.75rem',
          }}
        >
          View {hidden} more session{hidden === 1 ? '' : 's'}
        </button>
      )}
      {showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2.5 text-xs font-semibold text-[#F9C125] hover:brightness-110 transition-colors"
          style={{
            background: 'rgba(249,193,37,0.05)',
            border: '1px solid rgba(249,193,37,0.12)',
            borderRadius: '0.75rem',
          }}
        >
          Show less
        </button>
      )}
    </div>
  )
}
