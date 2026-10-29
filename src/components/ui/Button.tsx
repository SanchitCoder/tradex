import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/85',
  ghost: 'text-dim hover:bg-panel2 hover:text-ink',
  outline: 'border border-line text-ink hover:border-dim/60 hover:bg-panel2',
  danger: 'bg-down text-white hover:bg-down/85',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}
