# Wjorth v2 — Functional Spec

This is the active SvelteKit rebuild. See `../SPEC.md` for the original
vanilla app's spec (still accurate for `../index.html`, which is frozen).
Everything below is additive/changed relative to that document; where
behavior isn't mentioned here, assume it matches v1 exactly (the porting
work preserved algorithms verbatim except for two named bug fixes below).

## What changed from v1, and why

v1 was a spend viewer: import CSVs, categorize, chart, detect recurring
charges. v2 adds **zero-based budgeting** (assign every dollar of income to
a category), **necessity tagging** (essential/discretionary/wasteful), and
a **multi-year view** — reframing the tool from "here's what happened" to
"help me decide what to do with it."

## Data model

`data/state.json` (gitignored plain JSON, not `localStorage`):

```ts
Transaction {
  id, date, description, account, amount, flow, category, manual,
  tag: "essential" | "discretionary" | "wasteful" | null  // null = inherit category default
}
Rule { keyword, category }
Budget { month: "YYYY-MM", category, allocated: number }
ImportedFile { fileName, contentHash, importedAt, added, skipped }
AppState { version, transactions, rules, accounts, budgets, categoryTags, importedFiles }
```

Persistence is a single file, written atomically (temp file + rename) and
serialized through an in-memory write queue — sufficient for a single-user,
single-machine tool; does not attempt to solve multi-process concurrency.

## Two bug fixes vs. v1

1. **Two-digit year windowing**: a fixed pivot at 50 (`00–49 → 20xx`,
   `50–99 → 19xx`), not relative to "today" — reproducible regardless of
   when an import happens to run.
2. **Local-calendar date math**: date parsing and week-bucketing read local
   date getters directly (or use `date-fns`) instead of round-tripping
   through `Date.toISOString()`, which could shift a local calendar date by
   a day in negative-UTC-offset timezones.

## CSV ingestion

Instead of a manual file picker, CSVs are dropped into `data/inbox/` and
auto-scanned on every dashboard load. New files (tracked by content hash,
not filename — banks often re-export under the same name) get a
mapping-review card; importing moves the file to `data/inbox/processed/`.

## Zero-based budgeting (`/budget`)

Per (month, category): `allocated` (user-set) vs. `actual` (sum of that
category's outflow that month, Transfer excluded) vs. `remaining`.
`unallocated(month) = totalIncome(month) - sum(all allocated)` — the number
that should trend to $0 as every dollar gets assigned. Overspend renders in
the kit's `--color-danger` token.

## Necessity tagging

Every category has a default (`defaultCategoryTags.ts`): Groceries/
Transport/Utilities/Health/Insurance → essential; Subscriptions/Dining/
Shopping/Cash → discretionary; **Fees/Interest → wasteful**; Uncategorized
→ discretionary (deliberately not essential, so unreviewed transactions
surface for attention). Any transaction can override its effective tag
individually. `/insights` surfaces the tag rollup, the biggest discretionary/
wasteful line items, and — the most useful cross-reference — recurring
charges whose effective tag is discretionary/wasteful, ranked by annualized
cost.

## Multi-year view

The period selector gains "This year" plus one option per historical year
actually present in the data (derived dynamically, no hardcoded list).
Selecting a historical year is the one case with both a start and end
bound; every other option (all/month/3m/6m/ytd) keeps v1's "no upper bound"
behavior. Recurring-charge detection still ignores the period filter
entirely (always full history), as in v1.

## Design system

`src/lib/kit.css` is a verbatim copy of `~/Code/color-system-and-guidelines/
kit.css`. Fonts: IBM Plex Mono (self-hosted via `@fontsource`, not
hotlinked) for every number; kit's system-sans stack for UI text. A manual
dark-mode toggle (`ThemeToggle.svelte`) sets `data-theme` and persists to
its own `wjorth-theme` localStorage key — a UI preference only, unrelated
to the financial data in `state.json`. Chart data-ink uses `--pink-5`
(primary series) and `--green-5` (secondary) rather than the semantic
`--color-success`/`--color-danger` tokens, which are reserved for status
flags like budget overspend.

## Known gaps / deferred (fair game to pick up)

- **Cross-institution CSV cleaning**: different banks export meaningfully
  different formats. The per-file mapping UI (header guessing, single vs.
  split debit/credit, sign-flip) absorbs most of this, but real cleaning —
  check-number noise, pending-vs-posted duplicates, running-balance
  columns some exports include — isn't attempted.
- **Manual CSV upload fallback**: dropping files via Finder into
  `data/inbox/` is the primary flow; a browser file-input fallback that
  writes into the same folder was planned but not built.
- **Debt-payoff planner** (snowball/avalanche): explicitly out of scope for
  this build; the data model doesn't fight it (Fees/Interest already tag
  as wasteful), but nothing calculates a payoff schedule.
- Multi-currency, bank API integrations (Plaid, etc.), and user accounts —
  all remain non-goals, unchanged from v1.
