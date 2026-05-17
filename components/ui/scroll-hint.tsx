'use client'

import { motion } from 'framer-motion'

export function ScrollHint() {
  return (
    <a
      href="#how-it-works"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#ADBBDA] hover:text-[#7091E6] transition-colors"
      aria-label="Scroll down"
    >
      <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polyline points="4 7 10 13 16 7" />
      </motion.svg>
    </a>
  )
}
