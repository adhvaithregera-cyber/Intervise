import type { Metadata } from 'next'
import CursorGlow from '@/components/ui/cursor-glow'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#080d1a' }}>
      <CursorGlow />
      {/* Radial golden glow */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 15%, rgba(249,193,37,0.35) 0%, rgba(249,193,37,0.08) 50%, transparent 70%)' }} />
      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
