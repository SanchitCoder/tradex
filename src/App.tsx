import { useState } from 'react'
import {
  BookOpen,
  CandlestickChart,
  Database,
  History,
  Info,
  LayoutDashboard,
  MonitorDown,
  type LucideIcon,
} from 'lucide-react'
import { JournalProvider, useJournal } from './context/JournalContext'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { Breakdowns } from './components/Breakdowns'
import { DataPanel } from './components/DataPanel'
import { HealthScore } from './components/HealthScore'
import { KPICards } from './components/KPICards'
import { OpenTradesTable } from './components/OpenTradesTable'
import { PerformanceStats } from './components/PerformanceStats'
import { TradeForm } from './components/TradeForm'
import { TradeHistory } from './components/TradeHistory'
import { EquityCurve } from './components/charts/EquityCurve'
import { MonthlyPnl } from './components/charts/MonthlyPnl'
import { PnlByAsset } from './components/charts/PnlByAsset'
import { WinLossDonut } from './components/charts/WinLossDonut'
import { Button } from './components/ui/Button'
import { ConfirmDialog } from './components/ui/ConfirmDialog'

type Tab = 'dashboard' | 'journal' | 'history' | 'data'

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'history', label: 'History', icon: History },
  { id: 'data', label: 'Data', icon: Database },
]

function SampleBanner() {
  const { hasSamples, dispatch } = useJournal()
  const [confirming, setConfirming] = useState(false)
  if (!hasSamples) return null
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-ink">
          <Info size={16} className="shrink-0 text-warn" aria-hidden />
          You&apos;re looking at sample data so the dashboard isn&apos;t empty.
        </p>
        <Button variant="outline" onClick={() => setConfirming(true)}>
          Clear sample data
        </Button>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Clear sample data?"
          confirmLabel="Clear samples"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            dispatch({ type: 'CLEAR_SAMPLES' })
            setConfirming(false)
          }}
        >
          This removes the demo trades only. Anything you logged yourself is kept.
        </ConfirmDialog>
      )}
    </>
  )
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <HealthScore />
      <PerformanceStats />
      <EquityCurve />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <WinLossDonut />
        <PnlByAsset />
      </div>
      <MonthlyPnl />
      <Breakdowns />
    </div>
  )
}

function Journal() {
  return (
    <div className="space-y-4">
      <TradeForm />
      <OpenTradesTable />
    </div>
  )
}

function Shell() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { storageOk } = useJournal()
  const { canInstall, install } = useInstallPrompt()

  return (
    <div className="min-h-dvh bg-bg text-ink md:pl-56">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-panel md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <CandlestickChart size={22} className="text-up" aria-hidden />
          <div>
            <div className="text-base font-bold leading-none tracking-tight">TradeX</div>
            <div className="mt-1 text-[11px] text-dim">Paper trading journal</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === id ? 'bg-accent/15 text-accent' : 'text-dim hover:bg-panel2 hover:text-ink'
              }`}
            >
              <Icon size={18} aria-hidden />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-3 border-t border-line px-5 py-4 text-[11px] leading-relaxed text-dim">
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/50 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              <MonitorDown size={14} aria-hidden /> Install app
            </button>
          )}
          <p>Manual prices only. No live data or APIs.</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-panel/95 pb-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur md:hidden">
        <CandlestickChart size={20} className="text-up" aria-hidden />
        <span className="font-bold tracking-tight">TradeX</span>
        <span className="ml-auto text-xs text-dim">{TABS.find((t) => t.id === tab)?.label}</span>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-10 md:pt-6">
        {!storageOk && (
          <div role="alert" className="rounded-xl border border-down/40 bg-down/10 px-4 py-3 text-sm text-ink">
            Browser storage is unavailable, so your changes will be lost on reload. Use Data → Export JSON to save a
            backup.
          </div>
        )}
        <KPICards />
        <SampleBanner />
        <div key={tab} className="animate-fade-in">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'journal' && <Journal />}
          {tab === 'history' && <TradeHistory />}
          {tab === 'data' && <DataPanel />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Main"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              tab === id ? 'text-accent' : 'text-dim'
            }`}
          >
            <Icon size={20} aria-hidden />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <JournalProvider>
      <Shell />
    </JournalProvider>
  )
}
