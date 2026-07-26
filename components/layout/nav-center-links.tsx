'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/', label: 'Home' },
  { href: '/session/setup', label: 'Practice' },
]

export function NavCenterLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    // Treat the entire /session/* tree as active for the Practice link
    if (href === '/session/setup') return pathname.startsWith('/session/')
    return pathname === href || pathname.startsWith(href + '/')
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
