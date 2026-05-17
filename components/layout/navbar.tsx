import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[#ADBBDA]/40"
      style={{
        background: 'linear-gradient(90deg, #3D52A0 0%, #7091E6 50%, #8697C4 100%)',
      }}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-lg font-bold tracking-widest text-white drop-shadow-sm hover:text-[#EDE8F5] transition-colors"
          >
            INTERVISE
          </Link>
        </div>

        {/* Right: nav links */}
        <div className="ml-auto flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-xl bg-white/20 backdrop-blur-sm border border-white/40 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition-all"
            >
              Sign Up
            </Link>
          )}
          <Link href="/settings" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  )
}
