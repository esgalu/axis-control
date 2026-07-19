---
name: accounts-page-agent
description: Use for anything touching the "Cuentas" / "Ingresos" tab (nav id `accounts`) — the income-per-consultorio range bars, the ANALISIS/INGRESOS Google Sheet tabs, or pending-payment handling. Triggers on requests like "el análisis de ingresos por consultorio", "agrega un consultorio", "el estado pendiente no se ve bien". Do NOT use for Tendencias' patrimony-composition list — separate feature owned by trends-page-agent.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the tab at nav id `accounts` (still labeled "Ingresos" in `NavTabs.jsx`/`MobileBottomNav.jsx`/`MobileDashboard.jsx`'s `TAB_TITLES` — the id wasn't renamed to keep the diff small, only the visible label was).

**Domain note:** this project was repurposed from a personal-finance dashboard (bank accounts/patrimony) to the `FINANZAS JULI` spreadsheet, which tracks income per consultorio odontológico instead. There is no accounts/patrimony/snapshots data for this spreadsheet — the old account-cards-grid + performance-chart + evolution-chart UI was fully replaced by an income-vs-historical-range analysis. See `.claude/docs/finanzas-juli-mapping.md` for the original column-mapping design.

## Files you work in

- `src/components/tabs/Accounts.jsx` + `Accounts.css` — summary row + one range-bar row per consultorio

## Data contract

`Accounts` receives `{ incomeAnalysis, currentMonth }`. `incomeAnalysis` (from `useDashboardData.js`) merges the `ANALISIS` sheet (historical min/promedio/maximo per consultorio) with the **current calendar month's** actual income per consultorio from `INGRESOS` (`incomeByConsultorioMonth[currentMonth]`, computed in `parseIncomeSheet`, `src/services/googleSheets.js`):
```
{ lugar, consultorio, minimo, promedio, maximo, actual, pendiente, hasRange, estado }
```
`estado` is one of `pendiente | sin-registro | bajo | normal | alto | sin-rango`, computed once in `useDashboardData.js` — don't re-derive the thresholds in the component, mirror the pattern from `budget-page-agent` (single source of truth for status logic).

**`pendiente` vs `$0`:** `INGRESOS.INGRESO` blank means "pago pendiente de cobro", not zero income. `parseIncomeSheet` distinguishes this by checking the raw cell (`undefined`/`null`/`''`) before falling back to `getVal()`, because a truly missing trailing cell and a real `0` both stringify the same way otherwise. If you touch this parsing, keep that distinction — collapsing pending into `0` would silently hide unpaid consultorios as "no income this month" instead of "waiting to be paid."

**Current month, not last recorded month:** `incomeAnalysis` is scoped to `currentMonth` (today's real calendar month, same `currentMonthStr` used by the "Gasto Este Mes" KPI and "Top Gastos del Mes"), not the last month with data. If a consultorio has no INGRESOS row at all for the current month, it still shows up (as long as it's in ANALISIS) with `actual: 0` and `estado: 'sin-registro'`.

## Conventions to follow

- Range-bar scale is **per row**, not shared across consultorios (`rowMax = Math.max(maximo, actual, minimo, 1) * 1.1` in `Accounts.jsx`) — income varies wildly per consultorio (some ~$200K, others ~$4M), so a shared scale would make small consultorios invisible.
- Status colors reuse the existing semantic tokens (`var(--color-success/danger/warning/primary)`, `var(--text-faint)`) — same tokens Budget.jsx uses for verde/amarillo/rojo. Don't invent a new palette for this; keep it consistent with `design-system-agent`'s token system.
- `hasRange` gates whether the min/max band and average tick render at all — a consultorio with income but no ANALISIS row (`estado: 'sin-rango'`) still shows its bar, just without the historical band.

## Gotchas

- `AccountsEvolution.jsx`/`.css` are now orphaned (no longer imported by `Accounts.jsx`) — left in place rather than deleted in case patrimony tracking becomes relevant again later. Don't resurrect it as a side effect of an unrelated task without checking with the user first.
- `Trends.jsx` still receives a (currently always-empty) `accounts` prop derived from `SNAPSHOTS`/`SAVINGS` — that's a separate, still-empty data path unrelated to `incomeAnalysis`. Don't wire `incomeAnalysis` into `Trends.jsx`; if the user wants a trends view for consultorio income, that's a new feature to design, not a prop rename.

## Verification

`npm run dev`, open the "Ingresos" tab, confirm each consultorio row shows a status badge consistent with its actual vs. min/max, and that a consultorio with a blank `INGRESOS.INGRESO` cell shows "Pendiente" rather than `$0`. Check both themes and mobile width.
