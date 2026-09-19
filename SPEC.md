# Wjorth — Functional Spec

## Purpose

A personal spending dashboard that replaces manual review of bank/card CSVs
(and tools like Rocket Money) with something local, private, and inspectable.
Goal: see where money goes, and surface recurring charges worth cutting.

## Privacy model

All processing happens in the browser. CSV files are read with the
`FileReader` API and parsed with PapaParse — never uploaded anywhere. Parsed
transactions persist in `localStorage` only. There is no server component and
no reason to add one; this is a stated constraint, not an oversight.

## Data model

```
localStorage["wjorth_v1"] = {
  transactions: [
    {
      id: string,          // hash of account|date|description|amount|flow — dedupe key
      date: "YYYY-MM-DD",
      description: string, // raw, from the CSV
      account: string,     // user-labeled at import time, defaults to filename
      amount: number,      // always positive
      flow: "in" | "out",
      category: string,    // from rule match, or user override
      manual: boolean       // true once a user has hand-edited the category
    },
    ...
  ],
  rules: [
    { keyword: string, category: string },
    ...
  ],
  accounts: [string, ...]  // distinct account labels seen so far
}
```

Rule matching: lowercase the description, check `indexOf(keyword)` against
`rules` in array order, first hit wins. Default rules ship in
`defaultRules()`; user-added or user-edited rules are unshifted to the front
so they take priority over defaults on the same keyword.

Editing a transaction's category in the table sets `manual: true` on that
transaction and also upserts a rule keyed on `normalizeMerchant(description)`
— a rough merchant fingerprint (lowercased, digits and punctuation stripped,
first two words) — so future imports of the same merchant, and any other
non-manual transactions from that merchant already in the ledger, pick up the
new category automatically.

## CSV import flow

1. User drops or selects one or more `.csv` files.
2. Each file is parsed with PapaParse (`header: true`) to get column headers
   and rows.
3. Column roles are auto-guessed by substring match against header names:
   - date: contains "date"
   - description: contains "description", "desc", "payee", "merchant",
     "name", or "memo"
   - amount: contains "amount"
   - debit/credit (fallback when there's no single amount column): contains
     "debit"/"withdrawal" or "credit"/"deposit"
4. A mapping card is shown per file so the user can correct the guess,
   choose between "single amount column" and "separate debit/credit
   columns" modes, rename the account, and flip sign convention (some
   exports use positive = spend rather than negative = spend).
5. On confirm, rows are normalized into the transaction shape above:
   - Dates: tries `MM/DD/YYYY`, `YYYY-MM-DD`, then falls back to
     `Date.parse`.
   - Amounts: strips currency symbols/commas, treats parenthesized or
     minus-prefixed values as negative.
   - Rows that fail to parse a date or description are skipped and counted;
     rows whose resulting id already exists in `transactions` are treated as
     duplicates and skipped (this is what makes re-importing an overlapping
     statement safe).
6. A one-line summary reports rows added vs. skipped per file.

## Dashboard

- **Period filter**: All time / This month / Last 3 months / Last 6 months /
  Year to date. Filters everything below except the recurring-charge
  detector, which always looks at full history (a subscription 4 months old
  should still show up even if you're viewing "this month").
- **KPIs**: total spent, total income, net, top category by spend — for the
  selected period. Transfers (category `"Transfer"`) are excluded from spend
  and income totals to avoid double-counting money moved between the user's
  own accounts.
- **Spend by category**: horizontal bar chart, top 8 categories by spend,
  remainder bucketed as "Other".
- **Spend over time**: line chart. Bucketed weekly if the selected range is
  ≤90 days, monthly otherwise.
- **Recurring charges**: groups transactions by `normalizeMerchant()`,
  flags a group as recurring if it has ≥2 charges, amounts within 15% of
  the group average, and consecutive charges spaced 18–45 days apart.
  Reports average amount and annualized cost (`avg * 12`), sorted by
  annual cost descending — this is the "what can I cut" view.
- **Top merchants**: top 10 by total spend in the selected period.
- **Rules panel**: view/delete existing categorization rules, add new ones
  manually (keyword + category).
- **Transaction table**: sortable by date/description/account/category/
  amount, searchable by description text, filterable by category, category
  is editable inline per row (see data model above for what that triggers).
  Capped at 200 visible rows for performance; the count of matching rows is
  always shown so it's clear when the cap is active.
- **Export**: dumps all transactions (not just the filtered period) back out
  as a CSV.
- **Clear all data**: wipes `localStorage` after a confirm prompt.

## Non-goals (for now)

- No multi-currency handling.
- No budgets/targets — the dashboard reports what happened, not against a
  plan.
- No bank API integrations (Plaid, etc.) — CSV-only, on purpose, to keep the
  privacy model simple (no credentials, no live account access).
- No accounts/auth — this is a single-user, single-browser tool.
