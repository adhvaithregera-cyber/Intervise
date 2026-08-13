import Link from 'next/link'
import { ElegantShape } from '@/components/ui/shape-landing-hero'

export function HeroSection({
  sessionHref,
  hasCompletedSession = false,
  isLoading = false,
}: {
  sessionHref: string
  hasCompletedSession?: boolean
  /** When true, renders skeleton placeholders for the CTA — used during Suspense fallback */
  isLoading?: boolean
}) {
  return (
    <section
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 sm:px-6"
      style={{ backgroundColor: '#080d1a' }}
    >
      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 40%, rgba(249,193,37,0.10) 0%, transparent 70%)',
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
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-32 pb-32 gap-0">

        {/* Badge */}
        <div style={{ animation: 'hero-fade-down 0.5s ease-out both' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F9C125]/20 bg-[#F9C125]/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#F9C125]">
            AI Interview Coach
          </span>
        </div>

        {/* Headline — no animation so it paints immediately (LCP element) */}
        <div className="mt-8">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-none">
            Ace your next<br />
            <span className="bg-gradient-to-r from-[#F9C125] to-amber-300 bg-clip-text text-transparent">
              interview
            </span>
          </h1>
        </div>

        {/* Sub-headline */}
        <div style={{ animation: 'hero-fade-up 0.6s ease-out 0.2s both' }}>
          <p className="mt-6 max-w-xl text-lg sm:text-xl text-white/60 leading-relaxed">
            Practice with AI coaching. Get instant feedback on structure, pace, and clarity.
          </p>
        </div>

        {/* CTA buttons */}
        <div
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animation: 'hero-fade-up 0.6s ease-out 0.3s both' }}
        >
          {isLoading ? (
            /* Neutral skeleton — no auth-specific text/href during Suspense fallback */
            <>
              <div className="h-[52px] w-40 animate-pulse rounded-xl bg-white/10" />
              <div className="h-[52px] w-36 animate-pulse rounded-xl bg-white/6" />
            </>
          ) : hasCompletedSession ? (
            <>
              <Link href="/dashboard" className="relative overflow-hidden rounded-xl bg-[#F9C125] px-8 py-4 text-base font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 group">
                <span className="relative z-10">Go to Dashboard</span>
                <span className="absolute inset-0 -skew-x-[15deg] translate-x-[-100%] group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out bg-white/20" />
              </Link>
              <Link href={sessionHref} className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white/80 hover:bg-white/5 transition-colors">
                Start a session
              </Link>
            </>
          ) : (
            <>
              <Link href={sessionHref} className="relative overflow-hidden rounded-xl bg-[#F9C125] px-8 py-4 text-base font-bold text-[#080d1a] shadow-lg shadow-[#F9C125]/25 transition-all hover:brightness-110 group">
                <span className="relative z-10">Start for free</span>
                <span className="absolute inset-0 -skew-x-[15deg] translate-x-[-100%] group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out bg-white/20" />
              </Link>
              <a href="#how-it-works" className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white/80 hover:bg-white/5 transition-colors">
                See how it works
              </a>
            </>
          )}
        </div>

        {/* Trust pills — hidden during loading so we don't flash logged-out state */}
        {!isLoading && !hasCompletedSession && (
          <div style={{ animation: 'hero-fade-up 0.6s ease-out 0.35s both' }}>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
              {['No card needed', '2 free sessions', 'Works in your browser'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/50">
                  <span className="text-[#F9C125]">✓</span> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div
          className="mt-12 flex flex-wrap justify-center gap-4"
          style={{ animation: 'hero-fade-up 0.6s ease-out 0.5s both' }}
        >
          {[
            { value: '8', label: 'Answer formats' },
            { value: 'A–F', label: 'Instant grade' },
            { value: 'WPM', label: 'Speed tracked' },
          ].map((s) => (
            <div
              key={s.label}
              className="glass-card flex flex-col items-center p-5 min-w-[140px]"
            >
              <span className="text-2xl font-bold text-[#F9C125]">{s.value}</span>
              <span className="text-xs text-white/55 mt-1 text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
        style={{ background: 'linear-gradient(to bottom, transparent, #080d1a)' }}
      />
    </section>
  )
}
