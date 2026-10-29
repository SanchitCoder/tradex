import type { JournalState, Trade } from '../types'
import { tradeRisk, plannedRR } from './calculations'
import { JOURNAL_VERSION, parseJournal, type ParsedJournal } from './journalSchema'

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const stamp = (): string => new Date().toISOString().slice(0, 10)

export function exportJournalJSON(state: JournalState): void {
  const payload = {
    version: JOURNAL_VERSION,
    exportedAt: new Date().toISOString(),
    account: state.account,
    trades: state.trades,
  }
  downloadFile(`tradex-journal-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

/** Quote a CSV cell; neutralise leading =,+,-,@ in text so spreadsheets don't run it as a formula. */
function textCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

const CSV_HEADERS = [
  'Status',
  'Opened',
  'Closed',
  'Asset',
  'Category',
  'Direction',
  'Entry',
  'Target',
  'Stop Loss',
  'Quantity',
  'Risk $',
  'Planned R:R',
  'Exit Price',
  'Outcome',
  'Exit Reason',
  'P&L $',
  'P&L %',
  'R Multiple',
  'Strategy',
  'Entry Notes',
  'Post-Trade Notes',
]

export function tradesToCSV(trades: Trade[]): string {
  const rows = trades.map((t) => {
    const closed = t.status === 'closed'
    return [
      t.status,
      t.openedAt,
      closed ? t.closedAt : '',
      textCell(t.asset),
      t.category,
      t.direction,
      t.entry,
      t.target,
      t.stopLoss,
      t.quantity,
      tradeRisk(t).toFixed(2),
      plannedRR(t).toFixed(2),
      closed ? t.exitPrice : '',
      closed ? t.outcome : '',
      closed ? t.exitReason : '',
      closed ? t.pnl.toFixed(2) : '',
      closed ? t.pnlPct.toFixed(2) : '',
      closed ? t.rMultiple.toFixed(2) : '',
      textCell(t.strategy),
      textCell(t.notes),
      closed ? textCell(t.postNotes) : '',
    ].join(',')
  })
  return [CSV_HEADERS.join(','), ...rows].join('\n')
}

export function exportTradesCSV(trades: Trade[]): void {
  downloadFile(`tradex-trades-${stamp()}.csv`, tradesToCSV(trades), 'text/csv;charset=utf-8')
}

export type ImportResult = { ok: true; parsed: ParsedJournal } | { ok: false; error: string }

export function parseJournalFile(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  const parsed = parseJournal(raw)
  if (!parsed) return { ok: false, error: 'That file does not look like a TradeX journal export.' }
  return { ok: true, parsed }
}
