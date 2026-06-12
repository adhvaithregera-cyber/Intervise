import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { PostHogProvider } from '@/components/posthog-provider'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://intervise.in'),
  title: {
    default: 'Intervise – AI Interview Coaching',
    template: '%s | Intervise',
  },
  description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure. Prepare smarter for your next job interview.',
  keywords: ['interview coaching', 'interview practice', 'AI interview feedback', 'STAR method', 'job interview preparation', 'interview training India', 'mock interview'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://intervise.in',
    siteName: 'Intervise',
    title: 'Intervise – AI Interview Coaching',
    description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Intervise – AI Interview Coaching' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intervise – AI Interview Coaching',
    description: 'Practice interviews with structured answer formats. Get AI feedback on your speaking pace, filler words, and answer structure.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
