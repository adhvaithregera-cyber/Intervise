'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const TIER_LABEL: Record<string, string> = { free: 'Free', student: 'Student', pro: 'Pro' }
const TIER_SESSIONS: Record<string, string> = {
  free: '2 sessions / month',
  student: '10 sessions / month',
  pro: '30 sessions / month',
}
const TIER_BADGE: Record<string, 'gray' | 'brand' | 'green'> = {
  free: 'gray', student: 'brand', pro: 'green',
}

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

const inputClass =
  'w-full rounded-lg border border-[#6BA3C8] bg-white px-3 py-2 text-sm text-[#E07A2F] placeholder-[#6BA3C8] focus:border-[#F9C125] focus:outline-none focus:ring-2 focus:ring-[#F9C125]/20 transition-colors'

const readonlyClass =
  'w-full rounded-lg border border-[#6BA3C8]/40 bg-[#FEFDF0]/60 px-3 py-2 text-sm text-[#E07A2F] cursor-not-allowed'

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

  // Password change state
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
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.')
      return
    }
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
      <Card>
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6BA3C8]">
            Personal Information
          </h2>
          <div className="space-y-4">
            {/* Full name — read only */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#6BA3C8]">
                Full name
                <span className="rounded bg-[#6BA3C8]/10 px-1.5 py-0.5 text-[10px] text-[#6BA3C8]">locked</span>
              </label>
              <input readOnly value={fullName ?? ''} className={readonlyClass} />
            </div>

            {/* Email — read only */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#6BA3C8]">
                Email
                <span className="rounded bg-[#6BA3C8]/10 px-1.5 py-0.5 text-[10px] text-[#6BA3C8]">locked</span>
              </label>
              <input readOnly value={email} className={readonlyClass} />
            </div>

            {/* Age */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6BA3C8]">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="e.g. 22"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6BA3C8]">Password</label>
              {!showPasswordForm ? (
                <div className="flex items-center gap-3">
                  <input readOnly value="••••••••••••" className={`${readonlyClass} flex-1`} />
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="shrink-0 rounded-lg border border-[#6BA3C8] px-3 py-2 text-xs font-semibold text-[#E07A2F] hover:bg-[#FEFDF0] transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2 rounded-lg border border-[#6BA3C8]/40 p-3">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="rounded-lg bg-[#E07A2F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#C96A1A] disabled:opacity-50 transition-colors"
                    >
                      {changingPassword ? 'Updating…' : 'Update password'}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null) }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6BA3C8] hover:text-[#E07A2F] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs ${passwordMsg === 'Password updated!' ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordMsg}
                    </p>
                  )}
                </div>
              )}
              {passwordMsg && !showPasswordForm && (
                <p className="mt-1 text-xs text-green-600">{passwordMsg}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Interview preferences — editable */}
      <Card>
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6BA3C8]">
            Interview Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6BA3C8]">Desired job / role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6BA3C8]">Interview date</label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6BA3C8]">Biggest weakness to work on</label>
              <textarea
                rows={3}
                placeholder="e.g. I tend to overexplain..."
                value={biggestWeakness}
                onChange={(e) => setBiggestWeakness(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#E07A2F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C96A1A] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card>
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6BA3C8]">
            Subscription
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#E07A2F]">
                  {TIER_LABEL[tier] ?? tier} Plan
                </span>
                <Badge variant={TIER_BADGE[tier] ?? 'gray'}>{TIER_LABEL[tier] ?? tier}</Badge>
              </div>
              <p className="mt-1 text-sm text-[#6BA3C8]">{TIER_SESSIONS[tier]}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#6BA3C8]">Used this month</p>
              <p className="text-lg font-bold text-[#E07A2F]">
                {sessionsUsed}{' '}
                <span className="text-sm font-normal text-[#6BA3C8]">/ {sessionsLimit}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
