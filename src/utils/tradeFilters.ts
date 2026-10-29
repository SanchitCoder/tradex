import type { ClosedTrade, TradeFilters } from '../types'
import { holdingMs } from './calculations'
import { toLocalInputValue } from './formatters'

export const EMPTY_FILTERS: TradeFilters = {
  asset: '',
  category: '',
  direction: '',
  outcome: '',
  strategy: '',
  from: '',
  to: '',
}

export function hasActiveFilters(f: TradeFilters): boolean {
  return Object.values(f).some((v) => v !== '')
}

/** Date range applies to the close date, compared as local YYYY-MM-DD. */
export function filterClosed(trades: ClosedTrade[], f: TradeFilters): ClosedTrade[] {
  return trades.filter((t) => {
    if (f.asset && t.asset !== f.asset) return false
    if (f.category && t.category !== f.category) return false
    if (f.direction && t.direction !== f.direction) return false
    if (f.outcome && t.outcome !== f.outcome) return false
    if (f.strategy && t.strategy !== f.strategy) return false
    if (f.from || f.to) {
      const day = toLocalInputValue(t.closedAt).slice(0, 10)
      if (f.from && day < f.from) return false
      if (f.to && day > f.to) return false
    }
    return true
  })
}

export type SortKey =
  | 'closedAt'
  | 'asset'
  | 'direction'
  | 'pnl'
  | 'pnlPct'
  | 'rMultiple'
  | 'holding'
  | 'strategy'

export type SortDir = 'asc' | 'desc'

export function sortClosed(trades: ClosedTrade[], key: SortKey, dir: SortDir): ClosedTrade[] {
  const value = (t: ClosedTrade): string | number => {
    switch (key) {
      case 'closedAt':
        return new Date(t.closedAt).getTime()
      case 'holding':
        return holdingMs(t)
      case 'asset':
      case 'direction':
      case 'strategy':
        return t[key].toLowerCase()
      default:
        return t[key]
    }
  }
  const sign = dir === 'asc' ? 1 : -1
  return [...trades].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * sign
    return ((va as number) - (vb as number)) * sign
  })
}
