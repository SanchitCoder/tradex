import { Activity, AlertTriangle } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import type { Grade } from '../types'
import { formatNumber } from '../utils/formatters'
import { Card } from './ui/Card'

const GRADE_COLOR: Record<Grade, string> = {
  A: '#2ebd85',
  B: '#7fc25a',
  C: '#f5a623',
  D: '#f27a3d',
  F: '#f6465d',
}

const SIZE = 220
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS
/** Gauge sweeps 270 degrees, opening at the bottom. */
const ARC = CIRC * 0.75

function Gauge({ score, grade, ready }: { score: number; grade: Grade; ready: boolean }) {
  const color = ready ? GRADE_COLOR[grade] : '#3a4052'
  const filled = ready ? ARC * (score / 100) : 0
  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={ready ? `Journal health score ${Math.round(score)} out of 100, grade ${grade}` : 'Health score unavailable'}
      >
        <g transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`} fill="none" strokeLinecap="round" strokeWidth={STROKE}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#262b3a"
            strokeDasharray={`${ARC} ${CIRC}`}
          />
          {filled > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={color}
              strokeDasharray={`${filled} ${CIRC}`}
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.3s' }}
            />
          )}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {ready ? (
          <>
            <span className="font-mono text-5xl font-bold tabular-nums text-ink">{Math.round(score)}</span>
            <span className="text-xs text-dim">out of 100</span>
            <span
              className="mt-2 rounded-md px-3 py-0.5 text-lg font-bold"
              style={{ color, backgroundColor: `${color}22` }}
            >
              Grade {grade}
            </span>
          </>
        ) : (
          <>
            <Activity size={28} className="text-dim" aria-hidden />
            <span className="mt-2 text-sm font-semibold text-ink">Not enough data</span>
          </>
        )}
      </div>
    </div>
  )
}

function barColor(ratio: number): string {
  if (ratio >= 0.7) return 'bg-up'
  if (ratio >= 0.4) return 'bg-warn'
  return 'bg-down'
}

export function HealthScore() {
  const { health } = useJournal()

  return (
    <Card title="Journal Health Score" subtitle="Overall read on your trading and journaling">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
        <div>
          <Gauge score={health.score} grade={health.grade} ready={health.ready} />
          <p className="mt-3 text-center text-sm font-medium text-ink">
            {health.ready
              ? health.verdict
              : `Close ${health.minTrades - health.closedCount} more trade${health.minTrades - health.closedCount === 1 ? '' : 's'} to unlock (${health.closedCount}/${health.minTrades})`}
          </p>
        </div>

        {health.ready ? (
          <div className="space-y-3.5">
            {health.components.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">{c.label}</span>
                  <span className="font-mono text-xs tabular-nums text-dim">
                    {formatNumber(c.points, 1)} / {c.weight}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor(c.score / 100)}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-dim">{c.detail}</p>
              </div>
            ))}

            <div>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink">Drawdown penalty</span>
                <span
                  className={`font-mono text-xs tabular-nums ${health.drawdownPenalty > 0 ? 'text-down' : 'text-dim'}`}
                >
                  −{formatNumber(health.drawdownPenalty, 1)} pts
                </span>
              </div>
              <p className="mt-1 text-xs text-dim">{health.drawdownDetail}</p>
            </div>

            {health.biggestDrag && (
              <p className="flex items-start gap-2 rounded-md border border-line bg-bg px-3 py-2 text-xs text-dim">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" aria-hidden />
                <span>
                  Biggest drag on your score:{' '}
                  <span className="font-semibold text-ink">{health.biggestDrag.label}</span> (−
                  {formatNumber(health.biggestDrag.lost, 1)} pts).
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-dim">
            The score blends win rate, profit factor, realized R:R and discipline (closing at your planned
            target or stop, and filling in notes), minus a penalty for drawdown. It needs at least{' '}
            {health.minTrades} closed trades to be meaningful.
          </p>
        )}
      </div>
    </Card>
  )
}
