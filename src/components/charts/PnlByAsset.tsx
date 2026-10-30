import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../context/JournalContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { pnlByAsset, type AssetPnl } from '../../utils/calculations'
import { formatCompactCurrency, formatSignedCurrency } from '../../utils/formatters'
import { Card, EmptyState } from '../ui/Card'
import { AXIS_TICK, CHART, LegendDot, TooltipBox } from './chartTheme'

interface TooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload: AssetPnl }>
}

function AssetTooltip({ active, payload }: TooltipProps) {
  const row = active ? payload?.[0]?.payload : undefined
  if (!row) return null
  return (
    <TooltipBox title={row.asset}>
      <div className="font-mono tabular-nums text-ink">{formatSignedCurrency(row.pnl)}</div>
      <div className="text-dim">
        {row.trades} trade{row.trades === 1 ? '' : 's'}
      </div>
    </TooltipBox>
  )
}

/** "Gold (XAU/USD)" -> "XAU/USD" so labels fit a phone-width axis. */
function shortAsset(name: string): string {
  return /\(([^)]+)\)/.exec(name)?.[1] ?? name
}

export function PnlByAsset() {
  const { closedTrades } = useJournal()
  const narrow = useMediaQuery('(max-width: 639px)')
  const data = useMemo(() => pnlByAsset(closedTrades), [closedTrades])

  return (
    <Card
      title="P&L by Asset"
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
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38 + 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: narrow ? 8 : 16, bottom: 0, left: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatCompactCurrency}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="asset"
              width={narrow ? 64 : 118}
              tickFormatter={narrow ? shortAsset : undefined}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke={CHART.axis} />
            <Tooltip content={<AssetTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="pnl" maxBarSize={18} radius={3} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.asset} fill={d.pnl >= 0 ? CHART.up : CHART.down} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
