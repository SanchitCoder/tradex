import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Save } from 'lucide-react'
import { ASSET_CATEGORY, COMMODITY_ASSETS, CRYPTO_ASSETS, CUSTOM_ASSET } from '../data/assets'
import { useJournal } from '../context/JournalContext'
import type { Category, Direction, OpenTrade } from '../types'
import { calcPlan, quantityFromRisk, toNumber, validateLevels } from '../utils/calculations'
import {
  formatCurrency,
  formatPercent,
  formatQuantity,
  formatRR,
  fromLocalInputValue,
  toLocalInputValue,
} from '../utils/formatters'
import { newId } from '../utils/id'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Field, inputClass, invalidClass, monoInputClass } from './ui/Field'
import { Segmented } from './ui/Segmented'

type SizeMode = 'quantity' | 'risk'

interface FormValues {
  openedAt: string
  assetChoice: string
  customSymbol: string
  customCategory: Category
  direction: Direction
  entry: string
  target: string
  stopLoss: string
  sizeMode: SizeMode
  quantity: string
  riskPct: string
  strategy: string
  notes: string
}

/** Above this share of equity at risk the preview shows a warning. */
const RISK_WARN_PCT = 2

function blankValues(): FormValues {
  return {
    openedAt: toLocalInputValue(new Date()),
    assetChoice: CRYPTO_ASSETS[0],
    customSymbol: '',
    customCategory: 'Crypto',
    direction: 'BUY',
    entry: '',
    target: '',
    stopLoss: '',
    sizeMode: 'quantity',
    quantity: '',
    riskPct: '1',
    strategy: '',
    notes: '',
  }
}

function valuesFromTrade(t: OpenTrade): FormValues {
  const preset = t.asset in ASSET_CATEGORY
  return {
    openedAt: toLocalInputValue(t.openedAt),
    assetChoice: preset ? t.asset : CUSTOM_ASSET,
    customSymbol: preset ? '' : t.asset,
    customCategory: t.category,
    direction: t.direction,
    entry: String(t.entry),
    target: String(t.target),
    stopLoss: String(t.stopLoss),
    sizeMode: 'quantity',
    quantity: String(t.quantity),
    riskPct: '1',
    strategy: t.strategy,
    notes: t.notes,
  }
}

interface TradeFormProps {
  /** When set the form edits this open trade instead of logging a new one. */
  trade?: OpenTrade
  onDone?: () => void
}

type ErrorKey = 'openedAt' | 'customSymbol' | 'entry' | 'target' | 'stopLoss' | 'quantity' | 'riskPct'

