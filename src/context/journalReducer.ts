import { createSampleTrades } from '../data/sampleTrades'
import type { JournalState, OpenTrade } from '../types'
import { closeTrade, type ExitInput } from '../utils/calculations'
import { STARTING_CAPITAL } from '../utils/journalSchema'

export type JournalAction =
  | { type: 'ADD_TRADE'; trade: OpenTrade }
  | { type: 'UPDATE_TRADE'; trade: OpenTrade }
  | { type: 'DELETE_TRADE'; id: string }
  | { type: 'CLOSE_TRADE'; id: string; exit: ExitInput }
  | { type: 'CLEAR_SAMPLES' }
  | { type: 'RESET' }
  | { type: 'IMPORT'; state: JournalState }

export function createEmptyState(): JournalState {
  return { account: { startingCapital: STARTING_CAPITAL, currency: 'USD' }, trades: [] }
}

export function createInitialState(): JournalState {
  return { ...createEmptyState(), trades: createSampleTrades() }
}

export function journalReducer(state: JournalState, action: JournalAction): JournalState {
  switch (action.type) {
    case 'ADD_TRADE':
      return { ...state, trades: [action.trade, ...state.trades] }

    case 'UPDATE_TRADE':
      return {
        ...state,
        trades: state.trades.map((t) =>
          t.id === action.trade.id && t.status === 'open' ? action.trade : t,
        ),
      }

    case 'DELETE_TRADE':
      return { ...state, trades: state.trades.filter((t) => t.id !== action.id) }

    case 'CLOSE_TRADE':
      return {
        ...state,
        trades: state.trades.map((t) =>
          t.id === action.id && t.status === 'open' ? closeTrade(t, action.exit) : t,
        ),
      }

    case 'CLEAR_SAMPLES':
      return { ...state, trades: state.trades.filter((t) => !t.isSample) }

    case 'RESET':
      return createEmptyState()

    case 'IMPORT':
      return action.state
  }
}
