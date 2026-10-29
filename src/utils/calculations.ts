import type {
  Account,
  AccountSummary,
  ClosedTrade,
  Direction,
  EquityPoint,
  ExitReason,
  GroupRow,
  OpenTrade,
  Outcome,
  Stats,
  Streak,
  Trade,
  TradeBase,
} from '../types'

/** A trade within this fraction of 1R of flat is classified as breakeven. */
export const BREAKEVEN_TOLERANCE_R = 0.05

// ---------------------------------------------------------------- parsing

/** Empty / non-numeric strings become NaN so callers can test with Number.isFinite. */
export function toNumber(value: string): number {
  const s = value.trim()
  return s === '' ? NaN : Number(s)
}

const isPositive = (n: number): boolean => Number.isFinite(n) && n > 0

// ------------------------------------------------------------- validation

export type LevelErrors = Partial<Record<'entry' | 'target' | 'stopLoss', string>>

/**
 * BUY: stop < entry < target. SELL: target < entry < stop.
 * Directional checks only run once the relevant prices are valid numbers.
 */
export function validateLevels(
  direction: Direction,
  entry: number,
  target: number,
  stopLoss: number,
): LevelErrors {
  const errors: LevelErrors = {}
  if (!isPositive(entry)) errors.entry = 'Enter an entry price above 0'
  if (!isPositive(target)) errors.target = 'Enter a target price above 0'
  if (!isPositive(stopLoss)) errors.stopLoss = 'Enter a stop loss above 0'

  if (isPositive(entry)) {
    if (isPositive(stopLoss)) {
      if (direction === 'BUY' && stopLoss >= entry) {
        errors.stopLoss = 'For a BUY, stop loss must be below entry'
      } else if (direction === 'SELL' && stopLoss <= entry) {
        errors.stopLoss = 'For a SELL, stop loss must be above entry'
      }
    }
    if (isPositive(target)) {
      if (direction === 'BUY' && target <= entry) {
        errors.target = 'For a BUY, target must be above entry'
      } else if (direction === 'SELL' && target >= entry) {
        errors.target = 'For a SELL, target must be below entry'
      }
    }
  }
  return errors
}

// ------------------------------------------------------------ trade math

type Sized = Pick<TradeBase, 'entry' | 'stopLoss' | 'quantity'>

export function tradeRisk(t: Sized): number {
  return Math.abs(t.entry - t.stopLoss) * t.quantity
}

export function tradeReward(t: Pick<TradeBase, 'entry' | 'target' | 'quantity'>): number {
  return Math.abs(t.target - t.entry) * t.quantity
}

/** Planned reward / risk, e.g. 2.5 for a 1:2.5 setup. */
export function plannedRR(t: Pick<TradeBase, 'entry' | 'target' | 'stopLoss' | 'quantity'>): number {
  const risk = tradeRisk(t)
  return risk > 0 ? tradeReward(t) / risk : 0
}

/** Units to trade so that hitting the stop loses riskPct% of equity. Floored to 6 dp. */
export function quantityFromRisk(
  equity: number,
  riskPct: number,
  entry: number,
  stopLoss: number,
): number {
  const perUnit = Math.abs(entry - stopLoss)
  if (!isPositive(equity) || !isPositive(riskPct) || !(perUnit > 0)) return NaN
  const qty = (equity * (riskPct / 100)) / perUnit
  return Math.floor(qty * 1e6) / 1e6
}

export interface TradePlan {
  risk: number
  reward: number
  rr: number
  /** Risk as % of current equity. */
  riskPct: number
  notional: number
}

/** Pre-trade preview. Returns null until the inputs form a valid trade. */
export function calcPlan(
  input: { direction: Direction; entry: number; target: number; stopLoss: number; quantity: number },
  equity: number,
): TradePlan | null {
  const { direction, entry, target, stopLoss, quantity } = input
  if (Object.keys(validateLevels(direction, entry, target, stopLoss)).length > 0) return null
  if (!isPositive(quantity)) return null
  const risk = tradeRisk({ entry, stopLoss, quantity })
  const reward = tradeReward({ entry, target, quantity })
  return {
    risk,
    reward,
    rr: risk > 0 ? reward / risk : 0,
    riskPct: equity > 0 ? (risk / equity) * 100 : NaN,
    notional: entry * quantity,
  }
}

