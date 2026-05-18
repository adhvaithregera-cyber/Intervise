import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FEFDF0] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#E07A2F]">Privacy Policy</h1>
        <p className="text-[#A0622A] mt-1 mb-10">Last updated: May 2025</p>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">Data We Collect</h2>
          <p className="text-[#A0622A] leading-relaxed">
            We collect your account email address, session metadata (timestamp, difficulty, and grade), answer transcripts (text only — not raw audio), per-answer metrics (words per minute, filler word counts, and eye contact percentage for Student plan users and above), and your question history (which practice questions you have been asked).
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">How Audio Is Processed</h2>
          <p className="text-[#A0622A] leading-relaxed">
            When you record an answer, your audio is sent directly from your browser to AssemblyAI for transcription. The raw audio file is discarded immediately after transcription completes and is never stored in our database. Only the resulting text transcript is saved to your account.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">Facial Data</h2>
          <p className="text-[#A0622A] leading-relaxed">
            Eye contact analysis uses MediaPipe FaceMesh, which runs entirely within your browser. No video frames, facial landmarks, or any other biometric data are ever transmitted to our servers or to any third party. This feature is available on the Student plan and above.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">Third-Party Processors</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#A0622A]">
            <li>
              <strong>AssemblyAI</strong> — audio transcription. Privacy policy:{' '}
              <a href="https://assemblyai.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E07A2F] transition-colors">
                assemblyai.com/privacy
              </a>
            </li>
            <li>
              <strong>Supabase</strong> — database and authentication. Privacy policy:{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E07A2F] transition-colors">
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> — hosting. Privacy policy:{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E07A2F] transition-colors">
                vercel.com/legal/privacy-policy
              </a>
            </li>
          </ul>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">Data Retention</h2>
          <p className="text-[#A0622A] leading-relaxed">
            Your account data, session transcripts, and metrics are retained until you delete your account. You may request deletion of all your personal data by contacting us.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#E07A2F] mb-4">Contact</h2>
          <p className="text-[#A0622A] leading-relaxed">
            For privacy-related questions or data deletion requests, please contact us at{' '}
            <a href="mailto:privacy@intervise.in" className="underline hover:text-[#E07A2F] transition-colors">
              privacy@intervise.in
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
