---
name: cashflow-page-agent
description: Use for anything touching the "Flujo" / CashFlow tab — the income-vs-expenses bar chart, the budget reference line on that chart, or the per-month Ahorraste/Déficit summary cards. Triggers on requests like "el flujo de caja no muestra ingresos", "cambia el color de los ingresos", "la línea de presupuesto en el gráfico de flujo". Requires an INGRESOS sheet tab to show real income — do not assume income data exists without checking.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the **Flujo / CashFlow** page — income vs. expenses per month, plus a budget reference line.

## Files you work in

- `src/components/tabs/CashFlow.jsx` + `CashFlow.css`

## Data contract

`CashFlow` receives `{ cashFlow, totalBudget }`. `cashFlow` = `[{ month, income, expenses }]`, built in `useDashboardData.js` from `rawData.monthlyExpense` (COSTS-derived) merged with `rawData.incomeByMonth` (from the **optional** `INGRESOS` sheet tab — `parseIncomeSheet` in `src/services/googleSheets.js`). If `INGRESOS` doesn't exist in the spreadsheet, `incomeByMonth` is `{}` and every month's `income` will be `0` — this is expected, not a bug, unless the user has actually created that tab.

## Conventions to follow

- Bar colors: `fill="var(--color-success)"` for income, `fill="var(--color-danger)"` for expenses — both the `<Bar>` fill and the matching `<LabelList>` text fill must use the same var, they were split into two separate props historically and it's easy to update one and forget the other (grep `dataKey="income"` and `dataKey="expenses"` to find both spots).
- The budget `<ReferenceLine>` only renders `{totalBudget > 0 && ...}` — don't remove that guard, a reference line at y=0 is visual noise.
- Recharts' `<Tooltip>` here uses the library default styling (no `contentStyle` override) — this was a deliberate scope decision (see `design-system-agent`'s notes on which Tooltips got dark-mode treatment and which didn't). If asked to fix tooltip legibility in dark mode, that's the fix to make; don't be surprised it's not already there.

## Gotchas

- `cashflow-balance` color (`isPositive ? 'var(--color-success)' : 'var(--color-danger)'`) is inline JSX, not CSS — if you're doing a broad find-and-replace of colors, don't miss inline `style={{ color: ... }}` props, they don't show up in a `.css`-only grep.
- Month labels use `formatMonth` — same crash-safety note as `overview-page-agent`: it has a try/catch fallback now, don't remove it.

## Verification

`npm run dev`, open Flujo tab, confirm bars render for months with expense data even if income is 0, check the reference line appears only when a PRESUPUESTO total exists, both themes.
