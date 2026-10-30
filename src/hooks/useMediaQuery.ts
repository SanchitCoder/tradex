import { useSyncExternalStore } from 'react'

/** Live `matchMedia` match; falls back to false where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
