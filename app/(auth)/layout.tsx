import type { Metadata } from 'next'
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: '#080d1a' }}>
      {children}
    </div>
  )
}
