import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'glass'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#F9C125] text-[#080d1a] hover:bg-[#F9C125]/85 shadow-md shadow-[#F9C125]/20 focus:ring-[#F9C125]',
  outline:
    'border-2 border-[#F9C125] text-[#F9C125] hover:bg-[#F9C125] hover:text-[#080d1a] focus:ring-[#F9C125]',
  ghost:
    'text-[#F9C125] hover:bg-white/10 focus:ring-[#F9C125]',
  glass:
    'bg-white/70 backdrop-blur-md border border-white/15 text-white hover:bg-white shadow-sm focus:ring-[#F9C125]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080d1a]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
