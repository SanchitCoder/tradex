import { useMemo } from 'react'
import { useJournal } from '../context/JournalContext'
import type { GroupRow } from '../types'
import { groupStats } from '../utils/calculations'
import {
  formatPercent,
  formatProfitFactor,
  formatR,
  formatSignedCurrency,
  pnlColor,
} from '../utils/formatters'
import { Card, EmptyState } from './ui/Card'

const th = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-dim'

function BreakdownTable({ title, rows }: { title: string; rows: GroupRow[] }) {
  return (
    <Card title={title} flush>
      {rows.length === 0 ? (
        <EmptyState message="No closed trades yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={`${th} text-left`}>Group</th>
                <th className={`${th} text-right`}>Trades</th>
                <th className={`${th} text-right`}>Win %</th>
                <th className={`${th} text-right`}>PF</th>
                <th className={`${th} text-right`}>Avg R</th>
                <th className={`${th} text-right`}>Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.key} className="transition-colors hover:bg-panel2">
                  <td className="px-3 py-2 font-medium text-ink">{r.key}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{r.trades}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatPercent(r.winRate, 0)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatProfitFactor(r.profitFactor)}</td>
                  <td className={`px-3 py-2 text-right font-mono tabular-nums ${pnlColor(r.avgR)}`}>{formatR(r.avgR)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${pnlColor(r.netPnl)}`}>
                    {formatSignedCurrency(r.netPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function Breakdowns() {
  const { closedTrades } = useJournal()
  const groups = useMemo(
    () => ({
      category: groupStats(closedTrades, (t) => (t.category === 'Crypto' ? 'Crypto' : 'Commodities')),
      direction: groupStats(closedTrades, (t) => (t.direction === 'BUY' ? 'Long' : 'Short')),
      strategy: groupStats(closedTrades, (t) => t.strategy),
      asset: groupStats(closedTrades, (t) => t.asset),
    }),
    [closedTrades],
  )

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <BreakdownTable title="Crypto vs Commodities" rows={groups.category} />
      <BreakdownTable title="Long vs Short" rows={groups.direction} />
      <BreakdownTable title="By Strategy" rows={groups.strategy} />
      <BreakdownTable title="By Asset" rows={groups.asset} />
    </div>
  )
}
