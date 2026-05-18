'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIER_LABEL: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }
const TIER_SESSIONS: Record<string, string> = {
  free: '2 sessions / month',
  student: '12 sessions / month',
  pro: '30 sessions / month',
}

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(28,10,0,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const inputClass =
  'w-full rounded-lg px-3 py-2 text-sm text-[#F9C125] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#F9C125]/30 transition-colors'

const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(249,193,37,0.08)',
  border: '1px solid rgba(249,193,37,0.30)',
}

const readonlyStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(249,193,37,0.12)',
}

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70'

type Props = {
  fullName: string | null
  email: string
  initialAge: number | null
  initialRoleType: string | null
  initialInterviewDate: string | null
  initialBiggestWeakness: string | null
  tier: string
  sessionsUsed: number
  sessionsLimit: number
}

export function ProfileForm({
  fullName,
  email,
  initialAge,
  initialRoleType,
  initialInterviewDate,
  initialBiggestWeakness,
  tier,
  sessionsUsed,
  sessionsLimit,
}: Props) {
  const [age, setAge] = useState(initialAge?.toString() ?? '')
  const [roleType, setRoleType] = useState(initialRoleType ?? '')
  const [interviewDate, setInterviewDate] = useState(initialInterviewDate ?? '')
  const [biggestWeakness, setBiggestWeakness] = useState(initialBiggestWeakness ?? '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age, role_type: roleType, interview_date: interviewDate, biggest_weakness: biggestWeakness }),
    })
    setSaving(false)
    setSaveMsg(res.ok ? 'Saved!' : 'Failed to save. Try again.')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) { setPasswordMsg('Passwords do not match.'); return }
    if (newPassword.length < 6) { setPasswordMsg('Password must be at least 6 characters.'); return }
    setChangingPassword(true)
    setPasswordMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      setPasswordMsg(error.message)
    } else {
      setPasswordMsg('Password updated!')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Personal info */}
      <div style={CARD_STYLE}>
        <div className="p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Full name <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40 normal-case tracking-normal">locked</span>
              </label>
              <input readOnly value={fullName ?? ''} className={inputClass} style={readonlyStyle} />
            </div>

            <div>
              <label className={labelClass}>
                Email <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40 normal-case tracking-normal">locked</span>
              </label>
              <input readOnly value={email} className={inputClass} style={readonlyStyle} />
            </div>

            <div>
              <label className={labelClass}>Age</label>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="e.g. 22"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              {!showPasswordForm ? (
                <div className="flex items-center gap-3">
                  <input readOnly value="••••••••••••" className={`${inputClass} flex-1`} style={readonlyStyle} />
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="shrink-0 rounded-lg border border-[#F9C125]/40 px-3 py-2 text-xs font-semibold text-[#F9C125] hover:bg-[#F9C125]/10 transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2 rounded-lg p-3" style={{ border: '1px solid rgba(249,193,37,0.25)', backgroundColor: 'rgba(249,193,37,0.05)' }}>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="rounded-lg bg-[#F9C125] px-3 py-1.5 text-xs font-bold text-[#1C0A00] hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {changingPassword ? 'Updating…' : 'Update password'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null) }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs ${passwordMsg === 'Password updated!' ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordMsg}
                    </p>
                  )}
                </div>
              )}
              {passwordMsg && !showPasswordForm && (
                <p className="mt-1 text-xs text-green-400">{passwordMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interview preferences */}
      <div style={CARD_STYLE}>
        <div className="p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">
            Interview Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Desired job / role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass}>Interview date</label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass}>Biggest weakness to work on</label>
              <textarea
                rows={3}
                placeholder="e.g. I tend to overexplain..."
                value={biggestWeakness}
                onChange={(e) => setBiggestWeakness(e.target.value)}
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#F9C125] px-5 py-2 text-sm font-bold text-[#1C0A00] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div style={CARD_STYLE}>
        <div className="p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">
            Subscription
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">{TIER_LABEL[tier] ?? tier} Plan</p>
              <p className="mt-1 text-sm text-[#F9C125]/70">{TIER_SESSIONS[tier]}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#F9C125]/70">Used this month</p>
              <p className="text-2xl font-bold text-white">
                {sessionsUsed}{' '}
                <span className="text-sm font-normal text-white/50">/ {sessionsLimit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
