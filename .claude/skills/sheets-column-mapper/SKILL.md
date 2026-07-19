---
name: sheets-column-mapper
description: Use when adding read support for a new Google Sheet tab (a new range to fetch and parse), or when changing which columns an existing parser reads. Follows this project's positional-column parsing convention in src/services/googleSheets.js. Triggers on requests like "lee la hoja X también", "agrega la columna Y", "necesito leer otro rango del spreadsheet".
---

# Map a new Google Sheet tab into the app

Every sheet-tab reader in this codebase (`src/services/googleSheets.js`) follows the same shape. This skill is the checklist for adding one more without breaking the established conventions.

## Steps

1. **Fetch the range.** Add a `GET {SHEETS_API}/{spreadsheetId}/values/{encodeURIComponent('TABNAME!A:Z')}?valueRenderOption=UNFORMATTED_VALUE` call inside `fetchSheetData`. Decide **required vs. optional**:
   - Required (throws if missing, like COSTS/SNAPSHOTS): only for data the app cannot render anything meaningful without.
   - Optional (wrap in `try { ... } catch { /* TABNAME no existe */ }`, like MOVIMIENTOS/INGRESOS/PRESUPUESTO): the default for anything else — a missing tab should degrade gracefully, not crash the app.

2. **Write `parseXxxSheet(rows)`.** Convention: `rows[0]` is the header and is always skipped (`for (let r = 1; r < rows.length; r++)`); columns are accessed **positionally** by index (`row[0]`, `row[1]`, ...), never by header name — there is no schema/column-name lookup anywhere in this codebase, don't introduce one for just this function. Use the existing helpers:
   - `serialToDate(val)` for any date-like column (handles both Excel serial numbers and `'YYYY-MM-DD'` strings)
   - `getVal(row, idx)` for any numeric column (strips `$`, `,`, whitespace, returns `0` on anything unparseable — never `NaN`)

3. **Filter defensively.** Skip rows that are clearly incomplete (`if (!row || row.length < N) continue`) and rows missing a required field (mirror the existing `if (!clasificacion || costo <= 0) continue` style in `parseCostsSheet`) — a sparse/manually-edited spreadsheet is the normal case here, not the exception.

4. **Return a clean shape**, not the raw rows — an array of plain objects, or a map keyed by something meaningful (month, account name). Look at `parseMovementsSheet` / `parseIncomeSheet` / `parseBudgetSheet` for the range of shapes already in use; match whichever is closest to what your new data needs.

5. **Wire it into `fetchSheetData`'s return object** and, if the app needs to *use* this data (not just store it), add the derivation to `src/hooks/useDashboardData.js` — components should never read `rawData` directly, only the hook's derived output.

6. **Add the new field(s) to `src/data/financialData.js`?** Only if you want the local (logged-out) mock fallback to exercise this feature too — the mock is **not** a required mirror of the real schema (several real fields, like `expenseDetail`/`topExpenses`/`movements`, are absent from it today), so skipping this is fine for a quick add, just know the feature won't be testable without real Sheets data if you skip it.

## Gotchas

- `valueRenderOption=UNFORMATTED_VALUE` means numbers come back as raw numbers/serials, not display strings — don't assume a cell value is already a clean string.
- If the new column can plausibly contain a value that "looks like" a date or number when it's meant to stay text (e.g. `"2026-07"`), read `sheets-integration-agent`'s notes and this repo's `RUNBOOK.md` ("El crash del año-mes") before assuming `String(row[i]).trim()` round-trips safely through a *write* path — this skill covers *reading*; if you also need to *write* that column back, use the `sheets-write-flow` skill instead.

## Verification

No test suite exists — verify by pointing at a real (ideally test/duplicate) spreadsheet, adding a row manually in the Sheets UI, and confirming `npm run dev` picks it up after a refresh, including edge cases (empty cells, a row with fewer columns than expected).
