---
name: add-dashboard-tab
description: Use when adding a brand-new tab/page to the dashboard (not editing an existing one). Scaffolds a tab component + CSS following this project's established pattern, and wires it into every place a tab must be registered — NavTabs (desktop), MobileBottomNav (mobile), the render-switch in both App.jsx and MobileDashboard.jsx, and useDashboardData.js if the tab needs new derived data. Triggers on requests like "agrega una pestaña nueva", "quiero una página de [X]", "crea un tab para...".
---

# Add a new dashboard tab

This app has 5 tabs today (Overview, Presupuesto, Flujo, Cuentas, Tendencias), each rendered on **two independent shells** — desktop (`App.jsx` + `NavTabs.jsx`) and mobile (`MobileDashboard.jsx` + `MobileBottomNav.jsx`). A new tab must be registered in **all four** places or it will only half-work (visible on one shell, missing on the other).

## Steps

1. **Decide the data it needs.** Look at `src/hooks/useDashboardData.js` — does the tab need a new derived value, or can it reuse existing output (`kpis`, `expenses`, `budgetData`, `accounts`, `trend`, `cashFlow`, `movements`)? If new, add the derivation there (a `useMemo`-wrapped block), not inside the component — this hook is the single source of truth every tab reads from, keep it that way.

2. **Create the component**, `src/components/tabs/<Name>.jsx` + `<Name>.css` (own scoped CSS file, imported at the top of the `.jsx`, matching every existing tab). Props should be **pre-derived data only** — no data fetching inside the component itself (see `sheets-integration-agent` / `overview-page-agent` for why: it keeps desktop and mobile trivially in sync since both shells pass the same props from the same hook output).

3. **Use existing formatters and tokens** — `src/utils/formatters.js` for currency/date/percent, `src/styles/globals.css`'s CSS custom properties for every color (see the `design-system-agent` for the full token list). Do not hardcode hex colors.

4. **Register the tab id/label** in:
   - `src/components/NavTabs.jsx` — the `tabs` array (`{ id, label }`)
   - `src/components/MobileBottomNav.jsx` — the `TABS` array (`{ id, label, icon }`, icon is an inline SVG — match the existing 22×22 viewBox / `strokeWidth="1.8"` style of the other icons)

5. **Wire the render-switch** in three places (all keyed off the same `activeTab === '<id>'` pattern):
   - `src/App.jsx`'s `.tab-container` block (desktop)
   - `src/components/MobileDashboard.jsx`'s `.mobile-content` block (mobile)
   - If the tab needs to appear inside the desktop "Vista móvil" preview too, note that `MobileDashboard` is rendered a **second** time inside `<IPhoneFrame>` in `App.jsx` — it's the same component, so this is usually free, just confirm any new props reach both `<MobileDashboard>` call sites (grep `<MobileDashboard`).

6. **Add a `TAB_TITLES` entry** in `MobileDashboard.jsx` (the mobile header's dynamic title text).

## Verification

`npm run dev`, click through the new tab on desktop, resize to <768px and check the mobile bottom-nav entry, open the desktop "Vista móvil" preview and confirm it shows there too, check both light and dark theme.
