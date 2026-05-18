'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  student: 'Student',
  pro: 'Pro',
}

const TIER_COLOR: Record<string, string> = {
  free: 'bg-[#8697C4]/20 text-[#8697C4]',
  student: 'bg-[#7091E6]/20 text-[#7091E6]',
  pro: 'bg-[#3D52A0]/20 text-[#3D52A0]',
}

type Props = {
  initials: string
  tier: string
}

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
]

export function NavAuthLinks({ initials, tier }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
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
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors"
      >
        Dashboard
      </Link>

      {/* Avatar + dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#7091E6]/50 rounded-full"
          aria-label="Open profile menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D52A0] text-xs font-bold text-white select-none hover:bg-[#2d3d78] transition-colors">
            {initials}
          </div>
          <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_COLOR[tier] ?? TIER_COLOR.free}`}>
            {TIER_LABEL[tier] ?? 'Free'}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-[#ADBBDA] bg-white shadow-lg shadow-[#3D52A0]/10">
            {/* Header */}
            <div className="border-b border-[#ADBBDA]/60 px-4 py-3">
              <p className="text-xs font-semibold text-[#3D52A0]">My Account</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_COLOR[tier] ?? TIER_COLOR.free}`}>
                {TIER_LABEL[tier] ?? 'Free'} Plan
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3D52A0] hover:bg-[#EDE8F5] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-[#ADBBDA]/60 py-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#8697C4] hover:bg-[#EDE8F5] hover:text-[#3D52A0] transition-colors"
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
