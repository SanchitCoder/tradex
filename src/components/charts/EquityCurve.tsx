import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../context/JournalContext'
import type { EquityPoint } from '../../types'
import { buildEquityCurve } from '../../utils/calculations'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateTime,
  formatShortDate,
  formatSignedCurrency,
} from '../../utils/formatters'
import { Card, EmptyState } from '../ui/Card'
import { AXIS_TICK, CHART, LegendDot, TooltipBox } from './chartTheme'

interface TooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload: EquityPoint }>
}

function EquityTooltip({ active, payload }: TooltipProps) {
  const p = active ? payload?.[0]?.payload : undefined
  if (!p) return null
  return (
    <TooltipBox title={p.label === 'Start' ? 'Starting capital' : `${p.label} closed`}>
      <div className="text-dim">{formatDateTime(new Date(p.t).toISOString())}</div>
      <div className="mt-1 font-mono tabular-nums text-ink">Equity {formatCurrency(p.equity)}</div>
      {p.label !== 'Start' && (
        <div className="font-mono tabular-nums text-ink">Trade {formatSignedCurrency(p.pnl)}</div>
      )}
    </TooltipBox>
  )
}

export function EquityCurve() {
  const { closedTrades, account } = useJournal()
  const data = useMemo(
    () => buildEquityCurve(closedTrades, account.startingCapital),
    [closedTrades, account.startingCapital],
  )

  const last = data[data.length - 1]
  const lineColor = last && last.equity < account.startingCapital ? CHART.down : CHART.up

  const domain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 1]
    const values = data.map((d) => d.equity)
    const lo = Math.min(...values)
    const hi = Math.max(...values)
    const pad = Math.max((hi - lo) * 0.15, account.startingCapital * 0.002)
    return [Math.floor(lo - pad), Math.ceil(hi + pad)]
  }, [data, account.startingCapital])

  return (
    <Card
      title="Equity Curve"
      action={
        <div className="flex gap-4">
          <LegendDot color={lineColor} label="Equity" />
          <LegendDot color={CHART.neutral} label="Starting capital" />
        </div>
      }
    >
      {data.length === 0 ? (
        <EmptyState message="Close a trade to start your equity curve." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatShortDate}
              tick={AXIS_TICK}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tickFormatter={formatCompactCurrency}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <ReferenceLine y={account.startingCapital} stroke={CHART.neutral} strokeDasharray="4 4" />
            <Tooltip content={<EquityTooltip />} cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#equityFill)"
              dot={{ r: 3.5, fill: lineColor, stroke: '#131722', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: lineColor, stroke: '#131722', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
