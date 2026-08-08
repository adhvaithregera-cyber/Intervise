'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

function useVisible(margin = '-60px') {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: margin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [margin])
  return [ref, visible] as const
}

const WORKFLOW_STEPS = [
  {
    number: '①',
    label: 'Dashboard',
    caption: 'Two free sessions a month.',
    src: '/screenshots/dashboard.png',
    alt: 'Intervise dashboard showing session quota and start button',
  },
  {
    number: '②',
    label: 'Setup',
    caption: 'Pick your difficulty and grant mic access.',
    src: '/screenshots/setup.png',
    alt: 'Session setup page showing difficulty selector and microphone grant',
  },
  {
    number: '③',
    label: 'Briefing',
    caption: 'Learn your answer format before the timer starts.',
    src: '/screenshots/briefing.png',
    alt: 'Session briefing card showing STAR answer format breakdown',
  },
  {
    number: '④',
    label: 'Live Session',
    caption: 'Answer under a countdown timer, recorded by your browser mic.',
    src: '/screenshots/live-session.png',
    alt: 'Live session with countdown timer bar and recording indicator',
  },
  {
    number: '⑤',
    label: 'Report',
    caption: 'Your grade, WPM, and filler count are ready when you finish.',
    src: '/screenshots/report-stats.png',
    alt: 'Session report showing grade, WPM and filler word statistics',
  },
]

const PREMIUM_FEATURES = [
  {
    tier: 'Student',
    tierColor: '#F9C125',
    tierBg: 'rgba(249,193,37,0.15)',
    title: 'AI Feedback',
    description:
      'Per-answer STAR scores, a grammar check, an ideal answer, and a coaching tip.',
    src: '/screenshots/report-ai-feedback.png',
    alt: 'AI feedback card showing STAR component scores and coaching tip',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  {
    tier: 'Student',
    tierColor: '#F9C125',
    tierBg: 'rgba(249,193,37,0.15)',
    title: 'Progress Over Time',
    description:
      'WPM and filler trends tracked across every session on your dashboard.',
    src: '/screenshots/dashboard-progress.png',
    alt: 'Dashboard showing WPM and filler word trend charts across sessions',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  {
    tier: 'Pro',
    tierColor: '#F96437',
    tierBg: 'rgba(249,100,37,0.2)',
    title: 'Hard & Mixed Difficulty',
    description:
      'Unlock harder questions and mixed-format sessions for a closer simulation of a real interview.',
    src: '/screenshots/setup-difficulty-pro.png',
    alt: 'Setup page showing all difficulty levels unlocked for Pro users',
    borderColor: 'rgba(249,193,37,0.3)',
  },
]

function ScreenshotFrame({
  src,
  alt,
  delay,
}: {
  src: string
  alt: string
  delay: number
}) {
  const [ref, visible] = useVisible('-60px')

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        border: '1px solid rgba(249,193,37,0.22)',
        aspectRatio: '16/10',
        background: 'rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        style={{ boxShadow: '0 0 40px rgba(249,193,37,0.12)' }}
      />
    </div>
  )
}

export function AppPreview() {
  const [headingRef, headingVisible] = useVisible('-60px')
  const [dividerRef, dividerVisible] = useVisible('-60px')
  const [stepsRef, stepsVisible] = useVisible('-40px')

  return (
    <section
      id="app-preview"
      className="relative py-20 sm:py-24 overflow-hidden"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">

        {/* Heading */}
        <div ref={headingRef} className="mb-12 text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              background: 'rgba(249,193,37,0.12)',
              color: '#F9C125',
              opacity: headingVisible ? 1 : 0,
              transform: headingVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.4s ease-out 0s, transform 0.4s ease-out 0s',
            }}
          >
            The Full Loop
          </span>
          <h2
            className="text-3xl font-bold text-white sm:text-4xl"
            style={{
              opacity: headingVisible ? 1 : 0,
              transform: headingVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.45s ease-out 0.08s, transform 0.45s ease-out 0.08s',
            }}
          >
            From zero to{' '}
            <span className="bg-gradient-to-r from-[#F9C125] to-amber-300 bg-clip-text text-transparent">
              feedback
            </span>{' '}
            in under 20 minutes
          </h2>
          <p className="mt-2 text-xs text-white/30">No app to install. Just a browser and a microphone.</p>
        </div>

        {/* Workflow steps — 5 columns on desktop, 2 on mobile (Briefing hidden below lg) */}
        <div
          ref={stepsRef}
          className="mb-16 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-5"
        >
          {WORKFLOW_STEPS.map((step, i) => (
            <div
              key={step.label}
              className={step.label === 'Briefing' ? 'hidden lg:flex flex-col gap-3' : 'flex flex-col gap-3'}
              style={{
                opacity: stepsVisible ? 1 : 0,
                transform: stepsVisible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.5s ease-out ${i * 0.08}s, transform 0.5s ease-out ${i * 0.08}s`,
              }}
            >
              <ScreenshotFrame src={step.src} alt={step.alt} delay={0.15 + i * 0.08} />
              <div>
                <p
                  className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: '#F9C125' }}
                >
                  {step.number} {step.label}
                </p>
                <p className="text-xs font-medium leading-relaxed text-white/70">
                  {step.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div ref={dividerRef} className="mb-12">
          <hr
            className="origin-left border-0 h-px"
            style={{
              background: 'rgba(249,193,37,0.18)',
              transform: dividerVisible ? 'scaleX(1)' : 'scaleX(0)',
              opacity: dividerVisible ? 1 : 0,
              transition: 'transform 0.6s ease-out 0s, opacity 0.6s ease-out 0s',
            }}
          />
        </div>

        {/* Premium strip heading */}
        <div
          className="mb-8 text-center"
          style={{
            opacity: dividerVisible ? 1 : 0,
            transform: dividerVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s',
          }}
        >
          <h3 className="text-xl font-bold text-white sm:text-2xl">
            Go deeper with Student &amp; Pro
          </h3>
          <p className="mt-2 text-sm text-white/60">
            More sessions, richer feedback, and progress tracking.
          </p>
        </div>

        {/* Premium feature cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PREMIUM_FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card flex flex-col gap-4 rounded-2xl p-5"
              style={{
                opacity: dividerVisible ? 1 : 0,
                transform: dividerVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.45s ease-out ${0.18 + i * 0.1}s, transform 0.45s ease-out ${0.18 + i * 0.1}s`,
              }}
            >
              {/* Screenshot */}
              <div
                className="relative w-full overflow-hidden rounded-xl"
                style={{
                  aspectRatio: '16/9',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <Image
                  src={feature.src}
                  alt={feature.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 90vw, 30vw"
                  style={{ boxShadow: '0 0 40px rgba(249,193,37,0.12)' }}
                />
              </div>

              {/* Tier badge */}
              <div className="flex flex-col gap-2">
                <span
                  className="w-fit rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: feature.tierBg, color: feature.tierColor }}
                >
                  {feature.tier}
                </span>
                <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                <p className="text-xs leading-relaxed text-white/60">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