export function TradeForm({ trade, onDone }: TradeFormProps) {
  const { summary, strategies, dispatch } = useJournal()
  const editing = trade !== undefined
  const [values, setValues] = useState<FormValues>(() => (trade ? valuesFromTrade(trade) : blankValues()))
  const [submitted, setSubmitted] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!justSaved) return
    const id = setTimeout(() => setJustSaved(false), 3000)
    return () => clearTimeout(id)
  }, [justSaved])

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const entry = toNumber(values.entry)
  const target = toNumber(values.target)
  const stopLoss = toNumber(values.stopLoss)
  const levelErrors = validateLevels(values.direction, entry, target, stopLoss)
  const levelsValid = Object.keys(levelErrors).length === 0

  const riskPctInput = toNumber(values.riskPct)
  const quantity =
    values.sizeMode === 'quantity'
      ? toNumber(values.quantity)
      : levelsValid
        ? quantityFromRisk(summary.equity, riskPctInput, entry, stopLoss)
        : NaN

  const plan = calcPlan({ direction: values.direction, entry, target, stopLoss, quantity }, summary.equity)

  const errors: Partial<Record<ErrorKey, string>> = { ...levelErrors }
  if (!fromLocalInputValue(values.openedAt)) errors.openedAt = 'Enter a valid date and time'
  if (values.assetChoice === CUSTOM_ASSET && !values.customSymbol.trim()) {
    errors.customSymbol = 'Enter a symbol'
  }
  if (values.sizeMode === 'quantity') {
    if (!(quantity > 0)) errors.quantity = 'Enter a quantity above 0'
  } else if (!(riskPctInput > 0 && riskPctInput <= 100)) {
    errors.riskPct = 'Enter a risk between 0 and 100%'
  } else if (levelsValid && !(quantity > 0)) {
    errors.riskPct = 'Risk is too small to size a position'
  }

  const filled: Record<ErrorKey, boolean> = {
    openedAt: true,
    customSymbol: values.customSymbol !== '',
    entry: values.entry !== '',
    target: values.target !== '',
    stopLoss: values.stopLoss !== '',
    quantity: values.quantity !== '',
    riskPct: values.riskPct !== '',
  }
  const errorFor = (key: ErrorKey): string | undefined =>
    errors[key] && (submitted || filled[key]) ? errors[key] : undefined
  const fieldClass = (key: ErrorKey, base = monoInputClass) =>
    errorFor(key) ? `${base} ${invalidClass}` : base

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return

    const custom = values.assetChoice === CUSTOM_ASSET
    const next: OpenTrade = {
      id: trade?.id ?? newId(),
      status: 'open',
      openedAt: fromLocalInputValue(values.openedAt),
      asset: custom ? values.customSymbol.trim() : values.assetChoice,
      category: custom ? values.customCategory : ASSET_CATEGORY[values.assetChoice],
      direction: values.direction,
      entry,
      target,
      stopLoss,
      quantity,
      strategy: values.strategy.trim(),
      notes: values.notes.trim(),
      ...(trade?.isSample ? { isSample: true } : {}),
    }

    if (editing) {
      dispatch({ type: 'UPDATE_TRADE', trade: next })
      onDone?.()
      return
    }
    dispatch({ type: 'ADD_TRADE', trade: next })
    setJustSaved(true)
    setSubmitted(false)
    setValues((v) => ({
      ...blankValues(),
      assetChoice: v.assetChoice,
      customSymbol: v.customSymbol,
      customCategory: v.customCategory,
      direction: v.direction,
      sizeMode: v.sizeMode,
      riskPct: v.riskPct,
    }))
  }

  const form = (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date & time" htmlFor="tf-date" error={errorFor('openedAt')}>
          <input
            id="tf-date"
            type="datetime-local"
            value={values.openedAt}
            onChange={(e) => set('openedAt', e.target.value)}
            className={fieldClass('openedAt', inputClass)}
          />
        </Field>

        <Field label="Asset" htmlFor="tf-asset">
          <select
            id="tf-asset"
            value={values.assetChoice}
            onChange={(e) => set('assetChoice', e.target.value)}
            className={inputClass}
          >
            <optgroup label="Crypto">
              {CRYPTO_ASSETS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </optgroup>
            <optgroup label="Commodities">
              {COMMODITY_ASSETS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </optgroup>
            <option value={CUSTOM_ASSET}>Custom…</option>
          </select>
        </Field>
      </div>

      {values.assetChoice === CUSTOM_ASSET && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Custom symbol" htmlFor="tf-symbol" error={errorFor('customSymbol')}>
            <input
              id="tf-symbol"
              type="text"
              value={values.customSymbol}
              onChange={(e) => set('customSymbol', e.target.value)}
              placeholder="e.g. DOGE/USD"
              className={fieldClass('customSymbol', inputClass)}
            />
          </Field>
          <Field label="Market category">
            <Segmented<Category>
              label="Market category"
              value={values.customCategory}
              onChange={(v) => set('customCategory', v)}
              options={[
                { value: 'Crypto', label: 'Crypto' },
                { value: 'Commodity', label: 'Commodity' },
              ]}
            />
          </Field>
        </div>
      )}

      <Field label="Direction">
        <Segmented<Direction>
          label="Direction"
          value={values.direction}
          onChange={(v) => set('direction', v)}
          options={[
            { value: 'BUY', label: 'BUY (Long)', activeClass: 'bg-up text-white' },
            { value: 'SELL', label: 'SELL (Short)', activeClass: 'bg-down text-white' },
          ]}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Entry price" htmlFor="tf-entry" error={errorFor('entry')}>
          <input
            id="tf-entry"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={values.entry}
            onChange={(e) => set('entry', e.target.value)}
            placeholder="0.00"
            className={fieldClass('entry')}
          />
        </Field>
        <Field label="Target price" htmlFor="tf-target" error={errorFor('target')}>
          <input
            id="tf-target"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={values.target}
            onChange={(e) => set('target', e.target.value)}
            placeholder="0.00"
            className={fieldClass('target')}
          />
        </Field>
        <Field label="Stop loss" htmlFor="tf-stop" error={errorFor('stopLoss')}>
          <input
            id="tf-stop"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={values.stopLoss}
            onChange={(e) => set('stopLoss', e.target.value)}
            placeholder="0.00"
            className={fieldClass('stopLoss')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Position sizing">
          <Segmented<SizeMode>
            label="Position sizing mode"
            value={values.sizeMode}
            onChange={(v) => set('sizeMode', v)}
            options={[
              { value: 'quantity', label: 'Quantity' },
              { value: 'risk', label: 'Risk % of equity' },
            ]}
          />
        </Field>

        {values.sizeMode === 'quantity' ? (
          <Field label="Quantity" htmlFor="tf-qty" error={errorFor('quantity')}>
            <input
              id="tf-qty"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={values.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              placeholder="Units / contracts"
              className={fieldClass('quantity')}
            />
          </Field>
        ) : (
          <Field
            label="Risk % of equity"
            htmlFor="tf-risk"
            error={errorFor('riskPct')}
            hint={
              quantity > 0
                ? `Quantity: ${formatQuantity(quantity)} (equity ${formatCurrency(summary.equity)})`
                : 'Quantity is calculated once entry and stop are valid'
            }
          >
            <input
              id="tf-risk"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={values.riskPct}
              onChange={(e) => set('riskPct', e.target.value)}
              placeholder="1"
              className={fieldClass('riskPct')}
            />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Strategy / setup" htmlFor="tf-strategy">
          <input
            id="tf-strategy"
            type="text"
            list="tf-strategies"
            value={values.strategy}
            onChange={(e) => set('strategy', e.target.value)}
            placeholder="Breakout, Pullback, Reversal…"
            className={inputClass}
          />
          <datalist id="tf-strategies">
            {strategies.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Notes / reason for entry" htmlFor="tf-notes">
          <textarea
            id="tf-notes"
            rows={1}
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Why this trade? What confirms it?"
            className={`${inputClass} min-h-[38px] resize-y`}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-line bg-bg p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dim">Trade preview</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PreviewStat label="Risk" value={plan ? formatCurrency(plan.risk) : '—'} tone="text-down" />
          <PreviewStat label="Risk % of equity" value={plan ? formatPercent(plan.riskPct) : '—'} />
          <PreviewStat label="Potential reward" value={plan ? formatCurrency(plan.reward) : '—'} tone="text-up" />
          <PreviewStat label="Planned R:R" value={plan ? formatRR(plan.rr) : '—'} />
        </div>
        {plan && plan.riskPct > RISK_WARN_PCT && (
          <p className="mt-3 flex items-center gap-2 text-xs text-warn">
            <AlertTriangle size={14} aria-hidden />
            This risks more than {RISK_WARN_PCT}% of equity on one trade.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">
          {editing ? <Save size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
          {editing ? 'Save changes' : 'Log trade'}
        </Button>
        {editing && (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        {justSaved && (
          <span className="animate-fade-in inline-flex items-center gap-1.5 text-sm text-up" role="status">
            <CheckCircle2 size={16} aria-hidden /> Trade logged
          </span>
        )}
      </div>
    </form>
  )

  return editing ? form : <Card title="Log a New Trade">{form}</Card>
}

function PreviewStat({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-dim">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
}
