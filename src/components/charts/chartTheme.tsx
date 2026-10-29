import type { ReactNode } from 'react'

export const CHART = {
  up: '#2ebd85',
  down: '#f6465d',
  neutral: '#8a8fa3',
  accent: '#3b82f6',
  grid: '#262b3a',
  axis: '#8a8fa3',
} as const

export const AXIS_TICK = { fill: CHART.axis, fontSize: 11 }

/** Shared tooltip chrome. Text uses ink tokens; color lives on the marker, not the words. */
export function TooltipBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel2 px-3 py-2 text-xs shadow-xl">
      {title && <div className="mb-1 font-semibold text-ink">{title}</div>}
      {children}
    </div>
  )
}

export function LegendDot({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-dim">
      <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      <span>{label}</span>
      {value && <span className="font-mono tabular-nums text-ink">{value}</span>}
    </span>
  )
}
