'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
]

export function NavGuestLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname === href
  }

  return (
    <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-7">
      {NAV_LINKS.map(({ href, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative text-sm font-medium transition-colors pb-0.5',
              active ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-white/80" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
