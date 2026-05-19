import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
  const isPublicPath   = pathname === '/' || pathname === '/login' || pathname === '/signup'
  const isAuthCallback = pathname.startsWith('/auth/')
  const isApiPath      = pathname.startsWith('/api/')

  // Allow auth callbacks and API routes through
  if (isAuthCallback || isApiPath) return supabaseResponse

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

    // Onboarding guard
    if (profile && !profile.onboarding_complete && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // ── Tier-based URL access control ─────────────────────────────────────
    // Prevent users from bypassing the UI by crafting URLs to gated features.
    // The API routes enforce these too, but this guard gives a proper error page.
    if (profile) {
      const tier = profile.tier ?? 'free'

      // Session pages require onboarding to be complete and a valid tier
      const isSessionPath = pathname.startsWith('/session/')

      // /session/report/[id] — ownership is verified in the page's server component
      // /session/briefing    — ownership is verified in the page's server component
      // /session/live        — Supabase RLS prevents cross-user data access

      // Block entirely unknown tiers from accessing session features
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
