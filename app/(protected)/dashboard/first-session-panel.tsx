'use client'

import Link from 'next/link'
import { ArrowRight, Mic } from 'lucide-react'

const CARD_STYLE = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

const PILLS = ['5 questions', 'AI feedback', 'Score report']

export function FirstSessionPanel({ firstName }: { firstName: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" style={CARD_STYLE}>
      <div className="max-w-md">
        {/* Icon */}
        <div
          className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(249,193,37,0.12)', border: '1px solid rgba(249,193,37,0.28)' }}
        >
          <Mic className="h-7 w-7 text-[#F9C125]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {firstName ? `Ready when you are, ${firstName}.` : 'Your first session is ready.'}
        </h2>
        <p className="text-sm text-white/45 mb-8 leading-relaxed">
          No setup needed — we&apos;ve prepared an Easy session based on your goals.
        </p>

        {/* Info pills */}
        <div className="mb-8 flex justify-center gap-2.5">
          {PILLS.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/55"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/session/briefing?difficulty=easy"
          className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-[#080d1a] transition-all hover:brightness-110"
          style={{
            backgroundColor: '#F9C125',
            boxShadow: '0 0 40px rgba(249,193,37,0.35), 0 8px 32px rgba(249,193,37,0.20)',
          }}
        >
          Start my first session
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>

        <p className="mt-4 text-xs text-white/25">Easy difficulty · ~5 minutes</p>
      </div>
    </div>
  )
}
