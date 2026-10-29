import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Eraser, FileSpreadsheet, MonitorDown, RotateCcw, Upload } from 'lucide-react'
import { useJournal } from '../context/JournalContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { exportJournalJSON, exportTradesCSV, parseJournalFile } from '../utils/export'
import type { ParsedJournal } from '../utils/journalSchema'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { ConfirmDialog } from './ui/ConfirmDialog'

type Notice = { tone: 'ok' | 'error'; text: string }

export function DataPanel() {
  const { state, trades, hasSamples, storageOk, dispatch } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<ParsedJournal | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClearSamples, setConfirmClearSamples] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const { canInstall, installed, install } = useInstallPrompt()

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    try {
      const result = parseJournalFile(await file.text())
      if (result.ok) {
        setPendingImport(result.parsed)
        setNotice(null)
      } else {
        setNotice({ tone: 'error', text: result.error })
      }
    } catch {
      setNotice({ tone: 'error', text: 'Could not read that file.' })
    }
  }

  const importCount = pendingImport?.state.trades.length ?? 0

  return (
    <div className="space-y-4">
      <Card title="Install app" subtitle="Run TradeX in its own window, with offline support.">
        {installed ? (
          <p className="text-sm text-up">TradeX is running as an installed app.</p>
        ) : canInstall ? (
          <Button onClick={install}>
            <MonitorDown size={16} aria-hidden /> Install TradeX
          </Button>
        ) : (
          <p className="text-sm text-dim">
            In Chrome, use the install icon at the right of the address bar, or the ⋮ menu → Cast, save and share →
            Install page as app. The install option only appears on https:// or http://localhost, not when the
            file is opened directly from disk.
          </p>
        )}
      </Card>

      <Card title="Backup & export" subtitle="Everything is stored in this browser's localStorage. Export a backup now and then.">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportJournalJSON(state)}>
            <Download size={16} aria-hidden /> Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Import JSON
          </Button>
          <Button variant="outline" onClick={() => exportTradesCSV(trades)} disabled={trades.length === 0}>
            <FileSpreadsheet size={16} aria-hidden /> Export trades CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
            aria-label="Import journal JSON file"
          />
        </div>
        {notice && (
          <p role="status" className={`mt-3 text-sm ${notice.tone === 'ok' ? 'text-up' : 'text-down'}`}>
            {notice.text}
          </p>
        )}
        {!storageOk && (
          <p role="alert" className="mt-3 text-sm text-warn">
            Browser storage is unavailable or full, so changes are not being saved. Export a JSON backup.
          </p>
        )}
      </Card>

      <Card title="Danger zone">
        <div className="flex flex-wrap gap-3">
          {hasSamples && (
            <Button variant="outline" onClick={() => setConfirmClearSamples(true)}>
              <Eraser size={16} aria-hidden /> Clear sample data
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} aria-hidden /> Reset journal
          </Button>
        </div>
      </Card>

      {pendingImport && (
        <ConfirmDialog
          title="Import journal?"
          confirmLabel="Replace journal"
          danger
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            dispatch({ type: 'IMPORT', state: pendingImport.state })
            setNotice({
              tone: 'ok',
              text: `Imported ${importCount} trade${importCount === 1 ? '' : 's'}${pendingImport.skipped ? ` (${pendingImport.skipped} invalid skipped)` : ''}.`,
            })
            setPendingImport(null)
          }}
        >
          This replaces your current journal with {importCount} trade{importCount === 1 ? '' : 's'} from the file
          {pendingImport.skipped > 0 && ` (${pendingImport.skipped} invalid record${pendingImport.skipped === 1 ? '' : 's'} will be skipped)`}
          . Export a backup first if you want to keep the current one.
        </ConfirmDialog>
      )}

      {confirmClearSamples && (
        <ConfirmDialog
          title="Clear sample data?"
          confirmLabel="Clear samples"
          onCancel={() => setConfirmClearSamples(false)}
          onConfirm={() => {
            dispatch({ type: 'CLEAR_SAMPLES' })
            setConfirmClearSamples(false)
          }}
        >
          This removes the demo trades only. Anything you logged yourself is kept.
        </ConfirmDialog>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset journal?"
          confirmLabel="Reset everything"
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            dispatch({ type: 'RESET' })
            setConfirmReset(false)
            setNotice({ tone: 'ok', text: 'Journal reset. Equity is back to the starting capital.' })
          }}
        >
          This permanently deletes all {trades.length} trade{trades.length === 1 ? '' : 's'} (open and closed) and
          resets equity to the starting capital. This can&apos;t be undone, so export a backup first if you might want
          the data.
        </ConfirmDialog>
      )}
    </div>
  )
}
