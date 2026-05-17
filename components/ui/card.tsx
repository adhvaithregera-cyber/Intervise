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
          ? 'bg-white/60 backdrop-blur-md border-white/70 shadow-sm'
          : tinted
          ? 'bg-brand-50 border-brand-100'
          : 'bg-white border-slate-200 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
