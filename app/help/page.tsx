import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { MinimalFooter } from '@/components/ui/minimal-footer'

export const metadata: Metadata = {
  title: 'Help Center — Intervise',
  description: 'Answers to common questions about Intervise — how sessions work, grading, account management, billing, and more.',
  alternates: { canonical: 'https://intervise.in/help' },
}

const CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.14)',
  borderRadius: '1rem',
} as const

const CATEGORIES = [
  {
    title: 'How it works',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    faqs: [
      {
        q: 'What is Intervise?',
        a: 'Intervise is an AI-powered interview coaching platform. You practice answering behavioural interview questions out loud, and receive instant automated feedback on your answer structure, delivery, filler words, pace, and overall quality.',
      },
      {
        q: 'What types of questions does Intervise cover?',
        a: 'Intervise focuses on behavioural interview questions drawn from 8 competency categories: Leadership, Teamwork, Problem Solving, Communication, Adaptability, Conflict Resolution, Initiative, and Time Management. Questions are graded Easy, Medium, or Hard.',
      },
      {
        q: 'What answer formats does Intervise teach?',
        a: 'Intervise trains you on 8 structured answer frameworks — including STAR (Situation, Task, Action, Result), PACE, and others — so you can adapt to any question rather than memorising scripted answers.',
      },
      {
        q: 'How does a session work?',
        a: 'Each session gives you 5 questions. You have 8 seconds to read each question, then recording starts automatically. Your answer is timed and transcribed. After the session ends, you receive a full report with grades, delivery metrics, and per-answer AI feedback — usually within 60 seconds.',
      },
      {
        q: 'Is there a time limit on answers?',
        a: 'Yes. Answers are timed to simulate real interview conditions. You can see the elapsed time while recording. There is no hard cutoff, but the AI scoring takes duration into account — both overly short and very long answers receive lower scores.',
      },
    ],
  },
  {
    title: 'Sessions & quotas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    faqs: [
      {
        q: 'How many sessions do I get each month?',
        a: 'Free plan: 2 sessions per calendar month. Student plan: 12 sessions. Pro plan: 30 sessions. Quotas reset at the start of each calendar month. Unused sessions do not roll over.',
      },
      {
        q: 'What difficulty levels can I access?',
        a: 'Free plan: Easy questions only. Student plan: Easy and Medium. Pro plan: Easy, Medium, Hard, and Mixed (a combination of all difficulties).',
      },
      {
        q: 'What happens if I accidentally start a session?',
        a: 'You can exit the session during the first question by clicking the exit button that appears in the top-right corner for the first 10 seconds. Exiting this way cancels the session and restores your quota.',
      },
      {
        q: 'Can I pause or save a session mid-way?',
        a: 'Sessions must be completed in one sitting. There is no pause or resume feature. If your browser closes or you navigate away mid-session, the session is marked incomplete.',
      },
      {
        q: 'How long is my session history saved?',
        a: 'Free plan: 7 days. Student plan: 30 days. Pro plan: indefinitely. After the retention window, older sessions are automatically removed from your dashboard.',
      },
    ],
  },
  {
    title: 'Grading & feedback',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
    faqs: [
      {
        q: 'How is my overall grade calculated?',
        a: 'Your overall session grade (A+ through F) is derived from the average of your 5 answer scores, each of which is itself an average of 8 AI-evaluated rubric categories. Delivery metrics (WPM, filler words) and answer duration also factor in as separate score components.',
      },
      {
        q: 'What are the 8 rubric categories?',
        a: 'STAR structure, Relevance, Depth & Detail, Leadership & Ownership, Communication Clarity, Problem Solving, Self-Awareness, and Overall Impact. Each is scored 1–10 by the AI model.',
      },
      {
        q: 'What is a good words-per-minute (WPM) rate?',
        a: 'The target WPM range is 120–160. Speaking faster than 180 WPM or slower than 90 WPM both result in lower scores. Intervise gives you your exact WPM for each answer.',
      },
      {
        q: 'What counts as a filler word?',
        a: 'Common fillers including "um", "uh", "like", "you know", "so", "basically", "literally", "right", "actually", and "kind of" are counted. The target is fewer than 3 filler words per answer.',
      },
      {
        q: 'Is AI feedback always accurate?',
        a: 'AI feedback is generated by large language models (OpenAI GPT-4o-mini) and is automated. It is a useful training signal but should not be treated as definitive. Treat it as one input among many in your preparation, not as professional career advice.',
      },
      {
        q: 'Why is the AI feedback blurred on the Free plan?',
        a: 'Detailed per-answer AI coaching is a paid feature. Free plan users can see their grade, WPM, and filler counts, but the AI feedback panel is blurred. Upgrading to Student or Pro immediately unlocks full feedback on all your existing sessions.',
      },
    ],
  },
  {
    title: 'Account & profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    faqs: [
      {
        q: 'How do I change my password?',
        a: 'Go to Profile (top-right avatar) → Security tab → Change Password. You will need to enter your current password and choose a new one.',
      },
      {
        q: 'Can I change my email address?',
        a: 'Email address changes are not yet available through the app. Contact us at support@intervise.in and we will assist you.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Profile → Danger Zone → Delete Account. This permanently removes your account and all associated data within 30 days. Deletion cannot be undone.',
      },
      {
        q: 'What information can I update in my profile?',
        a: 'You can update your full name, target role, upcoming interview date, and self-identified biggest weakness (used to personalise question selection). These fields are all optional.',
      },
    ],
  },
  {
    title: 'Billing & subscriptions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    faqs: [
      {
        q: 'What plans are available?',
        a: 'Free (₹0/month), Student (₹199/month or ₹499/quarter), and Pro (₹349/month or ₹999/quarter). All prices are in Indian Rupees and inclusive of applicable taxes.',
      },
      {
        q: 'How do I upgrade or downgrade my plan?',
        a: 'Go to Profile → Subscription to manage your plan. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.',
      },
      {
        q: 'Do subscriptions auto-renew?',
        a: 'Yes. Subscriptions automatically renew at the end of each billing period (monthly or quarterly depending on what you selected). You can cancel anytime from your profile — cancellation takes effect at the end of the current period and you retain access until then.',
      },
      {
        q: 'Can I get a refund?',
        a: 'We do not issue refunds for partial billing periods. If you believe you were charged in error, contact us at support@intervise.in within 7 days of the charge and we will investigate.',
      },
      {
        q: 'How are payments processed?',
        a: 'Payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card or banking details — only your subscription status and Razorpay subscription ID are stored by Intervise.',
      },
    ],
  },
  {
    title: 'Technical & privacy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    faqs: [
      {
        q: 'Which browsers are supported?',
        a: 'Intervise works best on Chrome, Edge, and Firefox (latest versions). Safari is supported but may have minor audio recording differences. Mobile browsers are not officially supported — use a desktop or laptop for the best experience.',
      },
      {
        q: 'Is my audio stored?',
        a: 'No. Your audio is sent directly from your browser to AssemblyAI for transcription and is discarded after processing. It is never stored on Intervise servers. Only the text transcript is saved to your account.',
      },
      {
        q: 'Why does Intervise need microphone access?',
        a: 'Recording your spoken answer requires microphone access. You will see a browser permission prompt the first time you start a session. If you deny permission, you will not be able to record answers. You can change this in your browser site settings.',
      },
      {
        q: 'Is my data shared with third parties?',
        a: 'Your data is shared only with the processors required to deliver the service: AssemblyAI (transcription), OpenAI and Google Gemini (AI feedback), Supabase (database), Vercel (hosting), and Razorpay (payments). See our Privacy Policy for full details.',
      },
      {
        q: 'How do I contact support?',
        a: 'Email us at support@intervise.in. We aim to respond within 2 business days. For billing issues, please include your registered email address and the date of the charge.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-20 sm:px-8">

        <div className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#F9C125]/70">Support</p>
          <h1 className="mb-3 text-4xl font-black tracking-tight text-white">Help Center</h1>
          <p className="text-sm text-white/40">Everything you need to know about using Intervise.</p>
        </div>

        {/* Contact CTA */}
        <div className="mb-10 rounded-xl p-6" style={{ ...CARD, border: '1px solid rgba(249,193,37,0.22)' }}>
          <p className="text-sm text-white/65">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a
              href="mailto:support@intervise.in"
              className="text-[#F9C125]/80 underline underline-offset-2 hover:text-[#F9C125] transition-colors"
            >
              Email our support team
            </a>{' '}
            — we respond within 2 business days.
          </p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.title} className="rounded-xl overflow-hidden" style={CARD}>
              {/* Category header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                <span className="text-[#F9C125]/70">{cat.icon}</span>
                <h2 className="text-sm font-bold text-white">{cat.title}</h2>
              </div>

              {/* FAQ items */}
              <div className="divide-y divide-white/[0.05]">
                {cat.faqs.map((faq, i) => (
                  <div key={i} className="px-6 py-5">
                    <p className="mb-2 text-sm font-semibold text-white/90">{faq.q}</p>
                    <p className="text-sm leading-relaxed text-white/55">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom contact */}
        <div className="mt-10 rounded-xl p-8 text-center" style={{ ...CARD, border: '1px solid rgba(249,193,37,0.22)' }}>
          <h2 className="mb-2 text-base font-bold text-white">Still need help?</h2>
          <p className="mb-5 text-sm text-white/55">
            Our support team reads every message and typically replies within 2 business days.
          </p>
          <a
            href="mailto:support@intervise.in"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F9C125] px-6 py-2.5 text-sm font-bold text-[#080d1a] hover:brightness-110 transition-all"
          >
            support@intervise.in
          </a>
        </div>

      </main>
      <MinimalFooter />
    </div>
  )
}
