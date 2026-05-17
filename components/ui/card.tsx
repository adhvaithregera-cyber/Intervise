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
        tinted ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
