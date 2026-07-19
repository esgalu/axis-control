---
name: expense-entry-agent
description: Use for anything touching the "Agregar gasto" write flow — AddExpenseModal.jsx, its trigger buttons on desktop/mobile, the clasificación icon-box picker, the categoría autosuggest, or any future "write a new row to a sheet from a form" feature modeled on this one. Triggers on requests like "agrega otro tipo de registro", "cambia los íconos de clasificación", "el formulario no valida bien", "agrega un campo al formulario de gastos". This is the reference implementation for any future write-to-sheet form in this app.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the **expense-entry form** — the only user-facing write path into Google Sheets in this app today, and the pattern to copy for any future one (e.g. "add income", "add movement").

## Files you work in

- `src/components/AddExpenseModal.jsx` + `.css` — the whole modal: form, validation, icon-box classification picker, submit states
- Trigger wiring lives in the *consumers*, not this file: `App.jsx` (desktop, button after `<KPICards>`, always visible) and `MobileDashboard.jsx` (mobile, button only inside the Overview tab block — a deliberate, user-specified placement, don't move it to the header without asking)

## The form's data model

`clasificacionOptions` (array of strings) and `categoriasByClasificacion` (`{ [clasificacion]: string[] }`) are **derived once in `App.jsx`** via `useMemo` over `expenses.categories` / `expenses.detail` (both already loaded by `useDashboardData()`) and passed down as props to every `AddExpenseModal` instance. **Never** have this component fetch or derive its own option lists — it's intentionally a dumb, prop-driven component so desktop and both mobile render paths (real + `IPhoneFrame` preview) stay in sync by construction. If you add a new derived-options prop, add it to the `useMemo` in `App.jsx` and thread it through **all three** render sites (grep `<AddExpenseModal` and `<MobileDashboard`).

There is no fixed enum of classifications anywhere — the icon map (`CLASIFICACION_ICONS` in `AddExpenseModal.jsx`) is a **display-only** lookup with a generic `🏷️` fallback for anything not in the map (including every user-typed "Otra" classification). Adding a new well-known classification means adding one entry to that object; it does not need to exist in any sheet ahead of time.

## The "select with defaults + Otra" pattern (reuse this, don't reinvent)

Both classification and category use the same shape: a picker showing known values, with a trailing "+ Otra..." (sentinel `OTRA = '__otra__'`) that reveals a plain text input. This was chosen deliberately over a `<datalist>`-backed free-type input, because `parseCostsSheet` groups by **exact string match** — "HOGAR" and "Hogar" would silently become two different pie-chart slices. If asked to make picking "easier" in some other way, preserve this exact-match safety property; don't reintroduce free-typing-with-fuzzy-matching without flagging the data-integrity tradeoff to the user first.

Category's picker degrades straight to free-text (skipping the dropdown entirely) when `categoriaOptions.length === 0` — i.e., whenever the chosen classification has no prior history (including brand-new "Otra" classifications). Keep that fallback; an empty `<select>` with only "+ Otra..." in it is worse UX than just showing the text input immediately.

## Submit flow / error states

State machine: `idle → submitting → success | error`. On error, **form values are preserved** (not cleared) — this is intentional, don't reset on failure. Two distinct error branches:
- `err.response?.status === 403` → "reconecta tu cuenta" message + a button calling `login()` from `useAuth()` (the write-scope-missing case, see `sheets-integration-agent`)
- anything else → generic "no se pudo guardar, intenta de nuevo" + retry (a `type="submit"` button so it re-runs full validation, not a raw resubmit)

On success, `onSuccess()` (wired to `refreshData` by every caller) fires **immediately**, before the user dismisses the success panel — don't gate the refetch behind the modal closing, the goal is that KPIs are already current by the time they close it.

## Gotchas

- The append itself does not write literal text into the sheet's derived/formula column — see `sheets-integration-agent`'s notes on `appendCostRow`. If you add a new field to this form that maps to a formula-derived sheet column, follow that same two-step (append blank → PUT formula) pattern, don't compute the formula's result in JS and write it as a literal.
- `SHEET_ID` is read directly via `import.meta.env.VITE_GOOGLE_SHEET_ID` inside this component, not passed as a prop — consistent with how `DataContext.jsx` does it, not an oversight.

## Verification

There's no test suite and no way to simulate a real OAuth write-scope grant from an automated browser session — validate the UI (empty-state validation messages, icon-box selection, custom-entry flow, both themes, mobile width) with a fake/expired token, which reliably exercises the generic-error path. The **success path and the 403-reconnect path can only be confirmed by the user on a real logged-in session** — say so explicitly rather than claiming an untested path works.
