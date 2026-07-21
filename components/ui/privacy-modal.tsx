'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      panelRef.current?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="privacy-backdrop"
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            key="privacy-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-modal-title"
            tabIndex={-1}
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#080d1a]/95 backdrop-blur-2xl shadow-2xl outline-none"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#080d1a]/95 backdrop-blur-2xl">
              <h2 id="privacy-modal-title" className="text-xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={onClose}
                aria-label="Close privacy policy"
                className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Data We Collect */}
              <section>
                <h3 className="text-white font-semibold text-base mb-2">Data We Collect</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  We collect your account email address, session metadata (timestamp, difficulty, and grade), answer transcripts (text only — not raw audio), per-answer metrics (words per minute and filler word counts), and your question history (which practice questions you have been asked).
                </p>
              </section>

              {/* How Audio Is Processed */}
              <section>
                <h3 className="text-white font-semibold text-base mb-2">How Audio Is Processed</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  When you record an answer, your audio is sent directly from your browser to AssemblyAI for transcription. The raw audio file is discarded immediately after transcription completes and is never stored in our database. Only the resulting text transcript is saved to your account.
                </p>
              </section>

              {/* Third-Party Processors */}
              <section>
                <h3 className="text-white font-semibold text-base mb-2">Third-Party Processors</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/70 text-sm leading-relaxed">
                  <li>
                    <strong className="text-white/90">AssemblyAI</strong> — audio transcription. Privacy policy:{' '}
                    <a
                      href="https://assemblyai.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#F9C125] transition-colors"
                    >
                      assemblyai.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong className="text-white/90">Supabase</strong> — database and authentication. Privacy policy:{' '}
                    <a
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#F9C125] transition-colors"
                    >
                      supabase.com/privacy
                    </a>
                  </li>
                  <li>
                    <strong className="text-white/90">Vercel</strong> — hosting. Privacy policy:{' '}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#F9C125] transition-colors"
                    >
                      vercel.com/legal/privacy-policy
                    </a>
                  </li>
                  <li>
                    <strong className="text-white/90">Razorpay</strong> — payment processing. Privacy policy:{' '}
                    <a
                      href="https://razorpay.com/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#F9C125] transition-colors"
                    >
                      razorpay.com/privacy
                    </a>
                  </li>
                </ul>
              </section>

              {/* Data Retention */}
              <section>
                <h3 className="text-white font-semibold text-base mb-2">Data Retention</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Your account data, session transcripts, and metrics are retained until you delete your account. Free plan users retain session history for 7 days. Student plan users retain history for 30 days. Pro plan users retain history indefinitely. You may request deletion of all your personal data by contacting us.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h3 className="text-white font-semibold text-base mb-2">Contact</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  For privacy-related questions or data deletion requests, please contact us at{' '}
                  <a
                    href="mailto:support@intervise.in"
                    className="underline hover:text-[#F9C125] transition-colors"
                  >
                    support@intervise.in
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 text-white/40 text-xs">
              Last updated: June 2025
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
