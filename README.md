# TradeX: paper trading journal

Vite + React + TypeScript + Tailwind CSS v4 + Recharts + lucide-react.
No backend and no market data: every price is entered by hand. State lives in React Context + `useReducer` and is auto-saved to `localStorage`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Structure

```
src/
  components/    KPICards, HealthScore, TradeForm, OpenTradesTable, ExitTradeModal,
                 TradeHistory, Filters, PerformanceStats, Breakdowns, DataPanel
    charts/      EquityCurve, WinLossDonut, PnlByAsset, MonthlyPnl, chartTheme
    ui/          Card, Button, Field, Modal, ConfirmDialog, Segmented, Badges
  context/       JournalContext (provider + derived data), journalReducer, storage (localStorage)
  utils/         calculations (all P&L / stats, pure), healthScore, formatters, export,
                 journalSchema (import/storage validation), tradeFilters, id
  types/         Trade, Account, Stats, ...
  data/          assets (presets), sampleTrades
  App.tsx
```

## Definitions

- **Equity** = $100,000 + realized P&L of closed trades.
- **Open risk** = sum of `|entry - stop| x qty` over open trades. **Available capital** = equity - open risk (there is no margin model).
- **P&L %** (per trade) = P&L / (entry x qty). **Net P&L %** (account) = P&L / starting capital.
- **R-multiple** = realized P&L / initial risk.
- **Auto outcome**: within +/-0.05R of flat is Breakeven, otherwise Profit / Loss by sign. You can override it in the exit dialog.
- **Realized R:R** = average winning R / average losing R (falls back to average winning R when there are no losses).
- **Health score** (needs 5+ closed trades): win rate 20 + profit factor 25 + realized R:R 25 + discipline 30, minus a drawdown penalty (2 pts per 1% max drawdown, capped at 25).
  Discipline = average of (% of trades closed at target/SL, % of notes filled in: entry notes and post-trade notes count half each).
  Grades: A >= 85, B >= 70, C >= 55, D >= 40, else F.
