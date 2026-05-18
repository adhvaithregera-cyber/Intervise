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
      style={{ backgroundColor: '#BF601A' }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Dark centre vignette for focus */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(28,10,0,0.35) 0%, transparent 70%)',
        }}
      />

      <div ref={ref} className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5 }}
          className="mb-4 text-3xl font-extrabold text-white sm:text-4xl"
        >
          Your interview is closer than you think.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 text-white/70"
        >
          Start practising today — free, no card required.
        </motion.p>
        {showSignup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2, ease: 'backOut' }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center rounded-xl bg-[#1C0A00] px-10 py-4 text-base font-bold text-white shadow-lg shadow-black/30 hover:bg-black transition-colors"
            >
              Start FREE →
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
