import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(249,193,37,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Large decorative 404 */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span
          className="font-black text-[clamp(160px,30vw,320px)] leading-none tracking-tighter"
          style={{ color: 'rgba(249,193,37,0.04)' }}
        >
          404
        </span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-lg text-center"
      >
        {/* HTTP status badge */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">HTTP</span>
          <span className="text-white/15">·</span>
          <span
            className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(249,193,37,0.10)', color: '#F9C125' }}
          >
            404
          </span>
          <span className="text-white/15">·</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Not Found</span>
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-5xl font-black tracking-tight text-white sm:text-6xl">
          Off topic.
        </h1>

        {/* Subheading */}
        <p
          className="mb-5 text-xl font-bold sm:text-2xl"
          style={{ color: '#F9C125' }}
        >
          Good answer. Wrong question.
        </p>

        {/* Divider */}
        <div
          className="mx-auto mb-6 h-px w-16"
          style={{ background: 'rgba(249,193,37,0.25)' }}
        />

        {/* Body copy */}
        <p className="mb-10 text-sm leading-relaxed text-white/50 sm:text-base">
          This page isn&apos;t in any Intervise module. The timer isn&apos;t running yet
          — point us at a real question and we&apos;ll grade what comes next.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/#app-preview"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-7 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white sm:w-auto"
          >
            Learn how it works
          </Link>
          <Link
            href="/session/setup"
            className="inline-flex w-full items-center justify-center rounded-xl px-7 py-3 text-sm font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/15 transition-all hover:brightness-110 sm:w-auto"
            style={{ backgroundColor: '#F9C125' }}
          >
            Start a mock interview
          </Link>
        </div>
      </div>
    </div>
  )
}
