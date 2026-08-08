import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Prevent clickjacking — no iframes allowed
  { key: 'X-Frame-Options', value: 'DENY' },

  // Force HTTPS for 2 years, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // Reduce referrer leakage
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Restrict browser feature access — camera/mic only allowed from own origin
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(), payment=()',
  },

  /**
   * Content Security Policy
   *
   * - script-src includes 'unsafe-inline' because Next.js App Router injects
   *   inline hydration scripts. Remove once Next.js supports nonce-based CSP
   *   out of the box (tracked: github.com/vercel/next.js/issues/48570).
   * - 'unsafe-eval' is allowed ONLY in development (Next.js fast refresh / HMR).
   *   It is stripped from production builds where it is not needed.
   * - connect-src allows *.supabase.co (REST + Realtime) and AssemblyAI.
   * - media-src blob: needed for MediaRecorder playback in the live session.
   * - worker-src blob: needed for Supabase Realtime and MediaPipe workers.
   */
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-eval only in dev (Next.js HMR needs it); never in production
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com https://*.razorpay.com https://cdn.razorpay.com"
        : "script-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://*.razorpay.com https://cdn.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.assemblyai.com https://hcaptcha.com https://*.hcaptcha.com https://api.razorpay.com https://*.razorpay.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "frame-src https://hcaptcha.com https://*.hcaptcha.com https://*.razorpay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Remove X-Powered-By header at the framework level too
  poweredByHeader: false,

  // Explicitly disable source maps in production — prevents source code
  // exposure to anyone who opens DevTools on the deployed site
  productionBrowserSourceMaps: false,

  // Tree-shake large icon/animation packages so only imported symbols are bundled
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
    // Inline critical CSS and defer the rest — directly reduces render-blocking CSS latency
    optimizeCss: true,
  },

  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
}

export default nextConfig
