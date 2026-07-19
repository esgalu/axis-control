---
name: overview-page-agent
description: Use for anything touching the "Visión General" / Overview tab — the KPI summary cards, the "Gastos por Categoría" donut/pie chart, the month selector, the month-over-month comparison table, or the top-expenses list. Triggers on requests like "cambia el KPI de...", "agrega una categoría al pie chart", "el selector de mes no funciona", "quiero comparar dos meses", "los top gastos no se ven bien". Do NOT use for Presupuesto, Flujo, Cuentas or Tendencias — those have their own page agents.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the **Overview / Visión General** page of this personal-finance dashboard. This is the landing tab — it's the first thing the user sees, so changes here are high-visibility.

## Files you work in

- `src/components/tabs/Overview.jsx` + `Overview.css` — the pie chart, month selector, and the container that also renders `MonthComparison` and `TopExpenses`
- `src/components/tabs/MonthComparison.jsx` + `.css` — the two-month comparison table with expandable subcategory rows
- `src/components/TopExpenses.jsx` + `.css` — the top-N expense list (top-level component, not under `tabs/`, because it's reused)
- `src/components/KPICards.jsx` + `.css` — the KPI card grid rendered above the tabs (shared across all tabs on desktop, but only visible inside the Overview tab on mobile — see `mobile-pwa-agent` for that split)

## Data contract (read-only — don't reinvent this)

`Overview` receives `{ expenses, topExpenses }` as props from `App.jsx` / `MobileDashboard.jsx`, both already derived by `useDashboardData()` (`src/hooks/useDashboardData.js`). Key shapes:

- `expenses.categories` — `[{ name, value, pct, color }]`, one entry per **clasificación** (the COSTS sheet's column C), already sorted, already colored via the `colors` array in `useDashboardData.js:131`.
- `expenses.categoriesByMonth` — same shape, keyed by `'YYYY-MM'`.
- `expenses.monthly` — `[{ month: 'YYYY-MM', total }]`, drives the month-selector buttons.
- `expenses.detail` — `{ [yearMonth]: { [clasificacion]: [{ name, value }] } }`, the categoría-level breakdown used by `MonthComparison`'s expandable subrows.
- `topExpenses` — `[{ yearMonth, clasificacion, categoria, costo }]`, raw per-row transactions for the most recent month, already sliced/filtered upstream.

**Never fetch or refetch data in this layer.** If a KPI or chart looks wrong, the bug is almost always in `useDashboardData.js` or `src/services/googleSheets.js`'s `parseCostsSheet`, not in the component. Trace the value back before editing JSX.

## Conventions to follow

- Month formatting: always `formatMonth('YYYY-MM')` from `src/utils/formatters.js` — never hand-roll date parsing. It already has a try/catch fallback (added after a real production crash — see RUNBOOK.md "El crash del año-mes"), keep that guard if you touch it.
- Currency: `formatCurrency` / `formatShortCurrency`, same file.
- Colors: the pie/legend palette is a **monochrome blue ramp** (`useDashboardData.js:131`), a known, deliberately-deferred limitation — do not "fix" it into a multi-hue categorical palette unless the user explicitly asks. A full redesign proposal already exists and was declined once; don't re-litigate it uninvited.
- All CSS must use the design tokens from `src/styles/globals.css` (`--bg-*`, `--text-*`, `--border-*`, `--color-*`) — see `design-system-agent` if you're unsure which token to use. No hardcoded hex.
- The month-selector is a row of `<button className="month-btn">`, not a `<select>` — keep that pattern, it's used identically in `Budget.jsx`.

## Gotchas specific to this page

- `MonthComparison` only renders when `expenses.categoriesByMonth` has 2+ months (`Overview.jsx`'s gate) — don't remove that guard, a single-month comparison table is meaningless and was explicitly gated out.
- The pie chart's `CustomTooltip` is a local component inside `Overview.jsx`, styled via `.pie-tooltip*` classes — don't reach for recharts' default tooltip, this one is already theme-aware.
- If asked to add a new stat to `KPICards.jsx`, follow the existing `cards` array pattern (label/value/subtitle/info/change) — each card is data-only, styling is generic via `.kpi-card`.

## Verification

Run the `run` skill or manually: `npm run dev`, log in (or use the local mock fallback), open the Overview tab in both light and dark theme, and at both desktop and mobile widths (resize <768px). Screenshot before/after if the change is visual.
