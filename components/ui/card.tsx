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
          ? 'bg-white/60 backdrop-blur-md border-[#A0622A]/60 shadow-sm'
          : tinted
          ? 'bg-[#F9C125]/10 border-[#F9C125]/30'
          : 'bg-white border-[#A0622A] shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
