import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavAuthLinks } from './nav-auth-links'

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
        <div className="ml-auto flex items-center gap-5">
          {user ? (
            <NavAuthLinks initials={initials} tier={tier ?? 'free'} />
          ) : (
            <>
              <Link
                href="/signup"
                className="hidden sm:inline-flex items-center rounded-xl border border-[#F9C125]/60 px-4 py-1.5 text-sm font-semibold text-[#F9C125] hover:bg-[#F9C125] hover:text-[#1C0A00] transition-colors"
              >
                Try for FREE
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-white/65 hover:text-white transition-colors"
              >
                Home
              </Link>
              <a
                href="/#pricing"
                className="text-sm font-medium text-white/65 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-white/65 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#F9C125] px-4 py-1.5 text-sm font-semibold text-[#1C0A00] hover:bg-[#FFD84D] transition-colors shadow-sm shadow-[#F9C125]/20"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
