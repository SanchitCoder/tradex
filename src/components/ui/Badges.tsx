import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Direction, Outcome } from '../../types'

export function DirectionBadge({ direction }: { direction: Direction }) {
  const buy = direction === 'BUY'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold ${
        buy ? 'bg-up/15 text-up' : 'bg-down/15 text-down'
      }`}
    >
      {buy ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
      {buy ? 'LONG' : 'SHORT'}
    </span>
  )
}

const OUTCOME_CLASS: Record<Outcome, string> = {
  Profit: 'bg-up/15 text-up',
  Loss: 'bg-down/15 text-down',
  Breakeven: 'bg-dim/20 text-dim',
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${OUTCOME_CLASS[outcome]}`}>
      {outcome}
    </span>
  )
}

export function CategoryTag({ category }: { category: string }) {
  return <span className="text-[10px] uppercase tracking-wider text-dim">{category}</span>
}
