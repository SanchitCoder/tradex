/** Small label/value pair for use inside a `<dl>` (mobile trade cards). */
export function Metric({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-dim">{label}</dt>
      <dd className={`break-words font-mono text-[13px] tabular-nums ${tone}`}>{value}</dd>
    </div>
  )
}
