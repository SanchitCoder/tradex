import { Landmark, ShieldAlert, TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
  pnlColor,
} from '../utils/formatters'

interface KpiProps {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  valueClass?: string
  iconClass?: string
}

function Kpi({ label, value, sub, icon: Icon, valueClass = 'text-ink', iconClass = 'text-dim' }: KpiProps) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 transition-colors hover:border-dim/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-dim">{label}</span>
        <Icon size={16} className={iconClass} aria-hidden />
      </div>
      <div className={`mt-2 truncate font-mono text-xl font-semibold tabular-nums sm:text-2xl ${valueClass}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-xs tabular-nums text-dim sm:truncate">{sub}</div>
    </div>
  )
}

export function KPICards() {
  const { summary, account } = useJournal()
  const pnlTone = pnlColor(summary.realizedPnl)
  const riskPctOfEquity = summary.equity > 0 ? (summary.openRisk / summary.equity) * 100 : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        label="Current Equity"
        value={formatCurrency(summary.equity)}
        sub={`Started at ${formatCurrency(account.startingCapital)}`}
        icon={Wallet}
      />
      <Kpi
        label="Net P&L"
        value={formatSignedCurrency(summary.realizedPnl)}
        sub={formatSignedPercent(summary.netPnlPct)}
        icon={summary.realizedPnl < 0 ? TrendingDown : TrendingUp}
        valueClass={pnlTone}
        iconClass={pnlTone}
      />
      <Kpi
        label="Open Risk"
        value={formatCurrency(summary.openRisk)}
        sub={`${formatPercent(riskPctOfEquity)} of equity · ${summary.openCount} open`}
        icon={ShieldAlert}
        valueClass={summary.openRisk > 0 ? 'text-warn' : 'text-ink'}
        iconClass={summary.openRisk > 0 ? 'text-warn' : 'text-dim'}
      />
      <Kpi
        label="Available Capital"
        value={formatCurrency(summary.availableCapital)}
        sub="Equity minus open risk"
        icon={Landmark}
      />
    </div>
  )
}
