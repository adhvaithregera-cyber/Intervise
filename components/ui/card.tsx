import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tinted?: boolean
  glass?: boolean
}

export function Card({ className, tinted, glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6',
        glass
          ? 'bg-[rgba(8,13,26,0.6)] backdrop-blur-xl border-[rgba(249,193,37,0.15)] shadow-sm'
          : tinted
          ? 'bg-[#F9C125]/10 border-[#F9C125]/30'
          : 'bg-[rgba(8,13,26,0.75)] backdrop-blur-xl border-[rgba(249,193,37,0.18)] shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
