'use client'

import { useState } from 'react'

const TIER_LABEL: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }
const TIER_SESSIONS: Record<string, string> = {
  free: '2 / month',
  student: '12 / month',
  pro: '30 / month',
}

// Deep, solid dark card — no blur, barely-there border
const CARD: React.CSSProperties = {
  backgroundColor: '#0d1220',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.25rem',
}

// Editable input — gold tint on focus
const inputClass =
  'w-full rounded-xl px-3.5 py-2.5 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#F9C125]/50 transition-all'
const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
}
const readonlyStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.05)',
}
// Field input labels — subtle grey
const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-white/35'
// Section headings — bright gold
const sectionLabelClass = 'mb-3 block text-[11px] font-semibold uppercase tracking-widest text-[#F9C125]'

type Props = {
  fullName: string | null
  email: string
  initialAge: number | null
  initialRoleType: string | null
  initialInterviewDate: string | null
  initialBiggestWeakness: string | null
  initialExperienceLevel: string | null
  initialInterviewType: string | null
  initialPracticeFrequency: string | null
  initialJobChallenge: string | null
  tier: string
  sessionsUsed: number
  sessionsLimit: number
  subscriptionStatus: string | null
  tierExpiresAt: string | null
  hasActiveSubscription: boolean
}

function InfoTile({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 shrink-0">{label}:</span>
      <span className="text-xs font-medium text-white/75">{value}</span>
    </div>
  )
}

