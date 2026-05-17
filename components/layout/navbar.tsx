import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-[#ADBBDA] bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-lg font-bold tracking-widest text-[#3D52A0] hover:text-[#7091E6] transition-colors"
          >
            INTERVISE
          </Link>
        </div>

        {/* Right: nav links */}
        <div className="ml-auto flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors">
            Home
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-xl bg-[#3D52A0] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#2d3d78] transition-colors shadow-sm shadow-[#3D52A0]/20"
            >
              Sign Up
            </Link>
          )}
          <Link href="/settings" className="text-sm font-medium text-[#8697C4] hover:text-[#3D52A0] transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  )
}
