import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Supabase sometimes sends ?code= to the site URL root — forward to /auth/callback
  if (pathname === '/') {
    const code = request.nextUrl.searchParams.get('code')
    if (code) {
      return NextResponse.redirect(new URL(`/auth/callback?code=${encodeURIComponent(code)}`, request.url))
    }
  }

  // Normalise trailing slashes so /pricing/ is treated the same as /pricing
  const normPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  const isPublicPath   = normPath === '/' || normPath === '/login' || normPath === '/signup'
    || normPath === '/pricing' || normPath === '/privacy' || normPath === '/terms'
  const isAuthCallback = pathname.startsWith('/auth/')

  // Allow auth callbacks through
  if (isAuthCallback) return supabaseResponse

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete, tier')
      .eq('id', user.id)
      .single()

    // Profile row missing (e.g. DB trigger hasn't run yet after signup)
    if (!profile && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Onboarding guard
    if (profile && !profile.onboarding_complete && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // ── Tier-based URL access control ─────────────────────────────────────
    if (profile) {
      const tier = profile.tier ?? 'free'
      const isSessionPath = pathname.startsWith('/session/')
      const VALID_TIERS = new Set(['free', 'student', 'pro'])
      if (isSessionPath && !VALID_TIERS.has(tier)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
