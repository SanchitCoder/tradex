import type { Category } from '../types'

export const CRYPTO_ASSETS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD'] as const

export const COMMODITY_ASSETS = [
  'Gold (XAU/USD)',
  'Silver (XAG/USD)',
  'Crude Oil (WTI)',
  'Brent',
  'Natural Gas',
  'Copper',
] as const

/** Value of the asset dropdown that reveals the free-text symbol field. */
export const CUSTOM_ASSET = '__custom__'

export const ASSET_CATEGORY: Record<string, Category> = {
  ...Object.fromEntries(CRYPTO_ASSETS.map((a) => [a, 'Crypto' as const])),
  ...Object.fromEntries(COMMODITY_ASSETS.map((a) => [a, 'Commodity' as const])),
}

export const DEFAULT_STRATEGIES = [
  'Breakout',
  'Pullback',
  'Reversal',
  'Trend Following',
  'Range Fade',
]
