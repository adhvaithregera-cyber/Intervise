import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { NavAuthLinks } from './nav-auth-links'
import { NavCenterLinks } from './nav-center-links'
import { NavGuestLinks } from './nav-guest-links'
import { ScrollNav } from './scroll-nav'
import { Home, Tag, LogIn } from 'lucide-react'

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

type NavbarProps = {
  /** Pass from a parent layout to skip the internal DB fetch */
  prefetched?: { initials: string; tier: string } | null
}

export async function Navbar({ prefetched }: NavbarProps = {}) {
  let initials = '?'
  let tier: string | null = null

  if (prefetched !== undefined) {
    if (prefetched !== null) {
      initials = prefetched.initials
      tier = prefetched.tier
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tier')
        .eq('id', user.id)
        .single()
      initials = getInitials(profile?.full_name, user.email)
      tier = profile?.tier ?? 'free'
    }
  }

  return (
    <ScrollNav>
      {/* relative so the absolutely-positioned center cluster anchors here */}
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">

        {/* Left: logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo.png"
            alt="Intervise"
            width={30}
            height={30}
            priority
          />
          <span className="text-base font-bold tracking-widest text-[#F9C125] hover:text-white transition-colors">
            INTERVISE
          </span>
        </Link>

        {/* Center: nav links (desktop only) */}
        {tier !== null ? <NavCenterLinks /> : <NavGuestLinks />}

        {/* Right: profile (auth) or login + signup (unauth) */}
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {tier !== null ? (
            <NavAuthLinks initials={initials} tier={tier} />
          ) : (
            <>
              {/* Mobile only: icon links */}
              <Link
                href="/"
                className="text-white/65 hover:text-white transition-colors sm:hidden"
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="text-white/65 hover:text-white transition-colors sm:hidden"
                aria-label="Pricing"
              >
                <Tag className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-white/65 hover:text-white transition-colors"
                aria-label="Login"
              >
                <LogIn className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#F9C125] px-3 py-1.5 text-sm font-semibold text-[#080d1a] hover:bg-[#FFD84D] transition-colors shadow-sm shadow-[#F9C125]/20 sm:px-4"
              >
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Sign up</span>
              </Link>
            </>
          )}
        </div>

      </div>
    </ScrollNav>
  )
}
