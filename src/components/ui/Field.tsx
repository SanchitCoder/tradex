import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-dim/60 ' +
  'transition-colors hover:border-dim/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

export const monoInputClass = `${inputClass} font-mono tabular-nums`

export const invalidClass = 'border-down/70 focus:border-down focus:ring-down/40'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-dim">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-down">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-dim">{hint}</p>
      ) : null}
    </div>
  )
}
