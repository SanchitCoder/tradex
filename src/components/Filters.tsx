import type { ReactNode } from 'react'
import { FilterX } from 'lucide-react'
import type { TradeFilters } from '../types'
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/tradeFilters'
import { inputClass } from './ui/Field'

interface FiltersProps {
  filters: TradeFilters
  onChange: (next: TradeFilters) => void
  assets: string[]
  strategies: string[]
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-dim">{label}</span>
      {children}
    </label>
  )
}

export function Filters({ filters, onChange, assets, strategies }: FiltersProps) {
  const set = <K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) =>
    onChange({ ...filters, [key]: value })
  const cls = `${inputClass} !py-1.5`

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-line p-4 md:grid-cols-4 xl:grid-cols-8">
      <Labeled label="Asset">
        <select className={cls} value={filters.asset} onChange={(e) => set('asset', e.target.value)}>
          <option value="">All</option>
          {assets.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="Category">
        <select
          className={cls}
          value={filters.category}
          onChange={(e) => set('category', e.target.value as TradeFilters['category'])}
        >
          <option value="">All</option>
          <option value="Crypto">Crypto</option>
          <option value="Commodity">Commodity</option>
        </select>
      </Labeled>
      <Labeled label="Direction">
        <select
          className={cls}
          value={filters.direction}
          onChange={(e) => set('direction', e.target.value as TradeFilters['direction'])}
        >
          <option value="">All</option>
          <option value="BUY">Long</option>
          <option value="SELL">Short</option>
        </select>
      </Labeled>
      <Labeled label="Outcome">
        <select
          className={cls}
          value={filters.outcome}
          onChange={(e) => set('outcome', e.target.value as TradeFilters['outcome'])}
        >
          <option value="">All</option>
          <option value="Profit">Profit</option>
          <option value="Loss">Loss</option>
          <option value="Breakeven">Breakeven</option>
        </select>
      </Labeled>
      <Labeled label="Strategy">
        <select className={cls} value={filters.strategy} onChange={(e) => set('strategy', e.target.value)}>
          <option value="">All</option>
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label="From">
        <input type="date" className={cls} value={filters.from} max={filters.to || undefined} onChange={(e) => set('from', e.target.value)} />
      </Labeled>
      <Labeled label="To">
        <input type="date" className={cls} value={filters.to} min={filters.from || undefined} onChange={(e) => set('to', e.target.value)} />
      </Labeled>
      <div className="flex items-end">
        <button
          type="button"
          disabled={!hasActiveFilters(filters)}
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-dim transition-colors hover:bg-panel2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FilterX size={14} aria-hidden /> Clear
        </button>
      </div>
    </div>
  )
}
