import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { DEFAULT_STRATEGIES } from '../data/assets'
import type {
  Account,
  AccountSummary,
  ClosedTrade,
  HealthScoreResult,
  JournalState,
  OpenTrade,
  Stats,
  Trade,
} from '../types'
import {
  computeStats,
  getAccountSummary,
  isOpen,
  sortedClosed,
} from '../utils/calculations'
import { computeHealthScore } from '../utils/healthScore'
import { createInitialState, journalReducer, type JournalAction } from './journalReducer'
import { loadJournal, saveJournal } from './storage'

interface JournalContextValue {
  state: JournalState
  account: Account
  trades: Trade[]
  openTrades: OpenTrade[]
  /** Oldest close first. */
  closedTrades: ClosedTrade[]
  summary: AccountSummary
  stats: Stats
  health: HealthScoreResult
  /** Preset strategies plus any the user has typed before. */
  strategies: string[]
  hasSamples: boolean
  /** False when the last localStorage write failed. */
  storageOk: boolean
  dispatch: Dispatch<JournalAction>
}

const JournalContext = createContext<JournalContextValue | null>(null)

export function JournalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(journalReducer, undefined, () => loadJournal() ?? createInitialState())
  const [storageOk, setStorageOk] = useState(true)

  // Auto-save on every change.
  useEffect(() => {
    setStorageOk(saveJournal(state))
  }, [state])

  const value = useMemo<JournalContextValue>(() => {
    const openTrades = state.trades.filter(isOpen)
    const closedTrades = sortedClosed(state.trades)
    const stats = computeStats(closedTrades, state.account.startingCapital)
    const used = state.trades.map((t) => t.strategy.trim()).filter(Boolean)
    return {
      state,
      account: state.account,
      trades: state.trades,
      openTrades,
      closedTrades,
      summary: getAccountSummary(state.account, state.trades),
      stats,
      health: computeHealthScore(closedTrades, stats),
      strategies: [...new Set([...DEFAULT_STRATEGIES, ...used])],
      hasSamples: state.trades.some((t) => t.isSample),
      storageOk,
      dispatch,
    }
  }, [state, storageOk])

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext)
  if (!ctx) throw new Error('useJournal must be used inside <JournalProvider>')
  return ctx
}
