import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Tailwind max-width class. */
  widthClass?: string
}

export function Modal({ title, onClose, children, footer, widthClass = 'max-w-lg' }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-fade-in flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-line bg-panel shadow-2xl sm:rounded-xl ${widthClass}`}
      >
        <header className="flex items-center justify-between border-b border-line py-2 pl-4 pr-2 sm:pl-5">
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-2.5 text-dim transition-colors hover:bg-panel2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3.5">{footer}</footer>}
      </div>
    </div>
  )
}
