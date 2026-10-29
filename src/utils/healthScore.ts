import type { ClosedTrade, Grade, HealthComponent, HealthScoreResult, Stats } from '../types'
import { formatNumber, formatPercent } from './formatters'

export const MIN_TRADES_FOR_SCORE = 5

/** Positive weights sum to 100; drawdown is a separate penalty. */
const WEIGHTS = { winRate: 20, profitFactor: 25, realizedRR: 25, discipline: 30 } as const

/** Value at which each metric earns its full sub-score. */
const TARGETS = { winRate: 60, profitFactor: 2, realizedRR: 2 } as const

const MAX_DRAWDOWN_PENALTY = 25
const PENALTY_PER_DRAWDOWN_PCT = 2
const DISCIPLINED_THRESHOLD = 70

const clamp = (n: number, min = 0, max = 100): number => Math.min(max, Math.max(min, n))

export function gradeFor(score: number): Grade {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export interface Discipline {
  /** % of trades closed at the planned target or stop loss. */
  planAdherencePct: number
  /** % of notes filled in (entry notes and post-trade notes, half each). */
  notesPct: number
  score: number
}

export function disciplineMetrics(closed: ClosedTrade[]): Discipline {
  if (closed.length === 0) return { planAdherencePct: 0, notesPct: 0, score: 0 }
  const planned = closed.filter((t) => t.exitReason !== 'Manual Exit').length
  const notes = closed.reduce(
    (s, t) => s + (t.notes.trim() ? 0.5 : 0) + (t.postNotes.trim() ? 0.5 : 0),
    0,
  )
  const planAdherencePct = (planned / closed.length) * 100
  const notesPct = (notes / closed.length) * 100
  return { planAdherencePct, notesPct, score: (planAdherencePct + notesPct) / 2 }
}

function verdictFor(profitable: boolean, disciplined: boolean): string {
  if (profitable && disciplined) return 'Profitable & disciplined'
  if (profitable) return 'Profitable, but discipline is slipping'
  if (disciplined) return 'Disciplined, but the edge is unproven'
  return 'Unprofitable & undisciplined: review your process'
}

export function computeHealthScore(closed: ClosedTrade[], stats: Stats): HealthScoreResult {
  const base = {
    closedCount: closed.length,
    minTrades: MIN_TRADES_FOR_SCORE,
  }
  if (closed.length < MIN_TRADES_FOR_SCORE) {
    return {
      ...base,
      ready: false,
      score: 0,
      grade: 'F',
      verdict: 'Not enough data',
      components: [],
      drawdownPenalty: 0,
      drawdownDetail: '',
      biggestDrag: null,
    }
  }

  const discipline = disciplineMetrics(closed)
  const pf = stats.profitFactor === Infinity ? TARGETS.profitFactor : stats.profitFactor

  const raw: Array<Omit<HealthComponent, 'points'>> = [
    {
      key: 'winRate',
      label: 'Win Rate',
      weight: WEIGHTS.winRate,
      score: clamp((stats.winRate / TARGETS.winRate) * 100),
      detail: `${formatPercent(stats.winRate, 1)} (full marks at ${TARGETS.winRate}%)`,
    },
    {
      key: 'profitFactor',
      label: 'Profit Factor',
      weight: WEIGHTS.profitFactor,
      score: clamp((pf / TARGETS.profitFactor) * 100),
      detail: `${stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor)} (full marks at ${TARGETS.profitFactor.toFixed(1)})`,
    },
    {
      key: 'realizedRR',
      label: 'Realized R:R',
      weight: WEIGHTS.realizedRR,
      score: clamp((stats.avgRealizedRR / TARGETS.realizedRR) * 100),
      detail: `1:${formatNumber(stats.avgRealizedRR)} (full marks at 1:${TARGETS.realizedRR.toFixed(1)})`,
    },
    {
      key: 'discipline',
      label: 'Discipline',
      weight: WEIGHTS.discipline,
      score: clamp(discipline.score),
      detail: `${formatPercent(discipline.planAdherencePct, 0)} closed at target/SL · ${formatPercent(discipline.notesPct, 0)} notes filled`,
    },
  ]
  const components: HealthComponent[] = raw.map((c) => ({ ...c, points: (c.score * c.weight) / 100 }))

  const drawdownPenalty = Math.min(MAX_DRAWDOWN_PENALTY, stats.maxDrawdownPct * PENALTY_PER_DRAWDOWN_PCT)
  const score = clamp(components.reduce((s, c) => s + c.points, 0) - drawdownPenalty)

  const drags = [
    ...components.map((c) => ({ label: c.label, lost: c.weight - c.points })),
    { label: 'Max Drawdown', lost: drawdownPenalty },
  ].sort((a, b) => b.lost - a.lost)
  const top = drags[0]

  return {
    ...base,
    ready: true,
    score,
    grade: gradeFor(score),
    verdict: verdictFor(stats.netPnl > 0, discipline.score >= DISCIPLINED_THRESHOLD),
    components,
    drawdownPenalty,
    drawdownDetail: `${formatPercent(stats.maxDrawdownPct, 2)} max drawdown (−${PENALTY_PER_DRAWDOWN_PCT} pts per 1%, capped at −${MAX_DRAWDOWN_PENALTY})`,
    biggestDrag: top && top.lost >= 0.5 ? top : null,
  }
}
