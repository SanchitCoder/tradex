import { useState } from 'react'
import { Check, Crosshair, ShieldX } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import type { ExitReason, OpenTrade, Outcome } from '../types'
import {
  calcRealized,
  suggestExitReason,
  suggestOutcome,
  toNumber,
  tradeRisk,
} from '../utils/calculations'
import {
  formatCurrency,
  formatPrice,
  formatR,
  formatSignedCurrency,
  formatSignedPercent,
  fromLocalInputValue,
  pnlColor,
  toLocalInputValue,
} from '../utils/formatters'
import { Button } from './ui/Button'
import { Field, inputClass, invalidClass, monoInputClass } from './ui/Field'
import { Modal } from './ui/Modal'
import { Segmented } from './ui/Segmented'

interface ExitTradeModalProps {
  trade: OpenTrade
  onClose: () => void
}

const OUTCOME_OPTIONS = [
  { value: 'Profit' as const, label: 'Profit', activeClass: 'bg-up text-white' },
  { value: 'Loss' as const, label: 'Loss', activeClass: 'bg-down text-white' },
  { value: 'Breakeven' as const, label: 'Breakeven', activeClass: 'bg-dim text-bg' },
]

const REASON_OPTIONS: Array<{ value: ExitReason; label: string }> = [
  { value: 'Target Hit', label: 'Target Hit' },
  { value: 'Stop Loss Hit', label: 'Stop Loss Hit' },
  { value: 'Manual Exit', label: 'Manual Exit' },
]

export function ExitTradeModal({ trade, onClose }: ExitTradeModalProps) {
  const { summary, dispatch } = useJournal()
  const [exitPrice, setExitPrice] = useState('')
  const [exitAt, setExitAt] = useState(() => toLocalInputValue(new Date()))
  const [postNotes, setPostNotes] = useState('')
  // null = follow the automatic suggestion
  const [outcomeOverride, setOutcomeOverride] = useState<Outcome | null>(null)
  const [reasonOverride, setReasonOverride] = useState<ExitReason | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const price = toNumber(exitPrice)
  const priceValid = Number.isFinite(price) && price > 0
  const realized = priceValid ? calcRealized(trade, price) : null

  const autoOutcome = realized ? suggestOutcome(realized.pnl, tradeRisk(trade)) : null
  const outcome = outcomeOverride ?? autoOutcome
  const autoReason = priceValid ? suggestExitReason(trade, price) : 'Manual Exit'
  const reason = reasonOverride ?? autoReason

  const closedAtIso = fromLocalInputValue(exitAt)
  const timeError = !closedAtIso
    ? 'Enter a valid date and time'
    : new Date(closedAtIso) < new Date(trade.openedAt)
      ? 'Exit time is before the trade was opened'
      : undefined
  const priceError = priceValid ? undefined : 'Enter an exit price above 0'

  const quickFill = (value: number) => {
    setExitPrice(String(value))
    setOutcomeOverride(null)
    setReasonOverride(null)
  }

  const confirm = () => {
    setSubmitted(true)
    if (priceError || timeError || !outcome) return
    dispatch({
      type: 'CLOSE_TRADE',
      id: trade.id,
      exit: {
        exitPrice: price,
        closedAt: closedAtIso,
        outcome,
        exitReason: reason,
        postNotes: postNotes.trim(),
      },
    })
    onClose()
  }

  const showPriceError = submitted && priceError
  const overridden = outcomeOverride !== null && outcomeOverride !== autoOutcome

  return (
    <Modal
      title={`Exit ${trade.asset} ${trade.direction === 'BUY' ? 'Long' : 'Short'}`}
      onClose={onClose}
      widthClass="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm}>
            <Check size={16} aria-hidden /> Confirm exit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-line bg-bg p-3 font-mono text-xs tabular-nums">
          <div>
            <div className="font-sans text-dim">Entry</div>
            <div className="text-sm text-ink">{formatPrice(trade.entry)}</div>
          </div>
          <div>
            <div className="font-sans text-dim">Target</div>
            <div className="text-sm text-up">{formatPrice(trade.target)}</div>
          </div>
          <div>
            <div className="font-sans text-dim">Stop loss</div>
            <div className="text-sm text-down">{formatPrice(trade.stopLoss)}</div>
          </div>
        </div>

        <Field label="Exit price" htmlFor="ex-price" error={showPriceError || undefined}>
          <input
            id="ex-price"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            autoFocus
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder="0.00"
            className={showPriceError ? `${monoInputClass} ${invalidClass}` : monoInputClass}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" className="!px-3 !py-1.5 !text-xs" onClick={() => quickFill(trade.target)}>
              <Crosshair size={13} className="text-up" aria-hidden /> Hit Target
            </Button>
            <Button variant="outline" className="!px-3 !py-1.5 !text-xs" onClick={() => quickFill(trade.stopLoss)}>
              <ShieldX size={13} className="text-down" aria-hidden /> Hit Stop Loss
            </Button>
          </div>
        </Field>

        <div className="rounded-lg border border-line bg-bg p-3">
          <div className="grid grid-cols-3 gap-3">
            <Result label="Realized P&L" value={realized ? formatSignedCurrency(realized.pnl) : '—'} tone={realized ? pnlColor(realized.pnl) : 'text-dim'} />
            <Result label="P&L %" value={realized ? formatSignedPercent(realized.pnlPct) : '—'} tone={realized ? pnlColor(realized.pnl) : 'text-dim'} />
            <Result label="R-multiple" value={realized ? formatR(realized.rMultiple) : '—'} tone={realized ? pnlColor(realized.pnl) : 'text-dim'} />
          </div>
          <p className="mt-3 border-t border-line pt-2 text-xs text-dim">
            New equity:{' '}
            <span className="font-mono tabular-nums text-ink">
              {formatCurrency(summary.equity + (realized?.pnl ?? 0))}
            </span>
          </p>
        </div>

        <Field label="Outcome">
          <Segmented<Outcome>
            label="Outcome"
            value={outcome ?? ('' as Outcome)}
            onChange={setOutcomeOverride}
            options={OUTCOME_OPTIONS}
          />
          <p className="mt-1 text-xs text-dim">
            {autoOutcome === null
              ? 'Enter an exit price to auto-select the outcome.'
              : overridden
                ? `Manually set (auto-detected: ${autoOutcome}). `
                : `Auto-selected from P&L. Click another option to override.`}
            {overridden && (
              <button
                type="button"
                onClick={() => setOutcomeOverride(null)}
                className="text-accent underline-offset-2 hover:underline"
              >
                Reset to auto
              </button>
            )}
          </p>
        </Field>

        <Field label="Exit reason">
          <Segmented<ExitReason>
            label="Exit reason"
            value={reason}
            onChange={setReasonOverride}
            options={REASON_OPTIONS}
          />
        </Field>

        <Field label="Exit date & time" htmlFor="ex-date" error={timeError}>
          <input
            id="ex-date"
            type="datetime-local"
            value={exitAt}
            onChange={(e) => setExitAt(e.target.value)}
            className={timeError ? `${inputClass} ${invalidClass}` : inputClass}
          />
        </Field>

        <Field label="Post-trade notes / lesson learned" htmlFor="ex-notes">
          <textarea
            id="ex-notes"
            rows={3}
            value={postNotes}
            onChange={(e) => setPostNotes(e.target.value)}
            placeholder="What went right or wrong? Did you follow the plan?"
            className={`${inputClass} resize-y`}
          />
        </Field>
      </div>
    </Modal>
  )
}

function Result({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className="text-xs text-dim">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
}
