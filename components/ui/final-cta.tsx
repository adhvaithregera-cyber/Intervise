'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function FinalCta({ showSignup }: { showSignup: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      className="relative overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-28"
      style={{ backgroundColor: '#F9C125' }}
    >
      {/* Subtle radial light burst for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
      />

      <motion.div
        ref={ref}
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5 }}
          className="mb-4 text-4xl font-bold text-[#080d1a] sm:text-5xl"
        >
          Your interview is closer than you think.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 text-[#080d1a]/70"
        >
          Start practising today — free, no card required.
        </motion.p>
        {showSignup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2, ease: 'backOut' }}
          >
            <Link href="/signup" className="rounded-xl bg-[#080d1a] px-8 py-4 text-base font-bold text-[#F9C125] hover:bg-[#0d1629] transition-colors shadow-lg shadow-[#080d1a]/30">
              Start for free →
            </Link>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
