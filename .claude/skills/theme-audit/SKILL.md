---
name: theme-audit
description: Use when auditing new or existing CSS/JSX for hardcoded colors that should be design tokens, or when a component "doesn't respect dark mode" / "looks wrong in light mode". Reruns the same grep-and-replace process used to migrate this whole app to the token system. Triggers on requests like "revisa que esto respete el tema", "esto no se ve bien en modo oscuro", "audita los colores de X".
---

# Audit a component for theme-token compliance

This app has a full light/dark token system (`src/styles/globals.css`, see `design-system-agent` for the token vocabulary) driven automatically by time of day. Any component that bypasses it with a literal color will look broken — usually invisible text, not just "slightly off" — whenever the theme doesn't match what was hardcoded.

## Steps

1. **Find literal colors.**
   ```bash
   grep -n '#[0-9a-fA-F]\{3,8\}' path/to/Component.css path/to/Component.jsx
   ```
   Check both the `.css` file and the `.jsx` file — inline `style={{ color: '#...' }}` props and Recharts `fill=`/`stroke=` props don't show up in a CSS-only search and are just as common a source of theme bugs in this codebase.

2. **Classify each hit:**
   - Text/background/border color → replace with the nearest semantic token (`--text-*`, `--bg-*`, `--border-*`) from `src/styles/globals.css`.
   - A status meaning (success/danger/warning) → `--color-success` / `--color-danger` / `--color-warning`, or the `-bg-soft` variant for a tinted badge background.
   - A **categorical** color (one of several arbitrary hues distinguishing series/categories, e.g. a chart palette) → this is genuinely out of scope for simple tokenization; flag it rather than "fixing" it unilaterally (see below).
   - A one-off decorative color verified to already read fine in both themes (e.g. a single accent line) → leave it, don't tokenize for tokenizing's sake.

3. **For JS-returned colors** (a formatter function, a `getXColor()` helper, a Recharts prop), return the **CSS var string itself** (e.g. `'var(--color-success)'`), not a resolved hex — the browser resolves it against whatever `data-theme` is active at render time. See `formatters.js`'s `getTrendColor()` for the reference pattern.

4. **Don't silently "fix" known deferred design debt.** This app has at least two intentionally-still-flat color arrays (the category pie-chart palette in `useDashboardData.js`, and `ACCOUNT_COLORS` in `AccountsEvolution.jsx`) — a full categorical-palette redesign was proposed once and the user wanted to revisit it later rather than ship it piecemeal. If your audit surfaces one of these, report it, don't rewrite it as a side effect of an unrelated task.

5. **Check Recharts `<Tooltip>` components specifically** — the library injects its own default white-background popup unless you pass `contentStyle`. Not every chart in this app has been given a themed tooltip (a deliberate partial rollout, see `design-system-agent`) — treat "this tooltip is still light-on-dark" as a known gap to report, not automatically a bug to fix, unless the user asked you to theme that specific chart.

## Verification

For every changed file: toggle `document.documentElement.setAttribute('data-theme', 'dark')` / `'light'` in the browser console (or resize/reload with the auto-theme hook active) and visually confirm text stays legible against its actual containing surface — the most common regression class here is a `color` that correctly changes but ends up computed against the *wrong* surface's contrast (e.g. inherited from the outer page instead of a themed inner card).