export function calcPnl(direction: Direction, entry: number, exit: number, quantity: number): number {
  const sign = direction === 'BUY' ? 1 : -1
  return (exit - entry) * sign * quantity
}

export interface Realized {
  pnl: number
  pnlPct: number
  rMultiple: number
}

export function calcRealized(
  trade: Pick<TradeBase, 'direction' | 'entry' | 'stopLoss' | 'quantity'>,
  exitPrice: number,
): Realized {
  const pnl = calcPnl(trade.direction, trade.entry, exitPrice, trade.quantity)
  const notional = trade.entry * trade.quantity
  const risk = tradeRisk(trade)
  return {
    pnl,
    pnlPct: notional > 0 ? (pnl / notional) * 100 : 0,
    rMultiple: risk > 0 ? pnl / risk : 0,
  }
}

export function suggestOutcome(pnl: number, risk: number): Outcome {
  if (Math.abs(pnl) <= risk * BREAKEVEN_TOLERANCE_R) return 'Breakeven'
  return pnl > 0 ? 'Profit' : 'Loss'
}

export function suggestExitReason(
  trade: Pick<TradeBase, 'target' | 'stopLoss'>,
  exitPrice: number,
): ExitReason {
  if (exitPrice === trade.target) return 'Target Hit'
  if (exitPrice === trade.stopLoss) return 'Stop Loss Hit'
  return 'Manual Exit'
}

export interface ExitInput {
  exitPrice: number
  closedAt: string
  outcome: Outcome
  exitReason: ExitReason
  postNotes: string
}

export function closeTrade(trade: OpenTrade, exit: ExitInput): ClosedTrade {
  const realized = calcRealized(trade, exit.exitPrice)
  return {
    ...trade,
    status: 'closed',
    exitPrice: exit.exitPrice,
    closedAt: exit.closedAt,
    outcome: exit.outcome,
    exitReason: exit.exitReason,
    postNotes: exit.postNotes,
    ...realized,
  }
}

// --------------------------------------------------------------- selectors

export const isClosed = (t: Trade): t is ClosedTrade => t.status === 'closed'
export const isOpen = (t: Trade): t is OpenTrade => t.status === 'open'

const time = (iso: string): number => new Date(iso).getTime()

/** Closed trades ordered by close time, oldest first. */
export function sortedClosed(trades: Trade[]): ClosedTrade[] {
  return trades.filter(isClosed).sort((a, b) => time(a.closedAt) - time(b.closedAt))
}

export function holdingMs(t: ClosedTrade): number {
  return time(t.closedAt) - time(t.openedAt)
}

export function getAccountSummary(account: Account, trades: Trade[]): AccountSummary {
  let realizedPnl = 0
  let openRisk = 0
  let openCount = 0
  for (const t of trades) {
    if (t.status === 'closed') {
      realizedPnl += t.pnl
    } else {
      openRisk += tradeRisk(t)
      openCount += 1
    }
  }
  const equity = account.startingCapital + realizedPnl
  return {
    equity,
    realizedPnl,
    netPnlPct: account.startingCapital > 0 ? (realizedPnl / account.startingCapital) * 100 : 0,
    openRisk,
    // No margin model: capital not currently at risk.
    availableCapital: equity - openRisk,
    openCount,
  }
}

// ------------------------------------------------------------------ stats

export const EMPTY_STREAK: Streak = { type: 'none', count: 0 }