export function ProfileForm({
  fullName,
  email,
  initialAge,
  initialRoleType,
  initialInterviewDate,
  initialBiggestWeakness,
  initialExperienceLevel,
  initialInterviewType,
  initialPracticeFrequency,
  initialJobChallenge,
  tier,
  sessionsUsed,
  sessionsLimit,
  subscriptionStatus,
  tierExpiresAt,
  hasActiveSubscription,
}: Props) {
  const [fullNameValue, setFullNameValue] = useState(fullName ?? '')
  const [savingName, setSavingName] = useState(false)

  const [age, setAge] = useState(initialAge?.toString() ?? '')
  const [roleType, setRoleType] = useState(initialRoleType ?? '')
  const [interviewDate, setInterviewDate] = useState(
    initialInterviewDate ? initialInterviewDate.split('T')[0] : ''
  )
  const [biggestWeakness, setBiggestWeakness] = useState(initialBiggestWeakness ?? '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [cancelling, setCancelling] = useState(false)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  const initials = (fullNameValue || fullName || email)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

  async function saveFullName() {
    if (!fullNameValue.trim()) return
    setSavingName(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullNameValue.trim() }),
    })
    setSavingName(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_type: roleType || undefined,
        interview_date: interviewDate || undefined,
        biggest_weakness: biggestWeakness || undefined,
        ...(age !== '' && !isNaN(Number(age)) && { age: Number(age) }),
      }),
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
    const res = await fetch('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    const data = await res.json().catch(() => ({}))
    setChangingPassword(false)
    if (!res.ok) {
      setPasswordMsg((data as { error?: string }).error ?? 'Failed to update password.')
    } else {
      setPasswordMsg('Password updated!')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    setCancelMsg(null)
    const res = await fetch('/api/payments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ immediately: false }),
    })
    setCancelling(false)
    setShowCancelConfirm(false)
    if (res.ok) {
      setCancelMsg('Cancelled. Your plan stays active until the billing period ends.')
    } else {
      const data = await res.json().catch(() => ({}))
      setCancelMsg((data as { error?: string }).error ?? 'Failed to cancel. Please try again.')
    }
  }

  const hasOnboardingData = initialExperienceLevel || initialInterviewType || initialPracticeFrequency || initialJobChallenge
  const sessionsPct = Math.min(100, Math.round((sessionsUsed / sessionsLimit) * 100))

  return (
    <div className="grid h-full gap-3 lg:grid-cols-[320px_1fr]">

      {/* ── Left column ── */}
      <div className="flex h-full flex-col gap-3">

        {/* Personal info card */}
        <div style={CARD} className="flex-1 min-h-0 overflow-y-auto p-5">

          {/* Avatar + display name */}
          <div className="mb-5 flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-[#080d1a]"
              style={{ background: 'linear-gradient(135deg, #F9C125 0%, #c98e00 100%)' }}
            >
              {initials || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-white/90">
                {fullNameValue || fullName || 'No name set'}
              </p>
              <p className="truncate text-xs text-white/35">{email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          <p className={sectionLabelClass}>Personal</p>

          <div className="space-y-3">
            {/* Full name */}
            <div>
              <label className={labelClass}>Full name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullNameValue}
                  onChange={e => setFullNameValue(e.target.value)}
                  className={`${inputClass} flex-1`}
                  style={inputStyle}
                />
                {fullNameValue.trim() && fullNameValue.trim() !== (fullName ?? '') && (
                  <button
                    onClick={saveFullName}
                    disabled={savingName}
                    className="shrink-0 rounded-xl bg-[#F9C125] px-3.5 py-2 text-xs font-bold text-[#080d1a] hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {savingName ? '…' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email&nbsp;
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] normal-case tracking-normal"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.30)' }}
                >
                  locked
                </span>
              </label>
              <input readOnly value={email} className={inputClass} style={readonlyStyle} />
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>Password</label>
              {!showPasswordForm ? (
                <div className="flex items-center gap-2">
                  <input readOnly value="••••••••••••" className={`${inputClass} flex-1`} style={readonlyStyle} />
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
                    style={{ border: '1px solid rgba(249,193,37,0.25)', color: 'rgba(249,193,37,0.75)' }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  className="space-y-2 rounded-xl p-3"
                  style={{ backgroundColor: 'rgba(249,193,37,0.04)', border: '1px solid rgba(249,193,37,0.15)' }}
                >
                  <input type="password" placeholder="New password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} className={inputClass} style={inputStyle} />
                  <input type="password" placeholder="Confirm new password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} className={inputClass} style={inputStyle} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={handlePasswordChange} disabled={changingPassword}
                      className="rounded-xl bg-[#F9C125] px-3.5 py-1.5 text-xs font-bold text-[#080d1a] hover:brightness-110 disabled:opacity-50 transition-all">
                      {changingPassword ? 'Updating…' : 'Update'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null) }}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium text-white/35 hover:text-white/70 transition-colors"
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
                <p className="mt-1.5 text-xs text-green-400">{passwordMsg}</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div style={CARD} className="shrink-0 p-5">
          <p className={sectionLabelClass}>Plan</p>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Tier badge */}
              <span
                className="rounded-xl px-3 py-1.5 text-xs font-bold"
                style={
                  tier === 'free'
                    ? { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }
                    : { backgroundColor: 'rgba(249,193,37,0.13)', color: '#F9C125' }
                }
              >
                {TIER_LABEL[tier] ?? tier}
              </span>
              <span className="text-xs text-white/35">{TIER_SESSIONS[tier]}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white/90">{sessionsUsed}</span>
              <span className="text-xs text-white/30"> / {sessionsLimit}</span>
            </div>
          </div>

          {/* Sessions bar */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{ width: `${sessionsPct}%`, backgroundColor: sessionsPct > 90 ? '#ef4444' : '#F9C125' }}
            />
          </div>

          {subscriptionStatus === 'cancelled' && tierExpiresAt && (
            <p className="mt-2.5 text-xs text-amber-400/80">
              Cancelled — access until {new Date(tierExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {subscriptionStatus === 'halted' && (
            <p className="mt-2.5 text-xs text-red-400/80">
              Payment failed —{' '}
              <a href="/upgrade" className="underline underline-offset-2 hover:text-red-300 transition-colors">renew here</a>.
            </p>
          )}

          {tier === 'free' && (
            <a
              href="/upgrade"
              className="mt-3.5 inline-block rounded-xl bg-[#F9C125] px-4 py-2 text-xs font-bold text-[#080d1a] hover:brightness-110 transition-all"
            >
              Upgrade plan
            </a>
          )}

          {hasActiveSubscription && !showCancelConfirm && (
            <button onClick={() => setShowCancelConfirm(true)} className="mt-3 block text-xs text-white/25 hover:text-red-400/80 transition-colors">
              Cancel subscription
            </button>
          )}
          {showCancelConfirm && (
            <div
              className="mt-3.5 rounded-xl p-4 space-y-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}
            >
              <p className="text-sm text-white/70">Your plan stays active until the billing period ends.</p>
              <div className="flex gap-2">
                <button onClick={handleCancel} disabled={cancelling}
                  className="rounded-xl bg-red-500/70 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-500/90 disabled:opacity-50 transition-all">
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button onClick={() => setShowCancelConfirm(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-white/35 hover:text-white/70 transition-colors">
                  Keep it
                </button>
              </div>
            </div>
          )}
          {cancelMsg && (
            <p className={`mt-2.5 text-xs ${cancelMsg.startsWith('Cancelled') ? 'text-green-400/80' : 'text-red-400/80'}`}>
              {cancelMsg}
            </p>
          )}
        </div>

      </div>

      {/* ── Right column: Interview Profile ── */}
      <div style={CARD} className="h-full p-5">

        <p className={sectionLabelClass}>Interview Profile</p>

        {/* Target fields */}
        <div className="mt-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Target role</label>
              <input type="text" placeholder="e.g. Software Engineer"
                value={roleType} onChange={e => setRoleType(e.target.value)}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input type="number" min={16} max={100} placeholder="e.g. 22"
                value={age} onChange={e => setAge(e.target.value)}
                className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Interview date</label>
            <input type="date" value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Weakness */}
        <div>
          <label className={labelClass}>Biggest weakness to work on</label>
          <textarea rows={2} placeholder="e.g. I tend to overexplain..."
            value={biggestWeakness} onChange={e => setBiggestWeakness(e.target.value)}
            className={`${inputClass} resize-none`} style={inputStyle} />
        </div>

        {/* Save */}
        <div className="mt-3 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-[#F9C125] px-5 py-2 text-sm font-bold text-[#080d1a] hover:brightness-110 disabled:opacity-50 transition-all">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-green-400/80' : 'text-red-400/80'}`}>
              {saveMsg}
            </span>
          )}
        </div>

        {/* Onboarding data */}
        {hasOnboardingData && (
          <>
            <div className="my-3 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <p className={sectionLabelClass}>From your onboarding</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <InfoTile label="Experience" value={initialExperienceLevel} />
              <InfoTile label="Interview type" value={initialInterviewType} />
              <InfoTile label="Practice frequency" value={initialPracticeFrequency} />
              <InfoTile label="Biggest challenge" value={initialJobChallenge} />
            </div>
          </>
        )}

      </div>

    </div>
  )
}
