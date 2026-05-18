'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(249,193,37,0.13)',
  borderRadius: '1rem',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400', B: 'text-[#F9C125]', C: 'text-amber-400', D: 'text-orange-400', F: 'text-red-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function SessionRow({
  session,
}: {
  session: {
    id: string
    name: string | null
    difficulty: string
    overall_grade: string | null
    completed_at: string | null
  }
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(session.name ?? '')
  const [savedName, setSavedName] = useState(session.name ?? '')
  const [saving, setSaving] = useState(false)

  const displayName = savedName || `${session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)} session`

  async function saveName() {
    setSaving(true)
    await fetch('/api/session/name', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id, name }),
    })
    setSavedName(name)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') { setName(savedName); setEditing(false) }
  }

  return (
    <div className="flex items-center justify-between p-5" style={CARD_STYLE}>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Session name..."
              className="flex-1 min-w-0 rounded-lg px-3 py-1 text-sm font-semibold text-white outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(249,193,37,0.4)',
              }}
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="text-xs font-semibold text-[#F9C125] hover:text-white transition-colors shrink-0 disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => { setName(savedName); setEditing(false) }}
              className="text-xs text-white/40 hover:text-white transition-colors shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <Link href={`/session/report/${session.id}`} className="text-sm font-semibold text-white hover:text-[#F9C125] transition-colors truncate">
              {displayName}
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              title="Rename"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        )}
        <p className="text-xs text-white/40 mt-0.5">{session.completed_at ? formatDate(session.completed_at) : '—'}</p>
      </div>
      {session.overall_grade ? (
        <span className={`text-2xl font-bold ml-4 ${GRADE_COLORS[session.overall_grade] ?? 'text-white/55'}`}>
          {session.overall_grade}
        </span>
      ) : (
        <Badge variant="gray">No grade</Badge>
      )}
    </div>
  )
}
