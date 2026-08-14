/**
 * Shared typography + layout components for all guide pages under /resources/*.
 * Import from here instead of defining locally in each guide page.
 */

import Link from 'next/link'

/* ─── Style tokens ─────────────────────────────────────────────────── */

export const GUIDE_CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.20)',
  borderRadius: '1rem',
}

/** Gold-left-bordered block for worked examples */
export const EXAMPLE_BLOCK = {
  backgroundColor: 'rgba(249,193,37,0.04)',
  border: '1px solid rgba(249,193,37,0.15)',
  borderLeft: '3px solid rgba(249,193,37,0.60)',
  borderRadius: '0.75rem',
}

/* ─── Typography components ────────────────────────────────────────── */

/** Top-level section heading — very large gap above signals a new section */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-bold text-[#F9C125] mt-28 mb-10 first:mt-0 leading-snug underline underline-offset-[8px] decoration-[#F9C125]/35">
      {children}
    </h2>
  )
}

/** Sub-section heading — clearly between section and body level */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-semibold text-white/85 mt-16 mb-6 leading-snug underline underline-offset-4 decoration-white/20">
      {children}
    </h3>
  )
}

/** Body prose — generous line height */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-white/65 leading-[1.9] mt-4">
      {children}
    </p>
  )
}

/* ─── Block components ─────────────────────────────────────────────── */

/** Highlighted callout box — time splits, key contrasts, tests */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-16 rounded-xl px-7 py-8"
      style={{
        backgroundColor: 'rgba(249,193,37,0.06)',
        border: '1px solid rgba(249,193,37,0.18)',
      }}
    >
      {children}
    </div>
  )
}

/** Inline weak / strong comparison pair */
export function Comparison({ weak, strong }: { weak: string; strong: string }) {
  return (
    <div className="mt-8 mb-6 space-y-4">
      <div className="flex gap-2.5 items-start">
        <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
          Weak
        </span>
        <p className="text-sm text-white/45 italic leading-[1.9]">{weak}</p>
      </div>
      <div className="flex gap-2.5 items-start">
        <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
          Strong
        </span>
        <p className="text-sm text-white/80 leading-[1.9]">{strong}</p>
      </div>
    </div>
  )
}

/** Full STAR worked-example card */
export function WorkedExample({
  question,
  situation,
  task,
  action,
  result,
}: {
  question: string
  situation: string
  task: string
  action: string
  result: string
}) {
  const rows = [
    { label: 'Situation', text: situation },
    { label: 'Task', text: task },
    { label: 'Action', text: action },
    { label: 'Result', text: result },
  ]
  return (
    <div className="mt-16 mb-8" style={EXAMPLE_BLOCK}>
      <div className="px-7 pt-8 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/70 mb-3">
          Question
        </p>
        <p className="text-sm font-medium text-white/80 italic mb-5 leading-[1.9]">{question}</p>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(249,193,37,0.10)' }}>
        {rows.map(({ label, text }) => (
          <div key={label} className="px-7 py-6 flex gap-5 items-start">
            <span className="shrink-0 w-20 text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/60 pt-0.5">
              {label}
            </span>
            <p className="text-sm text-white/75 leading-[1.9]">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Page-level chrome ─────────────────────────────────────────────── */

/** Back link + category tag + read time + h1 + intro prose */
export function GuideHeader({
  tag,
  readTime,
  title,
  children,
}: {
  tag: string
  readTime: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-7"
      >
        <span>←</span> Resources
      </Link>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border text-[#F9C125] bg-[#F9C125]/10 border-[#F9C125]/20">
          {tag}
        </span>
        <span className="text-[10px] text-white/35">{readTime}</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-5">{title}</h1>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

/** ← All guides / Practice now → footer */
export function GuideFooter() {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Link
        href="/resources"
        className="text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        ← All guides
      </Link>
      <Link
        href="/session/setup"
        className="text-sm font-semibold text-[#F9C125] hover:brightness-110 transition-all"
      >
        Practice now →
      </Link>
    </div>
  )
}
