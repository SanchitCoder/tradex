import type {
  Category,
  Direction,
  ExitReason,
  JournalState,
  Outcome,
  Trade,
} from '../types'
import { calcRealized } from './calculations'
import { newId } from './id'

export const JOURNAL_VERSION = 1
export const STARTING_CAPITAL = 100_000

const CATEGORIES: Category[] = ['Crypto', 'Commodity']
const DIRECTIONS: Direction[] = ['BUY', 'SELL']
const OUTCOMES: Outcome[] = ['Profit', 'Loss', 'Breakeven']
const REASONS: ExitReason[] = ['Target Hit', 'Stop Loss Hit', 'Manual Exit']

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const posNum = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
const finiteNum = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const isoDate = (v: unknown): string | null =>
  typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? v : null
const oneOf = <T extends string>(list: readonly T[], v: unknown): T | null =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null

/** Returns a clean Trade, or null when the record is unusable. */
function parseTrade(raw: unknown): Trade | null {
  if (!isObj(raw)) return null
  const openedAt = isoDate(raw.openedAt)
  const category = oneOf(CATEGORIES, raw.category)
  const direction = oneOf(DIRECTIONS, raw.direction)
  const entry = posNum(raw.entry)
  const target = posNum(raw.target)
  const stopLoss = posNum(raw.stopLoss)
  const quantity = posNum(raw.quantity)
  const asset = str(raw.asset).trim()
  if (!openedAt || !category || !direction || !entry || !target || !stopLoss || !quantity || !asset) {
    return null
  }

  const base = {
    id: str(raw.id) || newId(),
    openedAt,
    asset,
    category,
    direction,
    entry,
    target,
    stopLoss,
    quantity,
    strategy: str(raw.strategy),
    notes: str(raw.notes),
    ...(raw.isSample === true ? { isSample: true } : {}),
  }

  if (raw.status === 'open') return { ...base, status: 'open' }
  if (raw.status !== 'closed') return null

  const exitPrice = posNum(raw.exitPrice)
  const closedAt = isoDate(raw.closedAt)
  const outcome = oneOf(OUTCOMES, raw.outcome)
  const exitReason = oneOf(REASONS, raw.exitReason)
  if (!exitPrice || !closedAt || !outcome || !exitReason) return null

  // Recompute from prices if the stored figures were edited into nonsense.
  const realized = calcRealized(base, exitPrice)
  return {
    ...base,
    status: 'closed',
    exitPrice,
    closedAt,
    outcome,
    exitReason,
    postNotes: str(raw.postNotes),
    pnl: finiteNum(raw.pnl) ?? realized.pnl,
    pnlPct: finiteNum(raw.pnlPct) ?? realized.pnlPct,
    rMultiple: finiteNum(raw.rMultiple) ?? realized.rMultiple,
  }
}

export interface ParsedJournal {
  state: JournalState
  skipped: number
}

/** Validates unknown JSON (localStorage or an imported file). Null if it isn't a journal at all. */
export function parseJournal(raw: unknown): ParsedJournal | null {
  if (!isObj(raw) || !Array.isArray(raw.trades)) return null

  const seen = new Set<string>()
  const trades: Trade[] = []
  let skipped = 0
  for (const item of raw.trades) {
    const trade = parseTrade(item)
    if (!trade || seen.has(trade.id)) {
      skipped += 1
      continue
    }
    seen.add(trade.id)
    trades.push(trade)
  }

  const capital = isObj(raw.account) ? posNum(raw.account.startingCapital) : null
  return {
    state: {
      account: { startingCapital: capital ?? STARTING_CAPITAL, currency: 'USD' },
      trades,
    },
    skipped,
  }
}
