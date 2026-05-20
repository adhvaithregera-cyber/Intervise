import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavAuthLinks } from './nav-auth-links'
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

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initials = '?'
  let tier: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, tier')
      .eq('id', user.id)
      .single()
    initials = getInitials(profile?.full_name, user.email)
    tier = profile?.tier ?? 'free'
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: '#1C0A00',
        borderColor: 'rgba(249,193,37,0.15)',
        boxShadow: '0 1px 0 rgba(249,193,37,0.08), 0 4px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">

        {/* Left: wordmark */}
        <Link
          href="/"
          className="text-base font-bold tracking-widest text-[#F9C125] hover:text-white transition-colors"
        >
          INTERVISE
        </Link>

        {/* Right: all nav links */}
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {user ? (
            <NavAuthLinks initials={initials} tier={tier ?? 'free'} />
          ) : (
            <>
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
                className="rounded-xl bg-[#F9C125] px-3 py-1.5 text-sm font-semibold text-[#1C0A00] hover:bg-[#FFD84D] transition-colors shadow-sm shadow-[#F9C125]/20 sm:px-4"
              >
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Sign up</span>
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
