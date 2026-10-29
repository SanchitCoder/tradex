interface Option<T extends string> {
  value: T
  label: string
  /** Classes applied when this option is selected. */
  activeClass?: string
}

interface SegmentedProps<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
}

const DEFAULT_ACTIVE = 'bg-accent text-white'

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-line bg-bg p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? (o.activeClass ?? DEFAULT_ACTIVE) : 'text-dim hover:bg-panel2 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
