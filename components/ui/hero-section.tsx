"use client";

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ElegantShape } from '@/components/ui/shape-landing-hero'

export function HeroSection({ sessionHref }: { sessionHref: string }) {
  return (
    <section
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pb-32 sm:px-6"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(249,193,37,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Floating pill shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ElegantShape delay={0.3} width={580} height={130} rotate={12}
          gradient="from-[#F9C125]/[0.12]"
          className="left-[-8%] top-[18%]" />
        <ElegantShape delay={0.5} width={440} height={110} rotate={-14}
          gradient="from-amber-400/[0.10]"
          className="right-[-4%] top-[68%]" />
        <ElegantShape delay={0.4} width={280} height={72} rotate={-8}
          gradient="from-yellow-300/[0.10]"
          className="left-[6%] bottom-[12%]" />
        <ElegantShape delay={0.6} width={190} height={55} rotate={22}
          gradient="from-[#F9C125]/[0.09]"
          className="right-[18%] top-[12%]" />
        <ElegantShape delay={0.7} width={140} height={38} rotate={-26}
          gradient="from-amber-300/[0.08]"
          className="left-[24%] top-[7%]" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-32">
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F9C125]/20 bg-[#F9C125]/[0.06] px-4 py-1.5 text-xs font-semibold text-white/80"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#F9C125]" />
          AI-powered interview coaching
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
          className="mb-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
        >
          <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
            Your next interview
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#F9C125] via-amber-200 to-[#F9C125]/80 bg-clip-text text-transparent">
            is won before it starts.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mb-10 max-w-[500px] text-base leading-relaxed text-white/50 sm:text-lg"
        >
          Experience the pressure of a real interview and find out exactly where your answers fall short.
        </motion.p>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mb-10 flex flex-wrap justify-center gap-3"
        >
          {[
            { value: '8', label: 'Answer formats' },
            { value: 'A–F', label: 'Instant grade' },
            { value: 'WPM', label: 'Speed tracked' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-2xl border border-[#F9C125]/[0.12] px-7 py-3.5"
              style={{ background: 'rgba(249,193,37,0.04)' }}
            >
              <span className="text-xl font-black text-white">{s.value}</span>
              <span className="text-[11px] text-white/45">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="#how-it-works"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#F9C125] px-8 py-3.5 text-base font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/15 hover:bg-[#F9C125]/90 transition-colors sm:w-auto"
          >
            See how it works
          </Link>
          <Link
            href={sessionHref}
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-8 py-3.5 text-base font-semibold text-white/80 hover:border-white/30 hover:text-white transition-colors sm:w-auto"
          >
            Start Session
          </Link>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
        >
          {['No card needed', '2 free sessions', 'Cancel anytime', 'No download — works in your browser'].map((t) => (
            <span key={t} className="text-xs text-white/35">{t}</span>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
        style={{ background: 'linear-gradient(to bottom, transparent, #080d1a)' }}
      />
    </section>
  )
}
