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
          ? 'bg-white/60 backdrop-blur-md border-[#8ACBD0]/60 shadow-sm'
          : tinted
          ? 'bg-[#56B6C6]/10 border-[#56B6C6]/30'
          : 'bg-white border-[#8ACBD0] shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
