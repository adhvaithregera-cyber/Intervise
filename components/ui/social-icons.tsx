"use client"

import { useState } from "react"

const socials = [
  {
    name: "X",
    href: "https://x.com/intervisehq",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/intervisehq/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/intervisehq",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export function SocialIcons() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="relative flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl border border-[rgba(249,193,37,0.18)]"
      style={{ backgroundColor: 'rgba(8,13,26,0.80)' }}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

      {socials.map((social, index) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center size-10 rounded-xl transition-colors duration-200"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          aria-label={social.name}
        >
          {/* Hover bg */}
          <span
            className="absolute inset-1 rounded-lg transition-all duration-300 ease-out"
            style={{
              backgroundColor: 'rgba(249,193,37,0.12)',
              opacity: hoveredIndex === index ? 1 : 0,
              transform: hoveredIndex === index ? 'scale(1)' : 'scale(0.9)',
            }}
          />

          {/* Icon */}
          <span
            className="relative z-10 transition-all duration-300 ease-out"
            style={{
              color: hoveredIndex === index ? '#F9C125' : 'rgba(255,255,255,0.35)',
              transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {social.icon}
          </span>

          {/* Underline dot */}
          <span
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ease-out"
            style={{
              backgroundColor: '#F9C125',
              width: hoveredIndex === index ? '0.75rem' : '0',
              opacity: hoveredIndex === index ? 1 : 0,
            }}
          />

          {/* Tooltip label */}
          <span
            className="absolute -top-10 left-1/2 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-300 ease-out"
            style={{
              backgroundColor: '#F9C125',
              color: '#080d1a',
              opacity: hoveredIndex === index ? 1 : 0,
              transform: hoveredIndex === index ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(4px)',
              pointerEvents: hoveredIndex === index ? 'auto' : 'none',
            }}
          >
            {social.name}
          </span>
          {/* Arrow — anchored to the icon, not the label, so it always points at the right icon */}
          <span
            className="absolute size-2 rotate-45 left-1/2 transition-all duration-300 ease-out"
            style={{
              top: '-0.875rem',
              marginLeft: '-0.25rem',
              backgroundColor: '#F9C125',
              opacity: hoveredIndex === index ? 1 : 0,
              transform: hoveredIndex === index ? 'translateY(0) rotate(45deg)' : 'translateY(4px) rotate(45deg)',
            }}
          />
        </a>
      ))}
    </div>
  )
}
