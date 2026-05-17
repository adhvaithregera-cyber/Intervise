'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavAuthLinks() {
  const pathname = usePathname()
  const onDashboard = pathname === '/dashboard'

  return (
    <div className="ml-auto flex items-center gap-4">
      {!onDashboard && (
        <Link
          href="/dashboard"
          className="rounded-xl bg-[#3D52A0] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#2d3d78] transition-colors"
        >
          Dashboard
        </Link>
      )}
    </div>
  )
}
