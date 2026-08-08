import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { MinimalFooter } from '@/components/ui/minimal-footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — Intervise',
  description: 'How Intervise collects, uses, and protects your personal data.',
  alternates: { canonical: 'https://intervise.in/privacy' },
}

const CARD = {
  backgroundColor: 'rgba(8,13,26,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,193,37,0.14)',
  borderRadius: '1rem',
} as const

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-8">

        <div className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#F9C125]/70">Legal</p>
          <h1 className="mb-3 text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-white/40">Last updated: July 2026</p>
        </div>

        <div className="mb-8 rounded-xl p-6" style={CARD}>
          <p className="text-sm leading-relaxed text-white/65">
            This Privacy Policy explains what personal data Intervise collects, how we use it, who we
            share it with, and what rights you have. By using Intervise you agree to this policy. If
            you do not agree, please do not use our service.
          </p>
        </div>

        <div className="space-y-5">

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">1. Who we are</h2>
            <p className="text-sm leading-relaxed text-white/65">
              Intervise is an AI-powered interview coaching platform operated from India. We can be
              reached at{' '}
              <a href="mailto:support@intervise.in" className="text-[#F9C125]/80 underline underline-offset-2 hover:text-[#F9C125] transition-colors">
                support@intervise.in
              </a>{' '}
              for any privacy-related enquiries.
            </p>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">2. What data we collect</h2>
            <ul className="space-y-2.5">
              {[
                'Account information — your email address and (optionally) your full name, age, and target role, provided during signup and onboarding.',
                'Session metadata — timestamp, difficulty level, and overall grade for each practice session.',
                'Answer transcripts — the text output of your recorded answers. Raw audio files are never stored (see Section 3).',
                'Performance metrics — words per minute, filler word counts, and AI-generated scores for each answer.',
                'Question history — which practice questions you have been asked, used to avoid repetition.',
                'Profile preferences — interview date, biggest weakness, and other optional fields you fill in.',
                'Payment information — processed entirely by Razorpay. We store only your Razorpay subscription ID and subscription status; no card or banking details are held by us.',
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">3. How audio is processed</h2>
            <p className="text-sm leading-relaxed text-white/65">
              When you record an answer, your audio is transmitted directly from your browser to
              AssemblyAI&apos;s servers for transcription. The audio file is used solely for this
              transcription and is discarded by AssemblyAI after processing — it is never sent to
              our servers or stored in our database. Only the resulting text transcript is saved to
              your account.
            </p>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">4. How we use your data</h2>
            <ul className="space-y-2.5">
              {[
                'To provide the core service — practice sessions, AI feedback, progress tracking, and grading.',
                'To personalise question selection — difficulty gating, adaptive question pools, and history-based deduplication.',
                'To calculate your performance metrics — filler word detection, WPM, and duration scoring.',
                'To generate AI coaching feedback — your transcript and metrics are sent to OpenAI and Google Gemini to produce per-answer feedback and weakness summaries (Pro).',
                'To manage your subscription — checking your tier limits and session quotas.',
                'To improve the platform — anonymised usage analytics help us identify where users get stuck or drop off.',
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">5. Third-party processors</h2>
            <p className="mb-4 text-sm leading-relaxed text-white/65">
              We share data with the following processors only to the extent necessary to deliver our service:
            </p>
            <ul className="space-y-3">
              {[
                { name: 'AssemblyAI', desc: 'Audio transcription.', url: 'https://www.assemblyai.com/legal/privacy-policy', label: 'assemblyai.com/privacy' },
                { name: 'OpenAI', desc: 'AI answer feedback. Anonymised transcripts and metrics only.', url: 'https://openai.com/privacy', label: 'openai.com/privacy' },
                { name: 'Google (Gemini)', desc: 'Weakness summaries for Pro users.', url: 'https://policies.google.com/privacy', label: 'policies.google.com/privacy' },
                { name: 'Supabase', desc: 'Database and authentication.', url: 'https://supabase.com/privacy', label: 'supabase.com/privacy' },
                { name: 'Vercel', desc: 'Hosting and edge network.', url: 'https://vercel.com/legal/privacy-policy', label: 'vercel.com/legal/privacy-policy' },
                { name: 'Razorpay', desc: 'Payment processing.', url: 'https://razorpay.com/privacy/', label: 'razorpay.com/privacy' },
              ].map((p) => (
                <li key={p.name} className="flex gap-3 text-sm leading-relaxed text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]/50" />
                  <span>
                    <strong className="text-white/85">{p.name}</strong> — {p.desc}{' '}
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[#F9C125]/70 underline underline-offset-2 hover:text-[#F9C125] transition-colors">
                      {p.label}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">6. Data retention</h2>
            <ul className="space-y-2.5">
              {[
                'Free plan — session transcripts and metrics are visible for 7 days. Account data is retained until account deletion.',
                'Student plan — session history retained for 30 days.',
                'Pro plan — session history retained indefinitely.',
                'After account deletion, all personal data is removed within 30 days, except where retention is required by law (e.g. payment records).',
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9C125]/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">7. Your rights</h2>
            <p className="text-sm leading-relaxed text-white/65">
              You have the right to access, correct, or delete your personal data at any time. To
              exercise these rights, email us at{' '}
              <a href="mailto:support@intervise.in" className="text-[#F9C125]/80 underline underline-offset-2 hover:text-[#F9C125] transition-colors">
                support@intervise.in
              </a>
              . We will respond within 30 days. You may also initiate account deletion from your
              profile settings.
            </p>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">8. Cookies</h2>
            <p className="text-sm leading-relaxed text-white/65">
              We use only essential session cookies set by Supabase for authentication. We do not use
              advertising or third-party tracking cookies. Session cookies cannot be opted out of as
              they are required for the service to function.
            </p>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">9. Children</h2>
            <p className="text-sm leading-relaxed text-white/65">
              Intervise is not directed at children under the age of 16. We do not knowingly collect
              personal data from anyone under 16. If you believe we have collected data from a minor,
              please contact us immediately.
            </p>
          </div>

          <div className="p-6 sm:p-7" style={CARD}>
            <h2 className="mb-3 text-base font-bold text-white">10. Changes to this policy</h2>
            <p className="text-sm leading-relaxed text-white/65">
              We may update this Privacy Policy from time to time. Material changes will be
              communicated by updating the &quot;Last updated&quot; date above and, where appropriate,
              by notifying you by email.
            </p>
          </div>

        </div>

        <div className="mt-8 rounded-xl p-6 text-center" style={{ ...CARD, border: '1px solid rgba(249,193,37,0.22)' }}>
          <p className="text-sm text-white/55">
            Privacy questions?{' '}
            <a href="mailto:support@intervise.in" className="text-[#F9C125] underline underline-offset-2 hover:opacity-80 transition-opacity">
              support@intervise.in
            </a>
          </p>
        </div>

      </main>
      <MinimalFooter />
    </div>
  )
}
