import { Fragment, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import type { ClosedTrade, Outcome, TradeFilters } from '../types'
import { holdingMs } from '../utils/calculations'
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  formatR,
  formatSignedCurrency,
  formatSignedPercent,
  pnlColor,
} from '../utils/formatters'
import { EMPTY_FILTERS, filterClosed, sortClosed, type SortDir, type SortKey } from '../utils/tradeFilters'
import { Filters } from './Filters'
import { CategoryTag, DirectionBadge, OutcomeBadge } from './ui/Badges'
import { Card, EmptyState } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'

const ROW_TINT: Record<Outcome, string> = {
  Profit: 'bg-up/10 hover:bg-up/[0.16]',
  Loss: 'bg-down/10 hover:bg-down/[0.16]',
  Breakeven: 'bg-dim/10 hover:bg-dim/[0.16]',
}

const th = 'whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dim'
const td = 'whitespace-nowrap px-3 py-3'

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
}

function SortHeader({ label, sortKey, active, dir, onSort, align = 'left' }: SortHeaderProps) {
  const isActive = active === sortKey
  const Icon = !isActive ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      className={`${th} ${align === 'right' ? 'text-right' : 'text-left'}`}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-ink ${isActive ? 'text-ink' : ''}`}
      >
        {label}
        <Icon size={12} aria-hidden className={isActive ? '' : 'opacity-50'} />
      </button>
    </th>
  )
}

export function TradeHistory() {
  const { closedTrades, strategies, dispatch } = useJournal()
  const [filters, setFilters] = useState<TradeFilters>(EMPTY_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>('closedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ClosedTrade | null>(null)

  const assets = useMemo(() => [...new Set(closedTrades.map((t) => t.asset))].sort(), [closedTrades])
  const usedStrategies = useMemo(
    () => strategies.filter((s) => closedTrades.some((t) => t.strategy === s)),
    [strategies, closedTrades],
  )
  const rows = useMemo(
    () => sortClosed(filterClosed(closedTrades, filters), sortKey, sortDir),
    [closedTrades, filters, sortKey, sortDir],
  )
  const filteredPnl = rows.reduce((s, t) => s + t.pnl, 0)

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'asset' || key === 'direction' || key === 'strategy' ? 'asc' : 'desc')
    }
  }
  const header = { active: sortKey, dir: sortDir, onSort }

  return (
    <>
      <Card
        title={`Trade History (${rows.length}${rows.length !== closedTrades.length ? ` of ${closedTrades.length}` : ''})`}
        action={
          rows.length > 0 ? (
            <span className="font-mono text-xs tabular-nums text-dim">
              Net: <span className={pnlColor(filteredPnl)}>{formatSignedCurrency(filteredPnl)}</span>
            </span>
          ) : undefined
        }
        flush
      >
        <Filters filters={filters} onChange={setFilters} assets={assets} strategies={usedStrategies} />

        {rows.length === 0 ? (
          <EmptyState
            message={
              closedTrades.length === 0
                ? 'No closed trades yet. Exit an open trade to see it here.'
                : 'No trades match these filters.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={`${th} w-8`} />
                  <SortHeader label="Closed" sortKey="closedAt" {...header} />
                  <SortHeader label="Asset" sortKey="asset" {...header} />
                  <SortHeader label="Dir" sortKey="direction" {...header} />
                  <th className={`${th} text-right`}>Entry</th>
                  <th className={`${th} text-right`}>Exit</th>
                  <SortHeader label="P&L $" sortKey="pnl" {...header} align="right" />
                  <SortHeader label="P&L %" sortKey="pnlPct" {...header} align="right" />
                  <SortHeader label="R" sortKey="rMultiple" {...header} align="right" />
                  <SortHeader label="Held" sortKey="holding" {...header} align="right" />
                  <th className={`${th} text-left`}>Outcome</th>
                  <SortHeader label="Strategy" sortKey="strategy" {...header} />
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const open = expanded === t.id
                  return (
                    <Fragment key={t.id}>
                      <tr
                        className={`cursor-pointer border-b border-line/60 transition-colors ${ROW_TINT[t.outcome]}`}
                        onClick={() => setExpanded(open ? null : t.id)}
                      >
                        <td className={`${td} text-dim`}>
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={`${open ? 'Hide' : 'Show'} notes for ${t.asset} trade`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpanded(open ? null : t.id)
                            }}
                          >
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className={`${td} text-xs text-dim`}>{formatDateTime(t.closedAt)}</td>
                        <td className={td}>
                          <div className="font-medium text-ink">{t.asset}</div>
                          <CategoryTag category={t.category} />
                          {t.isSample && <span className="ml-2 text-[10px] uppercase text-warn">sample</span>}
                        </td>
                        <td className={td}>
                          <DirectionBadge direction={t.direction} />
                        </td>
                        <td className={`${td} text-right font-mono tabular-nums`}>{formatPrice(t.entry)}</td>
                        <td className={`${td} text-right font-mono tabular-nums`}>{formatPrice(t.exitPrice)}</td>
                        <td className={`${td} text-right font-mono font-semibold tabular-nums ${pnlColor(t.pnl)}`}>
                          {formatSignedCurrency(t.pnl)}
                        </td>
                        <td className={`${td} text-right font-mono tabular-nums ${pnlColor(t.pnl)}`}>
                          {formatSignedPercent(t.pnlPct)}
                        </td>
                        <td className={`${td} text-right font-mono tabular-nums ${pnlColor(t.rMultiple)}`}>
                          {formatR(t.rMultiple)}
                        </td>
                        <td className={`${td} text-right font-mono tabular-nums text-dim`}>
                          {formatDuration(holdingMs(t))}
                        </td>
                        <td className={td}>
                          <OutcomeBadge outcome={t.outcome} />
                        </td>
                        <td className={`${td} text-dim`}>{t.strategy || '—'}</td>
                        <td className={`${td} text-right`}>
                          <button
                            type="button"
                            aria-label={`Delete ${t.asset} trade`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleting(t)
                            }}
                            className="rounded p-1.5 text-dim transition-colors hover:bg-down/15 hover:text-down"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-line/60 bg-panel2">
                          <td />
                          <td colSpan={12} className="px-3 py-3">
                            <div className="grid gap-4 text-sm md:grid-cols-3">
                              <Note label="Reason for entry" text={t.notes} />
                              <Note label="Lesson learned" text={t.postNotes} />
                              <div>
                                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dim">
                                  Exit
                                </div>
                                <p className="text-ink">{t.exitReason}</p>
                                <p className="mt-0.5 text-xs text-dim">Opened {formatDateTime(t.openedAt)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {deleting && (
        <ConfirmDialog
          title="Delete closed trade?"
          confirmLabel="Delete trade"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            dispatch({ type: 'DELETE_TRADE', id: deleting.id })
            setDeleting(null)
          }}
        >
          This removes the {deleting.asset} trade ({formatSignedCurrency(deleting.pnl)}) and recalculates equity and
          all stats. This can&apos;t be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</div>
      {text.trim() ? (
        <p className="whitespace-pre-wrap text-ink">{text}</p>
      ) : (
        <p className="italic text-dim">Nothing written</p>
      )}
    </div>
  )
}
