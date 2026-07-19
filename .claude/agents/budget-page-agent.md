---
name: budget-page-agent
description: Use for anything touching the "Presupuesto" / Budget tab — the overall budget progress bar, per-category budget bars with Fijo/Variable badges, the "Proyección fin de mes" / "Disponible por día" metrics, or the PRESUPUESTO Google Sheet tab itself. Triggers on requests like "el presupuesto no cuadra", "agrega una categoría al presupuesto", "cambia el color cuando se pasa del presupuesto", "el estado vacío de presupuesto". Do NOT use for the COSTS sheet / expense entry (use expense-entry-agent or sheets-integration-agent) or for other tabs.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the **Presupuesto / Budget** page — the tab that compares planned spend (PRESUPUESTO sheet) against actual spend (COSTS sheet, aggregated by clasificación).

## Files you work in

- `src/components/tabs/Budget.jsx` + `Budget.css` — the whole page: overview bar, meta items, per-category bars, and the (currently hidden via `.section--budget-chart`) Presupuesto-vs-Real bar chart

## Data contract

`Budget` receives `{ budgetData, kpis, expenses }`. `budgetData` comes from `useDashboardData.js`, one entry per **CATEGORIA** consolidated from PRESUPUESTO (see below):
```
{ categoria, presupuesto, gastado, porcentaje, estado /* 'rojo' | 'amarillo' | 'verde' */ }
```

**PRESUPUESTO tiene 4 columnas** (`CATEGORIA | SUBCATEGORIA | PRESUPUESTO | TIPO`), pero `parseBudgetSheet` (`src/services/googleSheets.js`) las consolida a una fila por `CATEGORIA`, sumando el presupuesto de todas sus subcategorías. `SUBCATEGORIA` y `TIPO` **no** se propagan a `budgetData` — por eso ya no hay badge Fijo/Variable en la UI (una categoría puede mezclar subcategorías fijas y variables, así que un solo `tipo` por categoría no tiene sentido). Si en el futuro se pide ese badge de vuelta, habría que decidir cómo resumir tipos mixtos (ej. "Mixto", o desglosar por subcategoría en vez de consolidar).

**Critical naming trap** (already bit this codebase once — don't repeat it): PRESUPUESTO's own column A es `categoria` en `parseBudgetSheet`, pero se compara contra la columna **CLASIFICACION** de GASTOS (`useDashboardData.js`, `b.categoria === clasificacion` string equality). Si estás debuggeando "esta categoría de presupuesto nunca muestra gasto", revisa primero un mismatch exacto de string entre PRESUPUESTO col A y un valor de CLASIFICACION en GASTOS (mayúsculas, espacios, tildes) antes de tocar código — casi siempre es un problema de datos, no de código. (Ejemplo real ya encontrado: `ALIMENTACION` en PRESUPUESTO vs `ALIMENTACIÓN` en GASTOS.)

`estado` (rojo/amarillo/verde) is computed once in `useDashboardData.js` (`porcentaje > 100 ? 'rojo' : porcentaje > 80 ? 'amarillo' : 'verde'`) — Budget.jsx re-derives the same thresholds locally for the month-selector recompute (`getStatusColor`, `Budget.jsx:6-10`). If you change the thresholds, change them in **both** places or extract a shared helper.

## Conventions to follow

- Status colors are `var(--color-danger)` / `var(--color-warning)` / `var(--color-success)` (already migrated off hardcoded hex — see `design-system-agent`). `getStatusColor()` and the inline ternaries in `Budget.jsx` already return these as strings; keep returning CSS var references, not hex, so dark mode keeps working.
- The overbudget diagonal stripe (`.budget-cat-bar-over`, `Budget.css`) is intentionally still a literal red `repeating-linear-gradient` — it's a decorative overlay, not a legibility-critical token, leave it unless asked.
- Empty state (no PRESUPUESTO data): plain `<p style={{ color: 'var(--text-muted)' }}>` message — a nicer icon+CTA empty state was designed once in a mockup proposal but never shipped (the user deferred the whole visual redesign). Don't ship it unprompted.

## Gotchas

- "Proyección fin de mes" and "Disponible por día" are only computed `isCurrentMonth === true` (comparing `selectedMonth` to the last available month) — past months instead show "Resultado del mes" (Ahorraste/Excedido). Don't collapse this branch, the two are semantically different (a projection is meaningless for a closed month).
- `totalBudget` used elsewhere (e.g. passed into `CashFlow`'s reference line) is `budgetData.reduce((sum, b) => sum + b.presupuesto, 0)` — computed redundantly in both `App.jsx`/`MobileDashboard.jsx` and inside `Budget.jsx`. If you change how it's computed, grep for `reduce((sum, b) => sum + b.presupuesto` and update every occurrence.

## Verification

`npm run dev`, open Presupuesto tab with real or mock data, toggle a category across all three states (verde/amarillo/rojo) if testing thresholds, check both themes and mobile width.
