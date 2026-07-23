'use client'

import { GrainGradient } from '@paper-design/shaders-react'
import type { ReactNode } from 'react'

// ── Brand tokens ────────────────────────────────────────────────────────────
const GOLD = '#F9C125'
const NAVY = '#080d1a'

// ── Sub-components ───────────────────────────────────────────────────────────

function FieldBox({
  label,
  type = 'text',
  placeholder,
  children,
}: {
  label: string
  type?: string
  placeholder?: string
  children?: ReactNode
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: GOLD }}
      >
        {label}
      </span>
      {children ?? (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-white/20"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        />
      )}
    </label>
  )
}

// ── Stats strip shown on the right panel ────────────────────────────────────
const STATS = [
  { value: '8', label: 'Answer formats' },
  { value: '200+', label: 'Interview questions' },
  { value: '3', label: 'Metrics per answer' },
]

// ── Exported component ───────────────────────────────────────────────────────

export default function AuthSectionOne({
  mode = 'signup',
  formSlot,
}: {
  /** 'signup' or 'login' — drives the heading copy */
  mode?: 'signup' | 'login'
  /** Drop your actual form here (hCaptcha, Supabase, etc.) */
  formSlot?: ReactNode
}) {
  const isSignup = mode === 'signup'

  return (
    <section
      className="h-screen overflow-hidden p-3 antialiased [font-synthesis:none]"
      style={{ backgroundColor: NAVY }}
    >
      <div className="grid h-[calc(100vh-1.5rem)] gap-3 lg:grid-cols-[1fr_1.1fr]">

        {/* ── Left: dark blue liquid glass form panel ── */}
        <div
          className="relative flex h-full items-center overflow-hidden rounded-2xl px-6 sm:px-10 lg:px-14 xl:px-20"
          style={{
            background: 'linear-gradient(145deg, rgba(8,14,36,0.97) 0%, rgba(5,9,20,0.95) 55%, rgba(7,12,30,0.96) 100%)',
            backdropFilter: 'blur(56px) saturate(200%) brightness(1.10)',
            WebkitBackdropFilter: 'blur(56px) saturate(200%) brightness(1.10)',
            border: '1px solid rgba(249,193,37,0.18)',
            boxShadow: [
              'inset 0 1.5px 0 rgba(249,193,37,0.22)',
              'inset 0 -1px 0 rgba(249,193,37,0.06)',
              'inset 1px 0 0 rgba(255,255,255,0.06)',
              'inset -1px 0 0 rgba(255,255,255,0.02)',
              '0 24px 80px rgba(0,0,0,0.65)',
              '0 0 0 1px rgba(249,193,37,0.04)',
            ].join(', '),
          }}
        >
          {/* Gold tint — top-right */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,193,37,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }}
          />
          {/* Gold tint — bottom-left */}
          <div
            className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,193,37,0.09) 0%, transparent 65%)', filter: 'blur(44px)' }}
          />
          {/* Faint gold wash — centre */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 80%, rgba(249,193,37,0.05) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[440px]">

            {/* Wordmark */}
            <p
              className="mb-6 text-sm font-bold tracking-widest"
              style={{ color: GOLD }}
            >
              INTERVISE
            </p>

            {/* Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: GOLD }}>
              {isSignup
                ? 'Start practising interviews in under 2 minutes.'
                : 'Pick up right where you left off.'}
            </p>

            {/* Form — slot for real auth form, or demo skeleton */}
            <div className="mt-7">
              {formSlot ?? (
                <div className="space-y-4">
                  <FieldBox label="Email" type="email" placeholder="you@example.com" />
                  <FieldBox label="Password" type="password" placeholder="••••••••••" />

                  <button
                    type="button"
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition-all hover:brightness-110"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {isSignup ? 'Create account →' : 'Sign in →'}
                  </button>

                  <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isSignup ? (
                      <>Already have an account?{' '}
                        <a href="/login" className="font-semibold underline" style={{ color: GOLD }}>Sign in</a>
                      </>
                    ) : (
                      <>No account?{' '}
                        <a href="/signup" className="font-semibold underline" style={{ color: GOLD }}>Sign up free</a>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Right: gradient visual panel ── */}
        <div
          className="relative flex h-full overflow-hidden rounded-2xl p-8 text-white sm:p-12"
          style={{ backgroundColor: NAVY }}
        >
          {/* Gold aurora grain gradient */}
          <GrainGradient
            speed={0.6}
            scale={1}
            rotation={15}
            offsetX={0}
            offsetY={0}
            softness={0.6}
            intensity={0.55}
            noise={0.22}
            shape="corners"
            frame={1200}
            colors={[GOLD, '#c98e00', '#5c3d00', NAVY]}
            colorBack={NAVY}
            className="absolute inset-0"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">

            {/* Headline */}
            <h2
              className="max-w-[560px] pt-0 text-5xl font-bold tracking-[-0.04em] leading-[1.02] text-white sm:text-6xl lg:pt-12 lg:text-[60px] xl:text-[68px]"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}
            >
              Speak with<br />
              confidence.<br />
              Land the role.
            </h2>

            {/* Stats strip */}
            <div className="mb-0 xl:mb-20">
              <div className="mb-6 flex flex-wrap gap-6">
                {STATS.map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.60)' }}>{s.value}</p>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 6px rgba(0,0,0,0.70)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <p
                className="max-w-sm text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.80)', textShadow: '0 1px 8px rgba(0,0,0,0.65)' }}
              >
                Practise with AI-powered feedback on your fluency, accuracy, and structure — then walk into your interview ready.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
