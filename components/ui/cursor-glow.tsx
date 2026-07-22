'use client'

import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const move = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`
      }
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed left-0 top-0 z-[9998] h-[320px] w-[320px]"
      style={{
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,193,37,0.14) 0%, rgba(249,193,37,0.04) 45%, transparent 70%)',
        transition: 'transform 0.10s ease-out',
      }}
    />
  )
}
