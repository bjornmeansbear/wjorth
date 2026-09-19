# Wjorth — Technical Write-Up

This documents the original vanilla single-file build (`index.html`). See
`README.md` for the project's newer Svelte + Tailwind track, if one exists
alongside this one.

## Stack

Zero-framework, zero-build. Vanilla HTML/CSS/JS in one file (`index.html`),
plus three pinned CDN dependencies loaded via `<script>`/`<link>` tags — no
npm, no bundler, no `package.json`:

- **Chart.js 4.4.4** (jsdelivr) — category and time-series charts
- **PapaParse 5.4.1** (cdnjs) — CSV parsing
- **IBM Plex Sans / IBM Plex Mono** (Google Fonts) — UI text and tabular
  numbers, respectively

Everything else — layout, state, rendering — is hand-written.

## Architecture

Single IIFE at the bottom of the page, `"use strict"`, no modules. Rough
shape:

```
state = { transactions[], rules[], accounts[] }
  ↓ loadState() / saveState()   →  localStorage["wjorth_v1"]

CSV file → PapaParse → column-guess → mapping UI → importFile()
  → normalize each row → dedupe by hash → push into state.transactions

render()  — the one entry point called after any state change
  ├─ renderKPIs(filteredTxns)
  ├─ renderCatChart(filteredTxns)      → Chart.js horizontal bar
  ├─ renderTimeChart(filteredTxns)     → Chart.js line, weekly/monthly buckets
  ├─ renderRecurring()                 → runs on full history, ignores period filter
  ├─ renderMerchants(filteredTxns)
  ├─ renderRules()
  └─ renderTable(filteredTxns)         → sort/search/filter/inline-edit
```

There's no virtual DOM or diffing — `render()` re-derives everything from
state and rewrites the relevant `innerHTML` each time. Fine at the data
volumes this is built for (personal transaction history, capped display at
200 rows); would need real work before it scaled past that.

## Data flow / privacy model

CSV → `FileReader` → PapaParse → in-memory JS objects → `localStorage`. No
network calls carry transaction data at any point — the only outbound
requests are the three CDN assets above, which are static libraries, not
endpoints you send data to. This was a deliberate constraint, not an
afterthought: it's the reason there's no backend, no accounts, no sync.

## Data model

```ts
Transaction {
  id: string          // hash(account|date|description|amount|flow) — dedupe key
  date: "YYYY-MM-DD"
  description: string // raw from CSV
  account: string      // user-labeled at import
  amount: number       // always positive
  flow: "in" | "out"
  category: string
  manual: boolean       // true once hand-edited, protects it from auto-recategorization
}

Rule { keyword: string, category: string }
```

`rules` is an ordered array — `categorize()` does a first-match
`String.includes()` walk, case-insensitive. User-created or user-edited rules
get unshifted to the front, so they always beat the ~40 shipped defaults on a
keyword collision.

## Key algorithms

**Column mapping.** Headers are guessed by substring match against a
candidate list per field (date, desc/payee/merchant/memo, amount,
debit/credit). Guesses populate the mapping UI but are always user-editable
before import — no bank format is trusted blindly.

**Import normalization.** Dates try `MM/DD/YYYY` → `YYYY-MM-DD` →
`Date.parse()` fallback, in that order. Amounts strip everything but
digits/decimal, treat parens or a leading `-` as negative, and respect a
per-file "flip sign" toggle for exports where positive means spend. Rows
failing to resolve a date or description are skipped and counted in the
import summary rather than silently dropped.

**Deduplication.** The hash of `account|date|description|amount|flow` doubles
as both the transaction's stable ID and the dedupe key — re-importing an
overlapping statement is a no-op for rows already present, additive for new
ones.

**Recurring-charge detection** (the actual "find savings" feature): group
transactions by `normalizeMerchant()` — lowercased, digits/punctuation
stripped, first two words. A group counts as recurring if it has ≥2 charges,
all within 15% of the group's average amount, spaced 18–45 days apart
consecutively. Reported sorted by `avg × 12` (annualized), which is the
number that actually motivates cancelling something.

**Category learning loop.** Editing a transaction's category sets
`manual: true` on it and upserts a rule keyed on that same
`normalizeMerchant()` fingerprint — which also immediately re-tags any other
non-manual transaction from that merchant already sitting in the ledger. One
correction propagates backward and forward.

## Design system

CSS custom properties in `:root`; a ledger/paper palette (warm off-white,
ink black, brick red for outflow, moss green for inflow, slate-teal accent)
with a `prefers-color-scheme: dark` block and a parallel explicit
`[data-theme="dark"]` block (no toggle wired to it yet — CSS is ready,
control isn't). IBM Plex Sans for UI text, IBM Plex Mono with
`tabular-nums` for every date and dollar figure. Mobile-first: 2-column KPI
grid under 640px, 4-column above; tables scroll horizontally rather than
reflow.

## Known limitations (also in CLAUDE.md)

- No theme toggle UI
- Single currency, USD formatting hardcoded
- No budget/target overlay
- `localStorage` ties data to one browser profile — no export/import of the
  state itself beyond the CSV dump, so switching machines means
  re-importing statements
- Recurring-detection thresholds (15% amount tolerance, 18–45 day spacing)
  are a first guess, untested against real multi-bank data
