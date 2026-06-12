import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#080d1a' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#F9C125]">Privacy Policy</h1>
        <p className="text-white/65 mt-1 mb-10">Last updated: June 2025</p>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">Data We Collect</h2>
          <p className="text-white/65 leading-relaxed">
            We collect your account email address, session metadata (timestamp, difficulty, and grade), answer transcripts (text only — not raw audio), per-answer metrics (words per minute and filler word counts), and your question history (which practice questions you have been asked).
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">How Audio Is Processed</h2>
          <p className="text-white/65 leading-relaxed">
            When you record an answer, your audio is sent directly from your browser to AssemblyAI for transcription. The raw audio file is discarded immediately after transcription completes and is never stored in our database. Only the resulting text transcript is saved to your account.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">Third-Party Processors</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/65">
            <li>
              <strong>AssemblyAI</strong> — audio transcription. Privacy policy:{' '}
              <a href="https://assemblyai.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F9C125] transition-colors">
                assemblyai.com/privacy
              </a>
            </li>
            <li>
              <strong>Supabase</strong> — database and authentication. Privacy policy:{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F9C125] transition-colors">
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> — hosting. Privacy policy:{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F9C125] transition-colors">
                vercel.com/legal/privacy-policy
              </a>
            </li>
            <li>
              <strong>Razorpay</strong> — payment processing. Privacy policy:{' '}
              <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#F9C125] transition-colors">
                razorpay.com/privacy
              </a>
            </li>
          </ul>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">Data Retention</h2>
          <p className="text-white/65 leading-relaxed">
            Your account data, session transcripts, and metrics are retained until you delete your account. Free plan users retain session history for 7 days. Student plan users retain history for 30 days. Pro plan users retain history indefinitely. You may request deletion of all your personal data by contacting us.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">Contact</h2>
          <p className="text-white/65 leading-relaxed">
            For privacy-related questions or data deletion requests, please contact us at{' '}
            <a href="mailto:support@intervise.in" className="underline hover:text-[#F9C125] transition-colors">
              support@intervise.in
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
