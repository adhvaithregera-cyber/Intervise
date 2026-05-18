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
    'bg-[#170C79] text-white hover:bg-[#0f0955] shadow-md shadow-[#170C79]/20 focus:ring-[#170C79]',
  outline:
    'border-2 border-[#170C79] text-[#170C79] hover:bg-[#170C79] hover:text-white focus:ring-[#170C79]',
  ghost:
    'text-[#170C79] hover:bg-[#8ACBD0]/40 focus:ring-[#170C79]',
  glass:
    'bg-white/70 backdrop-blur-md border border-[#8ACBD0] text-[#170C79] hover:bg-white shadow-sm focus:ring-[#56B6C6]',
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
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#EFE3CA]',
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
