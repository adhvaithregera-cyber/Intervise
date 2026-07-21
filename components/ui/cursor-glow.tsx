'use client'

import { useEffect, useState } from 'react'

export default function CursorGlow() {
  const [pos, setPos] = useState({ x: -300, y: -300 })
  const [isTouch, setIsTouch] = useState(true)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - 150, y: e.clientY - 150 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (isTouch) return null

  return (
    <div
      className="pointer-events-none fixed z-[9999] h-[300px] w-[300px]"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.08s ease-out',
        background: 'radial-gradient(circle, rgba(249,193,37,0.15) 0%, rgba(249,193,37,0.05) 40%, transparent 70%)',
        borderRadius: '50%',
      }}
    />
  )
}
