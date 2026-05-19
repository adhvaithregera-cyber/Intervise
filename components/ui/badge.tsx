import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'brand' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  brand: 'bg-[#F9C125]/20 text-[#F9C125] border border-[#F9C125]/40',
  gray:  'bg-white/10 text-white/80 border border-white/20',
  green: 'bg-green-500/20 text-green-300 border border-green-500/30',
  red:   'bg-red-500/20 text-red-300 border border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

export function Badge({ variant = 'brand', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
