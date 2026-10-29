import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useJournal } from '../../context/JournalContext'
import { formatPercent } from '../../utils/formatters'
import { Card, EmptyState } from '../ui/Card'
import { CHART, LegendDot, TooltipBox } from './chartTheme'

interface Slice {
  name: string
  value: number
  color: string
}

interface TooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload: Slice }>
}

function SliceTooltip({ active, payload, total }: TooltipProps & { total: number }) {
  const s = active ? payload?.[0]?.payload : undefined
  if (!s) return null
  return (
    <TooltipBox title={s.name}>
      <div className="font-mono tabular-nums text-ink">
        {s.value} trade{s.value === 1 ? '' : 's'} · {formatPercent((s.value / total) * 100, 1)}
      </div>
    </TooltipBox>
  )
}

export function WinLossDonut() {
  const { stats } = useJournal()
  const slices: Slice[] = [
    { name: 'Wins', value: stats.wins, color: CHART.up },
    { name: 'Losses', value: stats.losses, color: CHART.down },
    { name: 'Breakeven', value: stats.breakevens, color: CHART.neutral },
  ].filter((s) => s.value > 0)

  return (
    <Card title="Win / Loss">
      {stats.total === 0 ? (
        <EmptyState message="No closed trades yet." />
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  stroke="#131722"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip total={stats.total} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold tabular-nums text-ink">
                {formatPercent(stats.winRate, 0)}
              </span>
              <span className="text-xs text-dim">win rate</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
            {slices.map((s) => (
              <LegendDot key={s.name} color={s.color} label={s.name} value={String(s.value)} />
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
