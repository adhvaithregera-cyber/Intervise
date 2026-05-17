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
    'bg-[#3D52A0] text-white hover:bg-[#2d3d78] shadow-md shadow-[#3D52A0]/20 focus:ring-[#3D52A0]',
  outline:
    'border-2 border-[#3D52A0] text-[#3D52A0] hover:bg-[#3D52A0] hover:text-white focus:ring-[#3D52A0]',
  ghost:
    'text-[#3D52A0] hover:bg-[#ADBBDA]/40 focus:ring-[#3D52A0]',
  glass:
    'bg-white/70 backdrop-blur-md border border-[#ADBBDA] text-[#3D52A0] hover:bg-white shadow-sm focus:ring-[#7091E6]',
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
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#EDE8F5]',
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
