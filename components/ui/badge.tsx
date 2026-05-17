import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'brand' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  brand: 'bg-[#7091E6]/15 text-[#3D52A0] border border-[#7091E6]/40',
  gray:  'bg-[#8697C4]/15 text-[#3D52A0] border border-[#ADBBDA]',
  green: 'bg-green-50 text-green-700 border border-green-200',
  red:   'bg-red-50 text-red-700 border border-red-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
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
