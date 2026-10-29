const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Avoids "-$0.00" for values that round to zero. */
function clean(n: number): number {
  return Math.abs(n) < 0.005 ? 0 : n
}

export function formatCurrency(n: number): string {
  return Number.isFinite(n) ? usd.format(clean(n)) : '—'
}

export function formatSignedCurrency(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const v = clean(n)
  return v > 0 ? `+${usd.format(v)}` : usd.format(v)
}

export function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(n: number, digits = 2): string {
  return Number.isFinite(n) ? `${formatNumber(n, digits)}%` : '—'
}

export function formatSignedPercent(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  const v = Math.abs(n) < 0.005 ? 0 : n
  return `${v > 0 ? '+' : ''}${formatNumber(v, digits)}%`
}

export function formatR(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const v = Math.abs(n) < 0.005 ? 0 : n
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}R`
}

/** Prices keep at least 2 decimals and more for sub-$1 assets. */
export function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: n < 1 ? 6 : 4,
  })
}

export function formatQuantity(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
}

/** 2.5 -> "1:2.5" */
export function formatRR(rr: number): string {
  if (!Number.isFinite(rr)) return '—'
  return `1:${Number(rr.toFixed(2))}`
}

export function formatProfitFactor(pf: number, hasTrades = true): string {
  if (!hasTrades) return '—'
  if (pf === Infinity) return '∞'
  return formatNumber(pf, 2)
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateTime.format(d)
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function formatShortDate(ms: number): string {
  return shortDate.format(new Date(ms))
}

/** "2026-10" -> "Oct 2026" */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Compact axis ticks: 101500 -> "$101.5k" */
export function formatCompactCurrency(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`
  return `${sign}$${abs.toFixed(0)}`
}

/** Tailwind text color class for a signed value. */
export function pnlColor(n: number): string {
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) return 'text-dim'
  return n > 0 ? 'text-up' : 'text-down'
}

// ---- datetime-local helpers (local time <-> ISO) ----

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date | ISO -> "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">. */
export function toLocalInputValue(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "YYYY-MM-DDTHH:mm" (local) -> ISO string. Returns '' when invalid. */
export function fromLocalInputValue(value: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}
