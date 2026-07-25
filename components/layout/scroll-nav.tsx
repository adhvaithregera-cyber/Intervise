'use client'

import { useEffect, useState } from 'react'

export function ScrollNav({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 16)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0)
    }
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
      {/* Scroll progress bar — gold line along the bottom, no transition so it tracks instantly */}
      <div
        className="absolute bottom-0 left-0 h-[1.5px]"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(to right, rgba(249,193,37,0.5), #F9C125)',
          opacity: progress > 0 ? 1 : 0,
        }}
      />
    </nav>
  )
}
