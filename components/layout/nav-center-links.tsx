'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavCenterLinks() {
  const pathname = usePathname()
  const isOnDashboard = pathname === '/dashboard'

  return (
    <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-7">
      <Link
        href="/"
        className="text-sm font-medium text-white hover:text-white/80 transition-colors"
      >
        Home
      </Link>
      {!isOnDashboard && (
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-[#F9C125]/40 bg-[#F9C125]/10 px-3.5 py-1 text-sm font-semibold text-[#F9C125] hover:bg-[#F9C125]/20 hover:border-[#F9C125]/70 transition-colors"
        >
          Dashboard
        </Link>
      )}
      <a
        href="/#pricing"
        className="text-sm font-medium text-white hover:text-white/80 transition-colors"
      >
        Pricing
      </a>
    </div>
  )
}
