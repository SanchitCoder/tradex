import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Remove body padding (for full-bleed tables). */
  flush?: boolean
}

export function Card({ title, subtitle, action, children, className = '', flush }: CardProps) {
  return (
    <section className={`min-w-0 rounded-xl border border-line bg-panel transition-colors ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-dim">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center px-4 py-8 text-center text-sm text-dim">
      {message}
    </div>
  )
}
