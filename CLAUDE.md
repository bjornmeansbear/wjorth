# Wjorth — Claude Code project context

Read `SPEC.md` for the full functional spec before making changes. This file is
quick orientation for whichever session picks this up.

## What this is

A single-file, client-side personal finance dashboard. Import bank/card CSVs,
auto-categorize spending, chart it, surface recurring charges worth cutting.
No backend, no build step, no analytics, no network calls except the three
pinned CDN assets (fonts, Chart.js, PapaParse).

## Non-negotiables

- **Everything client-side.** No transaction data ever leaves the browser —
  no fetch calls, no telemetry, no server component. This is the whole point
  of the tool (it's financial data). Don't add a backend without being asked
  explicitly, and even then, treat it as a major architecture change to flag.
- **Single HTML file for the app itself.** `index.html` is intentionally
  self-contained (inline CSS + JS). If this grows enough to split into
  modules, that's a deliberate refactor to discuss first, not a default.
- **Storage is `localStorage`**, key `wjorth_v1`. Schema:
  `{ transactions: [...], rules: [...], accounts: [...] }`. See SPEC.md for
  the transaction shape.
- **No frameworks.** Vanilla JS. Keep it that way unless asked to change it.

## Design system (already implemented, keep consistent)

- Ledger/paper aesthetic: warm off-white background, ink-black text, brick
  red for spending, moss green for income, slate blue-teal accent.
- Type: IBM Plex Sans (UI text) + IBM Plex Mono (all numbers — dates,
  amounts — with `font-variant-numeric: tabular-nums`).
- CSS custom properties in `:root`, with a `prefers-color-scheme: dark`
  override block and an explicit `[data-theme="dark"]` block (no theme
  toggle wired up yet — see "Open items" below).
- Mobile-first: KPI grid is 2-col under 640px, 4-col above. Tables scroll
  horizontally rather than break layout.

## Conventions in the code

- No build tooling — open `index.html` directly, or serve it
  (`python3 -m http.server`) if you need `localhost` instead of `file://`.
- IIFE-wrapped vanilla JS at the bottom of `index.html`, `"use strict"`.
- All money formatting goes through `fmtMoney()`. All merchant-name
  normalization for recurring-detection and rule-matching goes through
  `normalizeMerchant()`. Don't duplicate that logic elsewhere.
- `categorize(description)` walks `state.rules` in order and returns the
  first keyword match — rule order matters (newer/user rules are
  `unshift`ed to the front so they win over defaults).

## Open items / known gaps (fair game to pick up)

- No theme toggle UI (CSS is ready, just needs a control that sets
  `data-theme` on `<html>`).
- No multi-currency support — everything assumes one currency, formatted
  as USD.
- No budget/target overlay on the charts.
- Recurring-charge detection uses a fairly blunt heuristic (same normalized
  merchant, amount within 15%, spaced 18–45 days apart). Reasonable to
  tighten/loosen if it's too noisy or too quiet on real data.
- If this moves to a repo with real usage, consider whether `localStorage`
  is still the right store vs. a local file the user can back up/sync
  themselves — flagged in SPEC.md as a real tradeoff, not decided yet.
