import { useState } from 'react'
import { LogOut, Pencil, Trash2 } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import type { OpenTrade } from '../types'
import { plannedRR, tradeRisk } from '../utils/calculations'
import { formatCurrency, formatDateTime, formatPrice, formatQuantity, formatRR } from '../utils/formatters'
import { ExitTradeModal } from './ExitTradeModal'
import { TradeForm } from './TradeForm'
import { Card, EmptyState } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { CategoryTag, DirectionBadge } from './ui/Badges'
import { Modal } from './ui/Modal'

const th = 'whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-dim'
const td = 'whitespace-nowrap px-3 py-3'

export function OpenTradesTable() {
  const { openTrades, dispatch } = useJournal()
  const [exiting, setExiting] = useState<OpenTrade | null>(null)
  const [editing, setEditing] = useState<OpenTrade | null>(null)
  const [deleting, setDeleting] = useState<OpenTrade | null>(null)

  return (
    <>
      <Card title={`Open Trades (${openTrades.length})`} flush>
        {openTrades.length === 0 ? (
          <EmptyState message="No open trades. Log one above to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Asset</th>
                  <th className={th}>Direction</th>
                  <th className={`${th} text-right`}>Entry</th>
                  <th className={`${th} text-right`}>Target</th>
                  <th className={`${th} text-right`}>SL</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Risk $</th>
                  <th className={`${th} text-right`}>Planned R:R</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {openTrades.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-panel2">
                    <td className={`${td} text-xs text-dim`}>{formatDateTime(t.openedAt)}</td>
                    <td className={td}>
                      <div className="font-medium text-ink">{t.asset}</div>
                      <CategoryTag category={t.category} />
                      {t.isSample && <span className="ml-2 text-[10px] uppercase text-warn">sample</span>}
                    </td>
                    <td className={td}>
                      <DirectionBadge direction={t.direction} />
                    </td>
                    <td className={`${td} text-right font-mono tabular-nums`}>{formatPrice(t.entry)}</td>
                    <td className={`${td} text-right font-mono tabular-nums text-up`}>{formatPrice(t.target)}</td>
                    <td className={`${td} text-right font-mono tabular-nums text-down`}>{formatPrice(t.stopLoss)}</td>
                    <td className={`${td} text-right font-mono tabular-nums`}>{formatQuantity(t.quantity)}</td>
                    <td className={`${td} text-right font-mono tabular-nums`}>{formatCurrency(tradeRisk(t))}</td>
                    <td className={`${td} text-right font-mono tabular-nums`}>{formatRR(plannedRR(t))}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExiting(t)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent/85"
                        >
                          <LogOut size={13} aria-hidden /> EXIT
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          aria-label={`Edit ${t.asset} trade`}
                          className="rounded p-1.5 text-dim transition-colors hover:bg-line hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(t)}
                          aria-label={`Delete ${t.asset} trade`}
                          className="rounded p-1.5 text-dim transition-colors hover:bg-down/15 hover:text-down"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {exiting && <ExitTradeModal trade={exiting} onClose={() => setExiting(null)} />}

      {editing && (
        <Modal title={`Edit ${editing.asset} trade`} onClose={() => setEditing(null)} widthClass="max-w-2xl">
          <TradeForm trade={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete open trade?"
          confirmLabel="Delete trade"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            dispatch({ type: 'DELETE_TRADE', id: deleting.id })
            setDeleting(null)
          }}
        >
          This permanently removes the open {deleting.asset} {deleting.direction} trade. This can&apos;t be undone.
        </ConfirmDialog>
      )}
    </>
  )
}
