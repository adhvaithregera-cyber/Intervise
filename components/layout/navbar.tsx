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

  // Show "Try for FREE" only when: not signed in, OR signed in but not on free plan
  const showTryFree = !user || tier !== 'free'

  return (
    <nav className="sticky top-0 z-50 border-b border-[#6BA3C8] bg-white">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">

        {/* Left: marketing links */}
        <div className="flex items-center gap-5">
          {showTryFree && (
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center rounded-xl border-2 border-[#E07A2F] px-4 py-1.5 text-sm font-semibold text-[#E07A2F] hover:bg-[#E07A2F] hover:text-white transition-colors"
            >
              Try for FREE
            </Link>
          )}
          <a
            href="/#pricing"
            className="text-sm font-medium text-[#6BA3C8] hover:text-[#E07A2F] transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-base font-bold tracking-widest text-[#E07A2F] hover:text-[#F9C125] transition-colors"
          >
            INTERVISE
          </Link>
        </div>

        {/* Right: auth-dependent */}
        <div className="ml-auto">
          {user ? (
            <NavAuthLinks initials={initials} tier={tier ?? 'free'} />
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[#6BA3C8] hover:text-[#E07A2F] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#E07A2F] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#C96A1A] transition-colors shadow-sm shadow-[#E07A2F]/20"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
