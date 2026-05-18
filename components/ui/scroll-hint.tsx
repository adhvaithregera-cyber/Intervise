'use client'

import { motion } from 'framer-motion'

export function ScrollHint() {
  return (
    <a
      href="#how-it-works"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#8ACBD0] hover:text-[#56B6C6] transition-colors"
      aria-label="Scroll down"
    >
      {/* Mouse outline */}
      <div className="relative flex h-10 w-6 items-start justify-center rounded-full border-2 border-current pt-1.5">
        {/* Scrolling dot */}
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </a>
  )
}
