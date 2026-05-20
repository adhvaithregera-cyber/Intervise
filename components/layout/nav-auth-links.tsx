'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home, Tag } from 'lucide-react'

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  student: 'Student',
  pro: 'Pro',
}

const TIER_COLOR: Record<string, string> = {
  free: 'bg-white/10 text-white/60',
  student: 'bg-[#F9C125]/20 text-[#F9C125]',
  pro: 'bg-[#E07A2F]/20 text-[#E07A2F]',
}

type Props = {
  initials: string
  tier: string
}

export function NavAuthLinks({ initials, tier }: Props) {
  const pathname = usePathname()
  const isOnDashboard = pathname === '/dashboard'

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <Link
        href="/"
        className="text-sm font-medium text-white/65 hover:text-white transition-colors"
        aria-label="Home"
      >
        <Home className="h-5 w-5 sm:hidden" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <a
        href="/#pricing"
        className="text-sm font-medium text-white/65 hover:text-white transition-colors"
        aria-label="Pricing"
      >
        <Tag className="h-5 w-5 sm:hidden" />
        <span className="hidden sm:inline">Pricing</span>
      </a>

      {!isOnDashboard && (
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-[#F9C125]/40 bg-[#F9C125]/10 px-3.5 py-1 text-sm font-semibold text-[#F9C125] hover:bg-[#F9C125]/20 hover:border-[#F9C125]/70 transition-colors"
        >
          Dashboard
        </Link>
      )}

      {/* Avatar + dropdown (Profile) */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#F9C125]/50 rounded-full"
          aria-label="Open profile menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E07A2F] text-xs font-bold text-white select-none hover:bg-[#C96A1A] transition-colors">
            {initials}
          </div>
          <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_COLOR[tier] ?? TIER_COLOR.free}`}>
            {TIER_LABEL[tier] ?? 'Free'}
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl shadow-xl"
            style={{
              backgroundColor: '#2A1200',
              border: '1px solid rgba(249,193,37,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: 'rgba(249,193,37,0.12)' }}>
              <p className="text-xs font-semibold text-white/50">My Account</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_COLOR[tier] ?? TIER_COLOR.free}`}>
                {TIER_LABEL[tier] ?? 'Free'} Plan
              </span>
            </div>

            <div className="py-1">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Profile', href: '/profile' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="py-1" style={{ borderTop: '1px solid rgba(249,193,37,0.10)' }}>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
