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
          ? 'bg-white/60 backdrop-blur-md border-[#ADBBDA]/60 shadow-sm'
          : tinted
          ? 'bg-[#7091E6]/10 border-[#7091E6]/30'
          : 'bg-white border-[#ADBBDA] shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
