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
    'bg-[#E07A2F] text-white hover:bg-[#C96A1A] shadow-md shadow-[#E07A2F]/20 focus:ring-[#E07A2F]',
  outline:
    'border-2 border-[#E07A2F] text-[#E07A2F] hover:bg-[#E07A2F] hover:text-white focus:ring-[#E07A2F]',
  ghost:
    'text-[#E07A2F] hover:bg-[#6BA3C8]/40 focus:ring-[#E07A2F]',
  glass:
    'bg-white/70 backdrop-blur-md border border-[#6BA3C8] text-[#E07A2F] hover:bg-white shadow-sm focus:ring-[#F9C125]',
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
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FEFDF0]',
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
