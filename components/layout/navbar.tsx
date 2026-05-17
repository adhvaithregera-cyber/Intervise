import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-surface-border bg-black">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Center: wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-xl font-bold tracking-widest text-white hover:text-brand-400 transition-colors"
          >
            INTERVISE
          </Link>
        </div>

        {/* Right: nav links */}
        <div className="ml-auto flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Home
          </Link>
          {user ? (
            <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-400 transition-colors"
            >
              Sign Up
            </Link>
          )}
          <Link href="/settings" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  )
}
