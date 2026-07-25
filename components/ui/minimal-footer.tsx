import { SocialIcons } from '@/components/ui/social-icons'
import { PrivacyTrigger } from '@/components/ui/privacy-trigger'

const CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.12)',
  borderRadius: '1rem',
} as const

export function MinimalFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-24 w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand card — spans 2 cols on lg */}
          <div className="flex flex-col justify-between gap-8 p-6 lg:col-span-2" style={CARD}>
            <div>
              <h3 className="text-sm font-bold tracking-widest text-white uppercase mb-3">
                Intervise
              </h3>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Master interview skills with AI-powered coaching. Practice structured answers, get instant feedback, and ace your next interview.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SocialIcons />
              <a
                href="mailto:intervisehq@gmail.com"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[rgba(249,193,37,0.18)] px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:text-[#F9C125]"
                style={{ backgroundColor: 'rgba(8,13,26,0.80)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-[15px]">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                intervisehq@gmail.com
              </a>
            </div>
          </div>

          {/* Resources card */}
          <div className="p-6" style={CARD}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/70 mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                { title: 'Help Center', href: '#' },
                { title: 'Contact Support', href: '#' },
                { title: 'FAQ', href: '#' },
                { title: 'Community', href: '#' },
              ].map((link) => (
                <li key={link.title}>
                  <a
                    href={link.href}
                    className="text-sm text-white/55 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-0.5"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company card */}
          <div className="p-6" style={CARD}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/70 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { title: 'About Intervise', href: '#' },
                { title: 'Careers', href: '#' },
                { title: 'Blog', href: '#' },
                { title: 'Terms of Service', href: '#' },
              ].map((link) => (
                <li key={link.title}>
                  <a
                    href={link.href}
                    className="text-sm text-white/55 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-0.5"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
              <li>
                <PrivacyTrigger />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row px-1">
          <p className="text-xs text-white/30">
            © {year} Intervise. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Built for ambitious candidates.
          </p>
        </div>

      </div>
    </footer>
  )
}
