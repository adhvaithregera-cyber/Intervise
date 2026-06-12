import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions for using Intervise.',
  alternates: { canonical: 'https://intervise.in/terms' },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#080d1a' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#F9C125]">Terms of Service</h1>
        <p className="text-white/65 mt-1 mb-10">Last updated: June 2025</p>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">1. Acceptance of Terms</h2>
          <p className="text-white/65 leading-relaxed">
            By creating an account or using Intervise (&ldquo;the Service&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including free and paid plan subscribers.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">2. Description of Service</h2>
          <p className="text-white/65 leading-relaxed">
            Intervise is an AI-powered interview coaching platform. It allows you to practice answering interview questions, receive automated feedback on your speaking pace, filler words, and answer structure, and track your progress over time. The Service is provided for personal, non-commercial use.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">3. Account Eligibility</h2>
          <p className="text-white/65 leading-relaxed">
            You must be at least 16 years old to create an account. By using the Service, you confirm that the information you provide is accurate and that you will keep it up to date. You are responsible for maintaining the security of your account credentials.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">4. Subscriptions and Payments</h2>
          <div className="text-white/65 leading-relaxed space-y-3">
            <p>
              Intervise offers a free tier and paid subscription plans (Student and Pro). Paid plans are billed on a monthly or quarterly basis via Razorpay. Prices are shown in Indian Rupees (INR) and include all applicable taxes.
            </p>
            <p>
              Subscriptions auto-renew at the end of each billing period unless cancelled. You may cancel at any time from your profile page. Cancellation takes effect at the end of the current billing period — you retain full access until then.
            </p>
            <p>
              We do not issue refunds for partial billing periods. If you believe you were charged in error, contact us within 7 days of the charge.
            </p>
          </div>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">5. Acceptable Use</h2>
          <div className="text-white/65 leading-relaxed space-y-3">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Attempt to circumvent session quotas, tier restrictions, or payment verification</li>
              <li>Use automated tools, bots, or scripts to interact with the Service</li>
              <li>Share account credentials with others</li>
              <li>Reverse-engineer, scrape, or copy the Service or its question bank</li>
              <li>Use the Service for any unlawful purpose</li>
            </ul>
          </div>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">6. Intellectual Property</h2>
          <p className="text-white/65 leading-relaxed">
            All content, question banks, and software that make up Intervise are owned by or licensed to us. Your practice transcripts and session data belong to you. By using the Service, you grant us a limited licence to process your data solely to provide and improve the Service.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">7. Disclaimers</h2>
          <div className="text-white/65 leading-relaxed space-y-3">
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that using Intervise will result in job offers, interview success, or any specific outcome.
            </p>
            <p>
              AI-generated feedback is automated and may not be accurate in every case. It should be used as one input among many in your interview preparation — not as professional career advice.
            </p>
          </div>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">8. Limitation of Liability</h2>
          <p className="text-white/65 leading-relaxed">
            To the fullest extent permitted by law, Intervise and its operators shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the Service. Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months prior to the claim.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">9. Changes to These Terms</h2>
          <p className="text-white/65 leading-relaxed">
            We may update these Terms from time to time. If we make material changes, we will notify you via the email address on your account. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">10. Governing Law</h2>
          <p className="text-white/65 leading-relaxed">
            These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-[#F9C125] mb-4">11. Contact</h2>
          <p className="text-white/65 leading-relaxed">
            For questions about these Terms, please contact us at{' '}
            <a href="mailto:support@intervise.in" className="underline hover:text-[#F9C125] transition-colors">
              support@intervise.in
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
