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
import { Metric } from './ui/Metric'
import { inputClass } from './ui/Field'

const ROW_TINT: Record<Outcome, string> = {
  Profit: 'bg-up/10 hover:bg-up/[0.16]',
  Loss: 'bg-down/10 hover:bg-down/[0.16]',
  Breakeven: 'bg-dim/10 hover:bg-dim/[0.16]',
}

const th = 'whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dim'
const td = 'whitespace-nowrap px-3 py-3'

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'closedAt', label: 'Date closed' },
  { key: 'pnl', label: 'P&L $' },
  { key: 'pnlPct', label: 'P&L %' },
  { key: 'rMultiple', label: 'R multiple' },
  { key: 'holding', label: 'Time held' },
  { key: 'asset', label: 'Asset' },
  { key: 'direction', label: 'Direction' },
  { key: 'strategy', label: 'Strategy' },
]

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
          <>
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 lg:hidden">
            <label htmlFor="th-sort" className="text-[11px] font-medium uppercase tracking-wider text-dim">
              Sort
            </label>
            <select
              id="th-sort"
              className={`${inputClass} flex-1`}
              value={sortKey}
              onChange={(e) => onSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              aria-label={sortDir === 'asc' ? 'Ascending, switch to descending' : 'Descending, switch to ascending'}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-line text-dim transition-colors hover:bg-panel2 hover:text-ink"
            >
              {sortDir === 'asc' ? <ArrowUp size={16} aria-hidden /> : <ArrowDown size={16} aria-hidden />}
            </button>
          </div>
          <ul className="lg:hidden">
            {rows.map((t) => {
              const open = expanded === t.id
              return (
                <li key={t.id} className={`space-y-3 border-b border-line/60 p-4 ${ROW_TINT[t.outcome]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{t.asset}</div>
                      <CategoryTag category={t.category} />
                      {t.isSample && <span className="ml-2 text-[10px] uppercase text-warn">sample</span>}
                      <div className="mt-1 text-xs text-dim">{formatDateTime(t.closedAt)}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <DirectionBadge direction={t.direction} />
                      <OutcomeBadge outcome={t.outcome} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono tabular-nums">
                    <span className={`text-lg font-semibold ${pnlColor(t.pnl)}`}>{formatSignedCurrency(t.pnl)}</span>
                    <span className={`text-sm ${pnlColor(t.pnl)}`}>{formatSignedPercent(t.pnlPct)}</span>
                    <span className={`text-sm ${pnlColor(t.rMultiple)}`}>{formatR(t.rMultiple)}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5 rounded-lg border border-line bg-bg p-3">
                    <Metric label="Entry" value={formatPrice(t.entry)} />
                    <Metric label="Exit" value={formatPrice(t.exitPrice)} />
                    <Metric label="Held" value={formatDuration(holdingMs(t))} tone="text-dim" />
                    <div className="col-span-3 min-w-0">
                      <dt className="text-[11px] text-dim">Strategy</dt>
                      <dd className="text-[13px] text-ink">{t.strategy || '—'}</dd>
                    </div>
                  </dl>
                  {open && (
                    <div className="space-y-3 rounded-lg bg-panel2 p-3 text-sm">
                      <Note label="Reason for entry" text={t.notes} />
                      <Note label="Lesson learned" text={t.postNotes} />
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dim">Exit</div>
                        <p className="text-ink">{t.exitReason}</p>
                        <p className="mt-0.5 text-xs text-dim">Opened {formatDateTime(t.openedAt)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : t.id)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-line text-sm font-medium text-ink transition-colors hover:bg-panel2"
                    >
                      {open ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                      {open ? 'Hide notes' : 'Show notes'}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${t.asset} trade`}
                      onClick={() => setDeleting(t)}
                      className="inline-flex size-11 items-center justify-center rounded-md border border-line text-dim transition-colors hover:bg-down/15 hover:text-down"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
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
          </>
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
