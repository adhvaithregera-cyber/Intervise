import Link from 'next/link'

export function FinalCta({ showSignup }: { showSignup: boolean }) {
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

      <div className="relative z-10">
        <h2 className="mb-4 text-4xl font-bold text-[#080d1a] sm:text-5xl">
          Your interview is closer than you think.
        </h2>
        <p className="mb-8 text-[#080d1a]/70">
          Start practising today — free, no card required.
        </p>
        {showSignup && (
          <Link href="/signup" className="rounded-xl bg-[#080d1a] px-8 py-4 text-base font-bold text-[#F9C125] hover:bg-[#0d1629] transition-colors shadow-lg shadow-[#080d1a]/30">
            Start for free →
          </Link>
        )}
      </div>
    </section>
  )
}
