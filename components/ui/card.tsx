import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tinted?: boolean
}

export function Card({ className, tinted, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        tinted
          ? 'bg-brand-900/30 border-brand-700/50'
          : 'bg-surface-raised border-surface-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
