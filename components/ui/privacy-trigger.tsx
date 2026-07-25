'use client'

import { useState } from 'react'
import { PrivacyModal } from '@/components/ui/privacy-modal'

export function PrivacyTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-white/55 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C125] focus-visible:rounded px-0.5"
      >
        Privacy Policy
      </button>
      <PrivacyModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
