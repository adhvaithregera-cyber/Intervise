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

      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(249,193,37,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">

        {/* Giant 404 — editorial typographic centerpiece */}
        <div className="relative mb-6 select-none">
          <p
            className="text-[clamp(120px,22vw,240px)] font-black leading-none tracking-tighter"
            style={{
              background:
                'linear-gradient(to bottom, rgba(249,193,37,0.95) 0%, rgba(249,193,37,0.18) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </p>
          {/* Depth layer */}
          <p
            className="absolute inset-0 -z-10 text-[clamp(120px,22vw,240px)] font-black leading-none tracking-tighter"
            style={{
              WebkitTextStroke: '1px rgba(249,193,37,0.08)',
              WebkitTextFillColor: 'transparent',
              transform: 'translate(3px, 3px)',
            }}
          >
            404
          </p>
        </div>

        {/* Label */}
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em]"
          style={{ color: '#F9C125' }}
        >
          Page not found
        </p>

        {/* Headline */}
        <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          This one didn&apos;t make it through.
        </h1>

        {/* Subtext */}
        <p
          className="mb-10 max-w-xs text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#F9C125] px-7 py-3 text-sm font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/15 transition-colors hover:bg-[#FFD24A]"
          >
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-7 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Go to dashboard
          </Link>
        </div>

        {/* Footer rule */}
        <div
          className="mt-14 h-px w-20"
          style={{ background: 'rgba(249,193,37,0.18)' }}
        />
        <p
          className="mt-4 text-[11px]"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Intervise · AI interview coaching
        </p>
      </div>
    </div>
  )
}
