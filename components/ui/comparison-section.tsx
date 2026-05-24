'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { InterviewComparison } from '@/components/ui/interview-comparison'

export function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24"
      style={{ backgroundColor: '#D97228' }}
    >
      {/* Dot grid only — no vignette overlay to avoid gradient banding at section edges */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div ref={ref} className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
        >
          The transformation
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mb-4 text-3xl font-bold text-white sm:text-4xl"
        >
          Same candidate. Same question.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10 max-w-xl text-white/70"
        >
          See exactly what changes after one week with Intervise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.6, delay: 0.22 }}
        >
          <InterviewComparison />
        </motion.div>
      </div>

      {/* Fade into dark pricing section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: 'linear-gradient(to bottom, transparent, #080d1a)' }}
      />
    </section>
  )
}