export function computeStats(closedAsc: ClosedTrade[], startingCapital: number): Stats {
  const total = closedAsc.length
  const wins = closedAsc.filter((t) => t.outcome === 'Profit')
  const losses = closedAsc.filter((t) => t.outcome === 'Loss')
  const breakevens = total - wins.length - losses.length

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const netPnl = closedAsc.reduce((s, t) => s + t.pnl, 0)

  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? -grossLoss / losses.length : 0
  const avgWinR = wins.length ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0
  const avgLossR = losses.length ? losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length : 0

  // Payoff ratio in R. With no losing trades, 1R is the natural unit of loss.
  const avgRealizedRR = avgLossR < 0 ? avgWinR / Math.abs(avgLossR) : avgWinR

  let equity = startingCapital
  let peak = startingCapital
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let current: Streak = EMPTY_STREAK
  let longestWinStreak = 0
  let longestLossStreak = 0

  for (const t of closedAsc) {
    equity += t.pnl
    peak = Math.max(peak, equity)
    const dd = peak - equity
    maxDrawdown = Math.max(maxDrawdown, dd)
    if (peak > 0) maxDrawdownPct = Math.max(maxDrawdownPct, (dd / peak) * 100)

    if (t.outcome === 'Breakeven') {
      current = EMPTY_STREAK
      continue
    }
    const type = t.outcome === 'Profit' ? 'win' : 'loss'
    current = current.type === type ? { type, count: current.count + 1 } : { type, count: 1 }
    if (type === 'win') longestWinStreak = Math.max(longestWinStreak, current.count)
    else longestLossStreak = Math.max(longestLossStreak, current.count)
  }

  return {
    total,
    wins: wins.length,
    losses: losses.length,
    breakevens,
    winRate: total ? (wins.length / total) * 100 : 0,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    avgWin,
    avgLoss,
    largestWin: wins.length ? Math.max(...wins.map((t) => t.pnl)) : 0,
    largestLoss: losses.length ? Math.min(...losses.map((t) => t.pnl)) : 0,
    avgPlannedRR: total ? closedAsc.reduce((s, t) => s + plannedRR(t), 0) / total : 0,
    avgRealizedRR,
    expectancy: total ? netPnl / total : 0,
    expectancyR: total ? closedAsc.reduce((s, t) => s + t.rMultiple, 0) / total : 0,
    netPnl,
    returnPct: startingCapital > 0 ? (netPnl / startingCapital) * 100 : 0,
    maxDrawdown,
    maxDrawdownPct,
    currentStreak: current,
    longestWinStreak,
    longestLossStreak,
    avgHoldMs: total ? closedAsc.reduce((s, t) => s + holdingMs(t), 0) / total : 0,
  }
}

// ----------------------------------------------------------------- series

/** Equity after each close, starting from the account's starting capital. */
export function buildEquityCurve(closedAsc: ClosedTrade[], startingCapital: number): EquityPoint[] {
  if (closedAsc.length === 0) return []
  const firstClose = time(closedAsc[0].closedAt)
  const earliestOpen = Math.min(...closedAsc.map((t) => time(t.openedAt)))
  const points: EquityPoint[] = [
    { t: Math.min(earliestOpen, firstClose), equity: startingCapital, pnl: 0, label: 'Start' },
  ]
  let equity = startingCapital
  for (const t of closedAsc) {
    equity += t.pnl
    points.push({ t: time(t.closedAt), equity, pnl: t.pnl, label: t.asset })
  }
  return points
}

export interface AssetPnl {
  asset: string
  pnl: number
  trades: number
}

export function pnlByAsset(closed: ClosedTrade[]): AssetPnl[] {
  const map = new Map<string, AssetPnl>()
  for (const t of closed) {
    const row = map.get(t.asset) ?? { asset: t.asset, pnl: 0, trades: 0 }
    row.pnl += t.pnl
    row.trades += 1
    map.set(t.asset, row)
  }
  return [...map.values()].sort((a, b) => b.pnl - a.pnl)
}

export interface MonthPnl {
  /** "YYYY-MM" in local time. */
  month: string
  pnl: number
  trades: number
}

export function monthlyPnl(closed: ClosedTrade[]): MonthPnl[] {
  const map = new Map<string, MonthPnl>()
  for (const t of closed) {
    const d = new Date(t.closedAt)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const row = map.get(month) ?? { month, pnl: 0, trades: 0 }
    row.pnl += t.pnl
    row.trades += 1
    map.set(month, row)
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function groupStats(closed: ClosedTrade[], keyOf: (t: ClosedTrade) => string): GroupRow[] {
  const groups = new Map<string, ClosedTrade[]>()
  for (const t of closed) {
    const key = keyOf(t) || 'Untagged'
    const list = groups.get(key)
    if (list) list.push(t)
    else groups.set(key, [t])
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const wins = list.filter((t) => t.outcome === 'Profit')
      const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
      const grossLoss = Math.abs(list.filter((t) => t.outcome === 'Loss').reduce((s, t) => s + t.pnl, 0))
      return {
        key,
        trades: list.length,
        wins: wins.length,
        winRate: (wins.length / list.length) * 100,
        netPnl: list.reduce((s, t) => s + t.pnl, 0),
        avgR: list.reduce((s, t) => s + t.rMultiple, 0) / list.length,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      }
    })
    .sort((a, b) => b.netPnl - a.netPnl)
}
