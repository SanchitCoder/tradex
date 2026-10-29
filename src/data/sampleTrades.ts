import type { ClosedTrade, OpenTrade, Trade } from '../types'
import { calcRealized } from '../utils/calculations'

/** Local-time timestamp `daysAgo` days before `now`, at hh:mm. */
function at(now: Date, daysAgo: number, hh: number, mm: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

type ClosedSeed = Omit<ClosedTrade, 'status' | 'pnl' | 'pnlPct' | 'rMultiple' | 'isSample'>

function closed(seed: ClosedSeed): ClosedTrade {
  return { ...seed, status: 'closed', isSample: true, ...calcRealized(seed, seed.exitPrice) }
}

/** Demo trades (all prices are made up) so the dashboard has data on first run. */
export function createSampleTrades(now: Date = new Date()): Trade[] {
  const sampleClosed: ClosedTrade[] = [
    closed({
      id: 'sample-btc',
      openedAt: at(now, 34, 9, 0),
      closedAt: at(now, 31, 15, 30),
      asset: 'BTC/USD',
      category: 'Crypto',
      direction: 'BUY',
      entry: 62000,
      target: 65100,
      stopLoss: 60450,
      quantity: 0.65,
      strategy: 'Breakout',
      notes: 'Daily close above the 4-week range high on rising volume.',
      exitPrice: 65100,
      exitReason: 'Target Hit',
      outcome: 'Profit',
      postNotes: 'Waited for the retest before entering. Held to target without fiddling.',
    }),
    closed({
      id: 'sample-xau',
      openedAt: at(now, 21, 10, 15),
      closedAt: at(now, 20, 8, 40),
      asset: 'Gold (XAU/USD)',
      category: 'Commodity',
      direction: 'BUY',
      entry: 2650,
      target: 2700,
      stopLoss: 2630,
      quantity: 50,
      strategy: 'Pullback',
      notes: 'Pullback into the 50 EMA in an uptrend, 1:2.5 setup.',
      exitPrice: 2630,
      exitReason: 'Stop Loss Hit',
      outcome: 'Loss',
      postNotes: 'Stopped out on a USD spike. Setup was valid, size was right. No change needed.',
    }),
    closed({
      id: 'sample-eth',
      openedAt: at(now, 12, 13, 0),
      closedAt: at(now, 9, 11, 20),
      asset: 'ETH/USD',
      category: 'Crypto',
      direction: 'SELL',
      entry: 3400,
      target: 3100,
      stopLoss: 3520,
      quantity: 8,
      strategy: 'Reversal',
      notes: 'Failed breakout above resistance, bearish engulfing on the 4h.',
      exitPrice: 3150,
      exitReason: 'Manual Exit',
      outcome: 'Profit',
      postNotes: '',
    }),
    closed({
      id: 'sample-wti',
      openedAt: at(now, 6, 14, 0),
      closedAt: at(now, 5, 16, 45),
      asset: 'Crude Oil (WTI)',
      category: 'Commodity',
      direction: 'SELL',
      entry: 78.5,
      target: 75.5,
      stopLoss: 80,
      quantity: 600,
      strategy: 'Range Fade',
      notes: '',
      exitPrice: 79.1,
      exitReason: 'Manual Exit',
      outcome: 'Loss',
      postNotes: 'Closed early out of nerves before the inventory report. Should have trusted the stop.',
    }),
  ]

  const sampleOpen: OpenTrade = {
    id: 'sample-sol-open',
    status: 'open',
    isSample: true,
    openedAt: at(now, 1, 10, 30),
    asset: 'SOL/USD',
    category: 'Crypto',
    direction: 'BUY',
    entry: 168,
    target: 186,
    stopLoss: 160,
    quantity: 125,
    strategy: 'Trend Following',
    notes: 'Higher low held on the daily; entering on the 4h reclaim of the prior high.',
  }

  return [...sampleClosed, sampleOpen]
}
