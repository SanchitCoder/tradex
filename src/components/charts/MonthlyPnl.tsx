import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../context/JournalContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { monthlyPnl, type MonthPnl } from '../../utils/calculations'
import { formatCompactCurrency, formatMonthKey, formatSignedCurrency } from '../../utils/formatters'
import { Card, EmptyState } from '../ui/Card'
import { AXIS_TICK, CHART, LegendDot, TooltipBox } from './chartTheme'

interface TooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload: MonthPnl }>
}

function MonthTooltip({ active, payload }: TooltipProps) {
  const row = active ? payload?.[0]?.payload : undefined
  if (!row) return null
  return (
    <TooltipBox title={formatMonthKey(row.month)}>
      <div className="font-mono tabular-nums text-ink">{formatSignedCurrency(row.pnl)}</div>
      <div className="text-dim">
        {row.trades} trade{row.trades === 1 ? '' : 's'}
      </div>
    </TooltipBox>
  )
}

export function MonthlyPnl() {
  const narrow = useMediaQuery('(max-width: 639px)')
  const { closedTrades } = useJournal()
  const data = useMemo(() => monthlyPnl(closedTrades), [closedTrades])

  return (
    <Card
      title="Monthly P&L"
      action={
        <div className="flex gap-4">
          <LegendDot color={CHART.up} label="Gain" />
          <LegendDot color={CHART.down} label="Loss" />
        </div>
      }
    >
      {data.length === 0 ? (
        <EmptyState message="No closed trades yet." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="35%">
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthKey}
              tick={AXIS_TICK}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={narrow ? 48 : 56}
            />
            <ReferenceLine y={0} stroke={CHART.axis} />
            <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="pnl" maxBarSize={36} radius={3} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.month} fill={d.pnl >= 0 ? CHART.up : CHART.down} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
