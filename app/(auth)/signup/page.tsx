'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type HCaptchaType from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/lib/supabase/client'
import AuthSectionOne from '@/components/ui/auth-section-1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HCaptcha = dynamic(() => import('@hcaptcha/react-hcaptcha'), { ssr: false }) as any

const inputClass =
  'w-full rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-white/20'
const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
}
const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#F9C125]'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptchaType>(null)

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaToken) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { captchaToken },
    })
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
    if (error) { setError(error.message); setLoading(false); return }
    if (data.session) {
      window.location.href = '/onboarding'
    } else {
      setConfirmed(true)
      setLoading(false)
    }
  }

  // ── Check-your-inbox state ────────────────────────────────────────────────
  if (confirmed) {
    return (
      <AuthSectionOne
        mode="signup"
        formSlot={
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(249,193,37,0.15)', border: '1px solid rgba(249,193,37,0.30)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F9C125" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Check your inbox</h2>
            <p className="mb-4 text-sm text-white/50">
              Confirmation link sent to{' '}
              <span className="font-semibold text-[#F9C125]">{email}</span>
            </p>
            <Link href="/login" className="text-sm font-semibold text-[#F9C125] hover:brightness-110">
              Already confirmed? Log in →
            </Link>
          </div>
        }
      />
    )
  }

  // ── Main form slot ────────────────────────────────────────────────────────
  const formSlot = (
    <div className="space-y-4">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white/80 transition-all hover:text-white"
        style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

{/* Email + password */}
      <form onSubmit={handleEmailSignup} className="space-y-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email" required value={email} placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
            className={inputClass} style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password" required minLength={8} value={password} placeholder="Min. 8 characters"
            onChange={e => setPassword(e.target.value)}
            className={inputClass} style={inputStyle}
          />
        </div>

        <div className="flex justify-center pt-1">
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={(token: string) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !captchaToken}
          className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-40"
          style={{ backgroundColor: '#F9C125', color: '#080d1a' }}
        >
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>

      <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold underline" style={{ color: '#F9C125' }}>
          Log in
        </Link>
      </p>
    </div>
  )

  return <AuthSectionOne mode="signup" formSlot={formSlot} />
}
