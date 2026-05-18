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
    <nav className="sticky top-0 z-50 border-b border-[#8ACBD0] bg-white">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">

        {/* Left: marketing links */}
        <div className="flex items-center gap-5">
          {showTryFree && (
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center rounded-xl border-2 border-[#170C79] px-4 py-1.5 text-sm font-semibold text-[#170C79] hover:bg-[#170C79] hover:text-white transition-colors"
            >
              Try for FREE
            </Link>
          )}
          <a
            href="/#pricing"
            className="text-sm font-medium text-[#8ACBD0] hover:text-[#170C79] transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-base font-bold tracking-widest text-[#170C79] hover:text-[#56B6C6] transition-colors"
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
                className="text-sm font-medium text-[#8ACBD0] hover:text-[#170C79] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#170C79] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0f0955] transition-colors shadow-sm shadow-[#170C79]/20"
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
