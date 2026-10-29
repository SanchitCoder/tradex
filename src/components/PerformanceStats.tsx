import type { ReactNode } from 'react'
import { useJournal } from '../context/JournalContext'
import type { Stats } from '../types'
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatProfitFactor,
  formatR,
  formatSignedCurrency,
  formatSignedPercent,
  pnlColor,
} from '../utils/formatters'
import { Card } from './ui/Card'

interface StatProps {
  label: string
  value: string
  sub?: string
  tone?: string
}

function Stat({ label, value, sub, tone = 'text-ink' }: StatProps) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-2.5 transition-colors hover:border-dim/40">
      <div className="truncate text-[11px] font-medium uppercase tracking-wider text-dim">{label}</div>
      <div className={`mt-1 truncate font-mono text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="truncate font-mono text-xs tabular-nums text-dim">{sub}</div>}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dim">{title}</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </div>
  )
}

function streakLabel(s: Stats['currentStreak']): { value: string; tone: string } {
  if (s.type === 'none') return { value: '—', tone: 'text-dim' }
  return s.type === 'win'
    ? { value: `${s.count}W`, tone: 'text-up' }
    : { value: `${s.count}L`, tone: 'text-down' }
}

export function PerformanceStats() {
  const { stats: s } = useJournal()
  const has = s.total > 0
  const dash = (text: string) => (has ? text : '—')
  const streak = streakLabel(s.currentStreak)

  return (
    <Card title="Performance">
      <div className="space-y-5">
        <Group title="Trades">
          <Stat label="Total trades" value={String(s.total)} />
          <Stat label="Wins" value={String(s.wins)} tone={s.wins > 0 ? 'text-up' : 'text-ink'} />
          <Stat label="Losses" value={String(s.losses)} tone={s.losses > 0 ? 'text-down' : 'text-ink'} />
          <Stat label="Breakevens" value={String(s.breakevens)} />
          <Stat label="Win rate" value={dash(formatPercent(s.winRate, 1))} />
        </Group>

        <Group title="Profit & loss">
          <Stat
            label="Profit factor"
            value={formatProfitFactor(s.profitFactor, has)}
            sub={has ? `${formatCurrency(s.grossProfit)} / ${formatCurrency(s.grossLoss)}` : undefined}
          />
          <Stat label="Average win" value={dash(formatSignedCurrency(s.avgWin))} tone={has ? 'text-up' : 'text-dim'} />
          <Stat label="Average loss" value={dash(formatSignedCurrency(s.avgLoss))} tone={has ? 'text-down' : 'text-dim'} />
          <Stat label="Largest win" value={dash(formatSignedCurrency(s.largestWin))} tone={has ? 'text-up' : 'text-dim'} />
          <Stat label="Largest loss" value={dash(formatSignedCurrency(s.largestLoss))} tone={has ? 'text-down' : 'text-dim'} />
        </Group>

        <Group title="Edge">
          <Stat label="Avg planned R:R" value={dash(`1:${formatNumber(s.avgPlannedRR)}`)} />
          <Stat
            label="Avg realized R:R"
            value={dash(`1:${formatNumber(s.avgRealizedRR)}`)}
            sub={has ? (s.avgRealizedRR >= s.avgPlannedRR ? 'At or above plan' : 'Below plan') : undefined}
          />
          <Stat
            label="Expectancy / trade"
            value={dash(formatSignedCurrency(s.expectancy))}
            tone={has ? pnlColor(s.expectancy) : 'text-dim'}
          />
          <Stat
            label="Expectancy (R)"
            value={dash(formatR(s.expectancyR))}
            tone={has ? pnlColor(s.expectancyR) : 'text-dim'}
          />
          <Stat
            label="Return on capital"
            value={dash(formatSignedPercent(s.returnPct))}
            tone={has ? pnlColor(s.returnPct) : 'text-dim'}
          />
        </Group>

        <Group title="Risk & consistency">
          <Stat
            label="Max drawdown"
            value={dash(formatCurrency(s.maxDrawdown))}
            sub={has ? formatPercent(s.maxDrawdownPct) : undefined}
            tone={has && s.maxDrawdown > 0 ? 'text-down' : 'text-ink'}
          />
          <Stat label="Current streak" value={streak.value} tone={streak.tone} />
          <Stat label="Longest win streak" value={dash(String(s.longestWinStreak))} />
          <Stat label="Longest loss streak" value={dash(String(s.longestLossStreak))} />
          <Stat label="Avg holding time" value={dash(formatDuration(s.avgHoldMs))} />
        </Group>
      </div>
    </Card>
  )
}
