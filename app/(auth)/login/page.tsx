'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState } from 'react'
import type HCaptchaType from '@hcaptcha/react-hcaptcha'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HCaptcha = dynamic(() => import('@hcaptcha/react-hcaptcha'), { ssr: false }) as any

const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Wrong email or password. Please try again.',
  'Email not confirmed': 'Please confirm your email first — check your inbox for the link we sent.',
  'Too many requests': 'Too many attempts. Please wait a moment and try again.',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptchaType>(null)

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!captchaToken) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })

    // Always reset the widget so the token can't be reused
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)

    if (error) {
      setError(FRIENDLY_ERRORS[error.message] ?? error.message)
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const inputClass = "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#F9C125] focus:outline-none focus:ring-2 focus:ring-[#F9C125]/15"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-[rgba(249,193,37,0.18)] bg-[rgba(8,13,26,0.85)] backdrop-blur-xl p-5 sm:p-8 shadow-2xl"
    >
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-widest text-[#F9C125]">INTERVISE</Link>
        <p className="mt-4 text-2xl font-bold text-white">Welcome back</p>
        <p className="mt-1 text-sm text-white/55">Log in to continue practising</p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors shadow-sm"
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
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs text-white/40">
          <span className="bg-[rgba(8,13,26,0.85)] px-2">or log in with email</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Your password" />
        </div>

        <div className="flex justify-center">
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={(token: string) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" fullWidth disabled={loading || !captchaToken}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-[#F9C125] hover:text-[#F9C125]/80">Sign up free</Link>
      </p>
    </motion.div>
  )
}
