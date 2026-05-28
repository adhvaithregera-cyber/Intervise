import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
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

      {/* Ghost 404 — editorial typographic background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: 'clamp(180px, 28vw, 280px)',
            fontWeight: 700,
            letterSpacing: '-0.06em',
            lineHeight: 0.85,
            color: 'rgba(249,193,37,0.055)',
            fontFamily: 'inherit',
          }}
        >
          404
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl">

        {/* "Off topic" — section label */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.40)',
            marginBottom: '18px',
          }}
        >
          Off topic
        </p>

        {/* Gold divider */}
        <div
          style={{
            height: '1px',
            width: '100%',
            background: 'rgba(249,193,37,0.25)',
            marginBottom: '32px',
          }}
        />

        {/* Main headline */}
        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#ffffff',
            marginBottom: '4px',
          }}
        >
          Good answer.
        </h1>
        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#ffffff',
            marginBottom: '32px',
          }}
        >
          Wrong question.
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '1.7',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: '40px',
            maxWidth: '420px',
          }}
        >
          This page isn&apos;t in any Intervise module. The timer isn&apos;t
          running yet — point us at a real question and we&apos;ll grade what
          comes next.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/#app-preview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 24px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.70)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, color 0.2s',
            }}
          >
            Learn how it works
          </Link>
          <Link
            href="/session/setup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 24px',
              borderRadius: '10px',
              backgroundColor: '#F9C125',
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgb(26,18,6)',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(249,193,37,0.20)',
            }}
          >
            Start a mock interview
          </Link>
        </div>

      </div>
    </div>
  )
}
