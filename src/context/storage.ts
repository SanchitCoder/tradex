import type { JournalState } from '../types'
import { JOURNAL_VERSION, parseJournal } from '../utils/journalSchema'

const KEY = 'tradex.journal.v1'
const CORRUPT_KEY = `${KEY}.corrupt`

/** Returns null when nothing is stored, or the stored value is unreadable. */
export function loadJournal(): JournalState | null {
  let text: string | null = null
  try {
    text = localStorage.getItem(KEY)
  } catch {
    return null
  }
  if (text === null) return null

  try {
    const parsed = parseJournal(JSON.parse(text))
    if (parsed) return parsed.state
  } catch {
    // fall through to the backup path
  }
  // Keep the unreadable payload around instead of silently overwriting it.
  try {
    localStorage.setItem(CORRUPT_KEY, text)
  } catch {
    // nothing more we can do
  }
  return null
}

/** Returns false when the write failed (storage blocked or full). */
export function saveJournal(state: JournalState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: JOURNAL_VERSION, ...state }))
    return true
  } catch {
    return false
  }
}
