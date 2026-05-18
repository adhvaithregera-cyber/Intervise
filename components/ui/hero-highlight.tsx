'use client'

import { cn } from '@/lib/utils'
import { useMotionValue, motion, useMotionTemplate } from 'framer-motion'
import React from 'react'

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const dotPattern = (color: string) => ({
    backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  })

  return (
    <div
      className={cn('relative flex items-center justify-center w-full group', containerClassName)}
      onMouseMove={handleMouseMove}
    >
      {/* Static dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={dotPattern('rgb(173 187 218)')}
      />
      {/* Mouse-reveal colored dot grid */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          ...dotPattern('rgb(112 145 230)'),
          WebkitMaskImage: useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
          maskImage: useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
        }}
      />
      <div className={cn('relative z-20', className)}>{children}</div>
    </div>
  )
}

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <motion.span
      initial={{ backgroundSize: '0% 3px' }}
      animate={{ backgroundSize: '100% 3px' }}
      transition={{ duration: 1.0, ease: 'easeOut', delay: 0.4 }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left bottom',
        display: 'inline',
        backgroundImage: 'linear-gradient(90deg, #F9C125, #E07A2F)',
      }}
      className={cn('relative inline-block text-[#F9C125]', className)}
    >
      {children}
    </motion.span>
  )
}
