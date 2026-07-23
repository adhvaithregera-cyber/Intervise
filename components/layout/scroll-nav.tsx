'use client'

import { useEffect, useState } from 'react'

export function ScrollNav({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              backgroundColor: 'rgba(8,13,26,0.80)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 1px 0 rgba(249,193,37,0.08)',
            }
          : {
              backgroundColor: 'rgba(8,13,26,0)',
              backdropFilter: 'blur(0px)',
              WebkitBackdropFilter: 'blur(0px)',
              borderBottom: '1px solid rgba(255,255,255,0)',
              boxShadow: 'none',
            }
      }
    >
      {children}
    </nav>
  )
}
