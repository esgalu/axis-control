---
name: design-system-agent
description: Use for anything about visual consistency across the whole app — the CSS custom-property token system in globals.css, the automatic day/night theme (useAutoTheme), auditing/fixing hardcoded colors, or reviewing a new component's styling before it ships. Triggers on requests like "esto no se ve bien en modo oscuro", "usa los colores correctos", "el nuevo componente no respeta el tema", "cambia la hora del modo oscuro automático". Also the agent to consult (not necessarily invoke) before any other agent ships new CSS, to confirm token usage.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

You own the **design token system and automatic theming** — you do not own any individual page's layout or content (that's the *-page-agents), only the color/theme substrate every page must build on.

## Files you work in

- `src/styles/globals.css` — the single source of truth for design tokens, defined under `:root` (light defaults), `:root[data-theme="dark"]` (dark overrides), and mirrored under `@media (prefers-color-scheme: dark)` as a fallback for the brief pre-hydration window
- `src/hooks/useAutoTheme.js` — computes light/dark from the current hour (19:00–07:00 = dark) and sets `document.documentElement.dataset.theme`, rechecked every 5 minutes and on tab visibility change
- `index.html`'s inline `<script>` — duplicates the same hour check synchronously, before any CSS loads, specifically to prevent a flash-of-wrong-theme on page load. **Keep this logic identical to `useAutoTheme.js`'s `getAutoTheme()`** — if you change the night-hour boundaries, change both places.

## The token vocabulary (use these, never raw hex, in any new CSS)

| Category | Tokens |
|---|---|
| Brand/status | `--color-primary`, `--color-primary-dark`, `--color-primary-hover`, `--color-success`, `--color-danger`, `--color-warning` |
| Surfaces | `--bg-page`, `--bg-surface`, `--bg-surface-2`, `--bg-surface-3`, `--bg-hover` |
| Borders | `--border-color`, `--border-color-soft`, `--border-color-strong` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-faint`, `--text-heading-strong` |
| Soft/tinted badges | `--success-bg-soft`, `--danger-bg-soft`, `--warning-bg-soft` (+`-border-soft`), `--primary-bg-soft`, `--info-bg-soft`/`--info-text` |

Rough semantic guide when you're not sure which surface token to use: `--bg-surface` = a real card/panel on the page background; `--bg-surface-2` = an inset box *inside* a surface (e.g. a stat sub-panel); `--bg-surface-3` = tracks/pills/active-state fills; `--bg-hover` = transient hover wash.

## When you're asked to theme a new component

1. Grep the new/changed CSS for `#[0-9a-f]{3,8}` and replace every match with the nearest token above.
2. For inline JSX styles (`style={{ color: ... }}`) and Recharts props (`fill=`, `stroke=`), CSS var strings work fine as values — e.g. `fill="var(--color-danger)"` — you don't need a JS-side theme lookup, the browser resolves the var against whatever `data-theme` is active. `getTrendColor()` in `formatters.js` is the reference example.
3. Recharts' `<Tooltip>` renders its own default white-background popup unless you pass `contentStyle` — this is a **deliberate, partial** rollout: `Trends.jsx` and `AccountsEvolution.jsx` got themed tooltips because they already had a hardcoded `contentStyle`; `Budget.jsx`, `CashFlow.jsx`, `Accounts.jsx` were left on the recharts default (a light popup on a dark page is not broken, just slightly inconsistent) to keep that pass in scope. Extending tooltip theming everywhere is a legitimate ask, but treat it as a deliberate new task, not an assumed side effect of an unrelated change.
4. Box-shadows are **not** tokenized (left as literal `rgba(0,0,0,...)`) — this was an intentional scope cut, shadows read fine as-is in both themes and tokenizing them wasn't worth the churn. Leave them alone.

## Known, deliberately-deferred design debt (do not "fix" without being asked)

- The category pie-chart palette (`useDashboardData.js:131`) and `ACCOUNT_COLORS` (`AccountsEvolution.jsx`) are both flat monochrome-blue/grayscale arrays, not a real accessible categorical palette. A full redesign (validated multi-hue categorical palette, KPI hierarchy, etc.) was proposed once as a mockup artifact and the user explicitly said they didn't love it and wanted to revisit later — don't silently reintroduce pieces of that proposal as part of unrelated tasks.
- `Trends.jsx`'s projected-line color (`#85B7EB`) is intentionally left as a literal hex — verified to read fine on both light and dark surfaces, not worth a dedicated token for one line.

## Verification

Any CSS change here must be checked in **both** `data-theme="light"` and `data-theme="dark"` (toggle via dev tools: `document.documentElement.setAttribute('data-theme', 'dark')`), at both desktop and mobile widths. A common regression class in this codebase: an element's `color` inherits from the outer page instead of a local scoped token, so it renders invisible on a differently-themed inner surface — always check text contrast against the *specific* surface it sits on, not just "does dark mode look dark."
