import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavAuthLinks } from './nav-auth-links'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 border-b border-[#ADBBDA] bg-white">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-base font-bold tracking-widest text-[#3D52A0] hover:text-[#7091E6] transition-colors"
          >
            INTERVISE
          </Link>
        </div>

        {/* Right: auth links */}
        {user ? (
          <NavAuthLinks />
        ) : (
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#3D52A0] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#2d3d78] transition-colors shadow-sm shadow-[#3D52A0]/20"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
