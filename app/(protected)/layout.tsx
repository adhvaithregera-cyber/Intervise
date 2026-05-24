import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

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

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Fetch user + profile once here; pass to Navbar so it skips its own DB call.
  // React.cache() on createClient means this shares the same client as the page below.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prefetched: { initials: string; tier: string } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name, tier').eq('id', user.id).single()
    prefetched = {
      initials: getInitials(profile?.full_name, user.email),
      tier: profile?.tier ?? 'free',
    }
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      {/* Ambient glow — behind content cards, not pinned to top */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 65% 40% at 50% 36%, rgba(249,193,37,0.09) 0%, rgba(249,193,37,0.03) 55%, transparent 75%)',
        }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }}
      />
      <Navbar prefetched={prefetched} />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
