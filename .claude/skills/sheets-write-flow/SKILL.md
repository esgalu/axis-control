---
name: sheets-write-flow
description: Use when building a brand-new "form that writes a row to a Google Sheet" feature (not editing the existing Agregar Gasto form — for that use expense-entry-agent directly). Packages the full pattern this app already validated once — write function, OAuth 403 handling, formula-safe append, friendly picker UI — as a repeatable checklist for the next one (e.g. "add income", "add movement"). Triggers on requests like "quiero agregar otro tipo de registro", "necesito un formulario para escribir en la hoja Y".
---

# Build a new write-to-Sheets form

This app has one working example of this pattern end-to-end: `src/components/AddExpenseModal.jsx` writing to the COSTS tab. This skill is the checklist to replicate it for a new sheet/form, informed by a real bug that happened building the first one — read step 3 carefully, it's not optional.

## Steps

1. **Confirm write scope.** If this is the app's first write feature, the OAuth scope in `src/context/AuthContext.jsx` needs to widen from `spreadsheets.readonly` to `spreadsheets`. This invalidates write permission on already-cached tokens — don't force a global re-login; instead handle it lazily (see step 5). If a write feature already exists (it does, as of this writing), the scope is already correct — check before touching `AuthContext.jsx` again.

2. **Write the append function** in `src/services/googleSheets.js`, following `appendCostRow`'s shape: `(accessToken, spreadsheetId, { ...namedFields }) => Promise<void>`, using `axios.post` against `{SHEETS_API}/{spreadsheetId}/values/{encodeURIComponent('TAB!A:Z')}:append?valueInputOption=...&insertDataOption=INSERT_ROWS`.

3. **Check whether any target column is a derived/formula column in the existing sheet** (open the real spreadsheet, click a cell in that column, look at the formula bar) — do **not** assume you can just compute the value in JS and write it as a literal string. This app's COSTS-column-B bug is the reason this step exists: writing `"2026-07"` as a plain `USER_ENTERED` string got silently reinterpreted and reformatted by Sheets, breaking the reader that expected exact `'YYYY-MM'` text. If the sheet already computes that column with a formula (e.g. `=TEXTO(A{row};"yyyy-mm")`), replicate it:
   - Append the row with that column **empty**, `valueInputOption=USER_ENTERED` (so genuinely-date/number columns still get parsed into real Sheets types).
   - Extract the written row number from the append response (`response.data.updates.updatedRange`, regex `/![A-Z]+(\d+)/`).
   - Issue a second `values.update` PUT to just that cell, `valueInputOption=USER_ENTERED`, with the formula string as the value.

4. **Build the form component**, modeled on `AddExpenseModal.jsx`:
   - Receives all dropdown/option data as **props**, pre-derived by the parent from already-loaded dashboard data (`useMemo` in `App.jsx`) — never fetches its own options.
   - For any field with a semi-fixed vocabulary (a classification, a category, a type), use the "known options + trailing '+ Otra...' sentinel revealing a free-text input" pattern, **not** a `<datalist>`/fuzzy-autocomplete — this app's sheet parsers group by exact string match, so free-typing without a safety rail silently fragments data (e.g. "Hogar" vs "HOGAR" becoming two different chart slices).
   - State machine: `idle → submitting → success | error`, with two distinct error branches — `err.response?.status === 403` → show a "reconecta tu cuenta" message with a button calling `login()` from `useAuth()`; anything else → generic retry message. Never clear form values on error.
   - On success, call the passed-in `onSuccess` (wired by the parent to `refreshData` from `useDashboardData`/`DataContext`) immediately, not gated behind the user dismissing a confirmation panel.

5. **Wire the trigger** into both desktop (`App.jsx`) and mobile (`MobileDashboard.jsx`, and its `IPhoneFrame`-nested second instance) — ask the user where they want the button; don't assume "same place as Agregar Gasto" is right for a different feature's usage frequency (e.g. a rarely-used form might belong behind a settings/menu entry instead of a prominent always-visible button).

6. **Style with existing tokens only** (see `design-system-agent`) — reuse `AddExpenseModal.css`'s classes (`.add-expense-overlay`, `-card`, `-field`, `-box-grid`, `-banner`, `-btn-primary/-secondary`, `-spinner`) as a starting template rather than inventing a parallel set of modal classes, if visually consistent with a modal-style form is desired.

## Verification

No test suite exists in this repo. A fake/expired token reliably exercises the generic-error UI path; the success path and the 403-reconnect path require a real logged-in session and **can only be confirmed by the user** — say so explicitly, don't claim these paths as verified from an automated session.
