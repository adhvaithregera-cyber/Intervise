import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { MinimalFooter } from '@/components/ui/minimal-footer'

export const metadata: Metadata = {
  title: 'About Intervise',
  description: 'Intervise is an AI-powered interview coaching platform that helps candidates master structured answer formats, get instant feedback, and walk into every interview prepared.',
  alternates: { canonical: 'https://intervise.in/about' },
}

const CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.14)',
  borderRadius: '1rem',
} as const

const STEPS = [
  {
    number: '01',
    title: 'Pick your difficulty',
    body: 'Choose Easy, Medium, or Hard based on where you are in your prep. Each session gives you 5 questions drawn from 8 behavioural categories.',
  },
  {
    number: '02',
    title: 'Record your answers',
    body: 'You get 8 seconds to read each question, then recording starts. Your answer is timed and transcribed in real time.',
  },
  {
    number: '03',
    title: 'Get your report',
    body: 'See your grade, WPM, filler word count, and 8-category AI feedback on every answer — all in under a minute of processing.',
  },
]

const VALUES = [
  {
    title: 'Honest feedback over encouragement',
    body: 'Most people get vague, encouraging feedback that doesn\'t help them improve. Intervise tells you exactly what went wrong and what to change.',
  },
  {
    title: 'Structure, not memorisation',
    body: 'We train you on 8 answer formats — STAR, PACE, and others — so you can adapt to any question, not just the ones you\'ve scripted.',
  },
  {
    title: 'Practice under real conditions',
    body: 'Timed answers, reading countdowns, and blurred questions after recording starts — because real interviews don\'t give you unlimited time to think.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-20 sm:px-8">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F9C125]/70">About</p>
          <h1 className="mb-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
            We built the coach<br />we wish we had
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/55">
            Intervise is an AI-powered interview coaching platform designed for candidates who want
            real preparation, not false confidence. We give you structured practice, instant analysis,
            and feedback blunt enough to actually make you better.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-12 rounded-2xl p-8 sm:p-10" style={CARD}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#F9C125]/60">Our mission</p>
          <p className="text-xl font-semibold leading-relaxed text-white/90">
            Make professional-grade interview preparation accessible to every candidate — not just
            those who can afford a coach or have friends in the industry to practise with.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="mb-6 text-lg font-bold text-white">How Intervise works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="p-6" style={CARD}>
                <p className="mb-3 text-3xl font-black text-[#F9C125]/30">{step.number}</p>
                <h3 className="mb-2 text-sm font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What makes us different */}
        <div className="mb-12">
          <h2 className="mb-6 text-lg font-bold text-white">What we believe</h2>
          <div className="space-y-4">
            {VALUES.map((v) => (
              <div key={v.title} className="flex gap-5 p-6" style={CARD}>
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#F9C125]" />
                <div>
                  <h3 className="mb-1 text-sm font-bold text-white">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech */}
        <div className="mb-12 p-6 sm:p-8" style={CARD}>
          <h2 className="mb-4 text-lg font-bold text-white">The technology</h2>
          <p className="mb-4 text-sm leading-relaxed text-white/60">
            Intervise runs on a stack purpose-built for low latency and high accuracy. Audio answers
            are transcribed by <strong className="text-white/80">AssemblyAI</strong> (Universal-2 model),
            then scored across 8 behavioural categories by <strong className="text-white/80">OpenAI GPT-4o-mini</strong>.
            Delivery metrics — filler words, words per minute, answer duration — are computed
            deterministically from the transcript. Pro users also get a weakness summary powered by{' '}
            <strong className="text-white/80">Google Gemini 2.5 Flash</strong>.
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            The platform is built on <strong className="text-white/80">Next.js 16</strong> (App Router),
            hosted on <strong className="text-white/80">Vercel</strong>, with{' '}
            <strong className="text-white/80">Supabase</strong> for auth and the database.
            Payments are processed by <strong className="text-white/80">Razorpay</strong>.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-8 text-center" style={{ ...CARD, border: '1px solid rgba(249,193,37,0.25)' }}>
          <h2 className="mb-2 text-lg font-bold text-white">Get in touch</h2>
          <p className="mb-5 text-sm text-white/55">
            Questions, feedback, or press enquiries — we read everything.
          </p>
          <a
            href="mailto:intervisehq@gmail.com"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F9C125] px-6 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all"
          >
            intervisehq@gmail.com
          </a>
          <p className="mt-5 text-xs text-white/35">
            Or visit our{' '}
            <Link href="/help" className="underline underline-offset-2 hover:text-white/60 transition-colors">
              Help Center
            </Link>{' '}
            for common questions.
          </p>
        </div>

      </main>

      <MinimalFooter />
    </div>
  )
}
