# Wjorth — Claude Code project context

This repo has two tracks — **work in `app/` unless told otherwise.**

- **`app/`** — the active SvelteKit + Tailwind rebuild (v2). Zero-based
  budgeting, necessity tagging, multi-year view, a local CSV inbox, JSON-file
  persistence. Has its own `app/CLAUDE.md`-equivalent context in
  `app/SPEC.md` and `app/README.md` — read those before working in `app/`.
- **`index.html`** (repo root) — the original single-file vanilla-JS app
  (v1), **frozen** as a working reference. Don't add features here; it's
  kept functional but not developed further. Read root `SPEC.md` and
  `ARCHITECTURE.md` for how it works if you need to reference its algorithms
  (v2 ported them, with two named bug fixes — see `app/SPEC.md`).

## Non-negotiables (apply to both tracks)

- **Nothing leaves the machine.** No transaction data ever reaches a network
  call other than pinned CDN/font assets needed to render the page. This is
  the whole point of the tool (it's financial data). v1 enforces this by
  being client-side only; v2 enforces it by running its Node server
  strictly locally (never deployed) even though it does read/write the
  local filesystem (CSV inbox, `state.json`) — that's still "nothing leaves
  the machine," just via a local server instead of pure browser code.
- **v1 stays a single HTML file, vanilla JS, `localStorage`.** Don't add
  build tooling or frameworks to `index.html` — that's what `app/` is for.
- **v2 stays local-only.** Don't add a hosted deployment (Cloudflare or
  otherwise) without an explicit ask and a discussion of what that means for
  the CSV-inbox/JSON-state approach, which assumes a real local filesystem.

## v1 design system (index.html — frozen, for reference)

- Ledger/paper aesthetic: warm off-white background, ink-black text, brick
  red for spending, moss green for income, slate blue-teal accent.
- Type: IBM Plex Sans (UI text) + IBM Plex Mono (all numbers — dates,
  amounts — with `font-variant-numeric: tabular-nums`), hotlinked via
  Google Fonts.
- CSS custom properties in `:root`, with a `prefers-color-scheme: dark`
  override block and an explicit `[data-theme="dark"]` block (no theme
  toggle wired up — v2 added one, see `app/SPEC.md`).
- Mobile-first: KPI grid is 2-col under 640px, 4-col above. Tables scroll
  horizontally rather than break layout.

v2 (`app/`) uses the shared `~/Code/color-system-and-guidelines/kit.css`
design system instead (pink accent, warm cream/dark-brown palette, IBM Plex
Mono self-hosted for numbers only) — see `app/SPEC.md` "Design system".

## v1 conventions in the code (index.html — frozen, for reference)

- No build tooling — open `index.html` directly, or serve it
  (`python3 -m http.server`) if you need `localhost` instead of `file://`.
- IIFE-wrapped vanilla JS at the bottom of `index.html`, `"use strict"`.
- All money formatting goes through `fmtMoney()`. All merchant-name
  normalization for recurring-detection and rule-matching goes through
  `normalizeMerchant()`. Don't duplicate that logic elsewhere.
- `categorize(description)` walks `state.rules` in order and returns the
  first keyword match — rule order matters (newer/user rules are
  `unshift`ed to the front so they win over defaults).

v2 ports every one of these functions verbatim into
`app/src/lib/finance/*.ts` as pure, testable TypeScript — same
conventions, same invariants, just typed and out of the IIFE.

## Open items / known gaps

**v1** (frozen — these are permanently deferred, not TODOs):
no theme toggle, no multi-currency, no budget overlay, blunt recurring-charge
heuristic (15% tolerance, 18–45 day spacing), `localStorage`-only persistence.
All of these are exactly what v2 addresses — see `app/SPEC.md`.

**v2** (`app/` — fair game to pick up): see `app/SPEC.md` "Known gaps /
deferred" for the current list (cross-institution CSV cleaning, a manual
upload fallback alongside the inbox folder, a debt-payoff planner).
