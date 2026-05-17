'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.session) {
      // Email confirmation disabled — user is immediately signed in
      window.location.href = '/onboarding'
    } else {
      // Email confirmation required — show check-your-inbox screen
      setConfirmed(true)
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-[#ADBBDA] bg-[#EDE8F5]/50 px-3 py-2.5 text-sm text-[#3D52A0] placeholder-[#8697C4] focus:border-[#7091E6] focus:outline-none focus:ring-2 focus:ring-[#7091E6]/20"

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-[#ADBBDA] bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE8F5]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D52A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#3D52A0]">Check your inbox</h2>
        <p className="mb-6 text-sm text-[#8697C4]">
          We sent a confirmation link to <span className="font-semibold text-[#3D52A0]">{email}</span>. Click it to activate your account and get started.
        </p>
        <p className="text-xs text-[#ADBBDA]">
          Already confirmed?{' '}
          <Link href="/login" className="font-semibold text-[#3D52A0] hover:text-[#7091E6]">Log in</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#ADBBDA] bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-widest text-[#3D52A0]">INTERVISE</Link>
        <p className="mt-4 text-2xl font-bold text-[#3D52A0]">Create your account</p>
        <p className="mt-1 text-sm text-[#8697C4]">Start practising interviews for free</p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ADBBDA] bg-white px-4 py-2.5 text-sm font-semibold text-[#3D52A0] hover:bg-[#EDE8F5] transition-colors shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#ADBBDA]" />
        </div>
        <div className="relative flex justify-center text-xs text-[#8697C4]">
          <span className="bg-white px-2">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#3D52A0] mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3D52A0] mb-1">Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min. 8 characters" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8697C4]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#3D52A0] hover:text-[#7091E6]">Log in</Link>
      </p>
    </div>
  )
}
