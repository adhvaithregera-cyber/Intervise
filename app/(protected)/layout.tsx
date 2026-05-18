import { Navbar } from '@/components/layout/navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#E07A2F' }}>
      {/* Radial golden glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 55% at 50% 15%, rgba(249,193,37,0.45) 0%, rgba(249,193,37,0.12) 50%, transparent 70%)',
        }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
