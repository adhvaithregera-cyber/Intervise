'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'

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
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        border: '1px solid rgba(249,193,37,0.22)',
        aspectRatio: '16/10',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
    </motion.div>
  )
}

export function AppPreview() {
  const headingRef = useRef<HTMLDivElement>(null)
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' })

  const dividerRef = useRef<HTMLDivElement>(null)
  const dividerInView = useInView(dividerRef, { once: true, margin: '-60px' })

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
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(249,193,37,0.12)', color: '#F9C125' }}
          >
            The Full Loop
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-3xl font-bold text-white sm:text-4xl"
          >
            From zero to feedback in under 20 minutes
          </motion.h2>
        </div>

        {/* Workflow steps — 5 columns on desktop, 2 on mobile */}
        <div className="mb-16 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-5">
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.08, ease: 'easeOut' }}
              className="flex flex-col gap-3"
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
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div ref={dividerRef} className="mb-12">
          <motion.hr
            initial={{ scaleX: 0, opacity: 0 }}
            animate={dividerInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="origin-left border-0 h-px"
            style={{ background: 'rgba(249,193,37,0.18)' }}
          />
        </div>

        {/* Premium strip heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={dividerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h3 className="text-xl font-bold text-white sm:text-2xl">
            Go deeper with Student &amp; Pro
          </h3>
          <p className="mt-2 text-sm text-white/60">
            More sessions, richer feedback, and progress tracking.
          </p>
        </motion.div>

        {/* Premium feature cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PREMIUM_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={dividerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.18 + i * 0.1, ease: 'easeOut' }}
              className="flex flex-col gap-4 rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${feature.borderColor}`,
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
