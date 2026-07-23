'use client'
import { useState } from 'react'

const CARD_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(249,193,37,0.08)',
  border: '1px solid rgba(249,193,37,0.35)',
  borderRadius: '0.5rem',
  color: '#F9C125',
  width: '100%',
  padding: '0.375rem 0.625rem',
  fontSize: '0.875rem',
  outline: 'none',
}

export function ProfileEditCard({
  initialRoleType,
  initialInterviewDate,
}: {
  initialRoleType: string | null
  initialInterviewDate: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [roleType, setRoleType] = useState(initialRoleType ?? '')
  const [interviewDate, setInterviewDate] = useState(initialInterviewDate ?? '')
  const [saving, setSaving] = useState(false)

  function formatDate(iso: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function save() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_type: roleType || null,
        interview_date: interviewDate || null,
      }),
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="p-4" style={CARD_STYLE}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-semibold text-[#F9C125] uppercase tracking-widest">Your info</p>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs text-white/50 hover:text-[#F9C125] transition-colors">
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-white/50 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-semibold text-[#F9C125] hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Role</label>
            <input style={INPUT_STYLE} value={roleType} onChange={e => setRoleType(e.target.value)} placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Interview date</label>
            <input type="date" style={INPUT_STYLE} value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
          </div>
        </div>
      ) : (
        <>
          <p className="text-[10px] text-white/40 mb-0.5">Role</p>
          <p className="text-sm font-semibold text-[#F9C125] mb-2 truncate">{roleType || '—'}</p>
          <p className="text-[10px] text-white/40 mb-0.5">Interview date</p>
          <p className="text-sm font-semibold text-[#F9C125]">{formatDate(interviewDate)}</p>
        </>
      )}
    </div>
  )
}
