'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Learn the format',
    tag: 'Before you speak',
    description:
      "Most candidates fail not because they don't know the answer — but because they don't know how to structure it. Every question in Intervise is paired with a briefing card that shows you exactly which format to use.",
    details: [
      'Choose from 8 proven frameworks: STAR, PACE, SOAR, CAR, PREP, and more',
      'Each format has a colour-coded breakdown of what to say in each section',
      'You see the briefing card before the timer starts — never cold-called',
    ],
    formats: ['STAR', 'PACE', 'SOAR', 'CAR', 'PREP'],
  },
  {
    number: '02',
    title: 'Answer under real pressure',
    tag: 'Live recording',
    description:
      "A real interview doesn't pause for you to collect your thoughts. Intervise doesn't either. Once you start, a countdown timer runs. Your mic records. You answer as if the interviewer is right there.",
    details: [
      'Countdown timer matches the actual time limit for each question type',
      'Your audio is recorded via your browser — nothing leaves your device during the session',
      'Tap Done early or let the timer run out — both trigger the next step',
    ],
    formats: [],
  },
  {
    number: '03',
    title: 'Get instant feedback',
    tag: 'Your report',
    description:
      "The moment your answer ends, your audio is transcribed and analysed. No waiting. You'll see exactly where you lost points — and what to fix before your next session.",
    details: [
      'Filler word count with full breakdown: "um" vs "uh" vs "like" vs "basically"',
      "Words per minute — so you know if you're rushing or dragging",
      'Overall grade (A–F) based on your performance across all answers',
    ],
    formats: [],
  },
]

function StepCard({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const isLast = index === steps.length - 1

  return (
    <div ref={ref} className="flex gap-5 sm:gap-7">
      {/* Left column: badge + connector */}
      <div className="flex flex-col items-center pt-1">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.18, ease: 'backOut' }}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-[#F9C125] sm:h-14 sm:w-14 sm:text-lg"
          style={{
            backgroundColor: 'rgba(8,13,26,0.8)',
            boxShadow: '0 0 0 0px rgba(249,193,37,0.6)',
          }}
        >
          {/* Pulse ring on entry */}
          {inView && (
            <motion.span
              className="absolute inset-0 rounded-2xl"
              initial={{ boxShadow: '0 0 0 0px rgba(249,193,37,0.6)', opacity: 1 }}
              animate={{ boxShadow: '0 0 0 12px rgba(249,193,37,0)', opacity: 0 }}
              transition={{ duration: 0.8, delay: index * 0.18 + 0.1 }}
            />
          )}
          {step.number}
        </motion.div>

        {!isLast && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: index * 0.18 + 0.3, ease: 'easeOut' }}
            className="mt-3 w-px flex-1 origin-top"
            style={{
              background: 'linear-gradient(to bottom, rgba(249,193,37,0.5), rgba(255,255,255,0.08))',
              minHeight: '2rem',
            }}
          />
        )}
      </div>

      {/* Right column: glassmorphic card */}
      <motion.div
        initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
        animate={inView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.55, delay: index * 0.18 + 0.05, ease: 'easeOut' }}
        className="group mb-5 flex-1 rounded-2xl p-6 sm:p-8 transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,193,37,0.22)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.20)',
        }}
      >
        {/* Hover shimmer overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
        />

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-lg font-bold text-white sm:text-xl">{step.title}</h3>
            <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
              {step.tag}
            </span>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-white/70">{step.description}</p>

          <ul className="mb-4 space-y-2.5">
            {step.details.map((d, di) => (
              <motion.li
                key={d}
                initial={{ opacity: 0, x: 8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: index * 0.18 + 0.3 + di * 0.07 }}
                className="flex items-start gap-2.5 text-sm text-white/85"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]" />
                {d}
              </motion.li>
            ))}
          </ul>

          {step.formats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {step.formats.map((f) => (
                <span
                  key={f}
                  className="rounded-xl px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: 'rgba(249,193,37,0.25)', border: '1px solid rgba(249,193,37,0.3)' }}
                >
                  {f}
                </span>
              ))}
              <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                +3 more
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function HowItWorks() {
  const headingRef = useRef<HTMLDivElement>(null)
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' })

  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-24 overflow-hidden"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Dot grid only — no vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        <div ref={headingRef}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
          >
            The process
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.07 }}
            className="mb-4 text-3xl font-bold text-white sm:text-4xl"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.13 }}
            className="mb-12 max-w-xl text-white/70"
          >
            Three phases, back to back. The whole loop takes under 20 minutes.
          </motion.p>
        </div>

        <div>
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* Fade downward into comparison (orange) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{ background: 'linear-gradient(to bottom, transparent, #080d1a)' }}
      />
    </section>
  )
}
