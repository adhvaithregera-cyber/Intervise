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
        className="text-sm font-medium text-white/65 hover:text-white transition-colors"
      >
        Home
      </Link>
      {!isOnDashboard && (
        <Link
          href="/dashboard"
          className="text-sm font-medium text-white/65 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
      )}
      <a
        href="/#pricing"
        className="text-sm font-medium text-white/65 hover:text-white transition-colors"
      >
        Pricing
      </a>
    </div>
  )
}
