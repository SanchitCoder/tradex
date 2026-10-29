export type Category = 'Crypto' | 'Commodity'
export type Direction = 'BUY' | 'SELL'
export type Outcome = 'Profit' | 'Loss' | 'Breakeven'
export type ExitReason = 'Target Hit' | 'Stop Loss Hit' | 'Manual Exit'

export interface TradeBase {
  id: string
  /** ISO timestamp the trade was opened. */
  openedAt: string
  asset: string
  category: Category
  direction: Direction
  entry: number
  target: number
  stopLoss: number
  quantity: number
  strategy: string
  /** Reason for entry. */
  notes: string
  /** True for the demo trades loaded on first run. */
  isSample?: boolean
}

export interface OpenTrade extends TradeBase {
  status: 'open'
}

export interface ClosedTrade extends TradeBase {
  status: 'closed'
  exitPrice: number
  /** ISO timestamp the trade was closed. */
  closedAt: string
  outcome: Outcome
  exitReason: ExitReason
  /** Post-trade notes / lesson learned. */
  postNotes: string
  /** Realized P&L in account currency. */
  pnl: number
  /** Realized P&L as % of the position's entry notional (entry x qty). */
  pnlPct: number
  /** Realized P&L divided by initial risk. */
  rMultiple: number
}

export type Trade = OpenTrade | ClosedTrade

export interface Account {
  startingCapital: number
  currency: 'USD'
}

export interface JournalState {
  account: Account
  trades: Trade[]
}

export interface AccountSummary {
  equity: number
  realizedPnl: number
  /** Net P&L as % of starting capital. */
  netPnlPct: number
  openRisk: number
  availableCapital: number
  openCount: number
}

export interface Streak {
  type: 'win' | 'loss' | 'none'
  count: number
}

export interface Stats {
  total: number
  wins: number
  losses: number
  breakevens: number
  /** 0-100. Breakevens count in the denominator. */
  winRate: number
  grossProfit: number
  grossLoss: number
  /** grossProfit / grossLoss. Infinity when there are no losses. */
  profitFactor: number
  avgWin: number
  /** Negative number (or 0 when there are no losses). */
  avgLoss: number
  largestWin: number
  /** Negative number (or 0 when there are no losses). */
  largestLoss: number
  avgPlannedRR: number
  /** Average winning R divided by average losing R (payoff ratio). */
  avgRealizedRR: number
  expectancy: number
  expectancyR: number
  netPnl: number
  returnPct: number
  maxDrawdown: number
  maxDrawdownPct: number
  currentStreak: Streak
  longestWinStreak: number
  longestLossStreak: number
  avgHoldMs: number
}

export interface EquityPoint {
  /** Epoch ms. */
  t: number
  equity: number
  pnl: number
  label: string
}

export interface GroupRow {
  key: string
  trades: number
  wins: number
  winRate: number
  netPnl: number
  avgR: number
  profitFactor: number
}

export interface HealthComponent {
  key: 'winRate' | 'profitFactor' | 'realizedRR' | 'discipline'
  label: string
  /** Max points this component can contribute. */
  weight: number
  /** 0-100 sub-score. */
  score: number
  /** score * weight / 100. */
  points: number
  detail: string
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface HealthScoreResult {
  ready: boolean
  closedCount: number
  minTrades: number
  score: number
  grade: Grade
  verdict: string
  components: HealthComponent[]
  drawdownPenalty: number
  drawdownDetail: string
  biggestDrag: { label: string; lost: number } | null
}

export interface TradeFilters {
  asset: string
  category: '' | Category
  direction: '' | Direction
  outcome: '' | Outcome
  strategy: string
  from: string
  to: string
}
