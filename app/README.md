# Wjorth (v2)

The active SvelteKit rebuild of Wjorth — a local, private budgeting
dashboard. See `SPEC.md` in this folder for how it behaves, and the root
[`../README.md`](../README.md) for how this relates to the original
single-file vanilla app (`../index.html`), which is frozen as v1.

## Run it

```bash
npm install
npm run dev          # dev server, http://localhost:5173
```

To run it the way a real install would (built once, then just started —
this is also what the CSV inbox scan and JSON-state persistence need,
since they require a real Node server, not a static export):

```bash
npm run build
PORT=3000 ORIGIN=http://localhost:3000 node build
```

## Using it

1. Drop bank/card CSV exports into `data/inbox/` (created automatically on
   first run; gitignored — your financial data never gets committed).
2. Reload the dashboard. New files are offered for import with a guessed
   column mapping you can correct before confirming.
3. Imported files move to `data/inbox/processed/` so the inbox stays clean
   for your next drop-in. Re-dropping an already-imported file (even under
   a different name) is recognized by content hash and skipped.
4. All data lives in `data/state.json` — plain JSON, gitignored, easy to
   back up or inspect directly.

## Migrating from v1

Export your existing v1 data using its "Export CSV" button
(`../index.html`), then drop the resulting file into `app/data/inbox/` —
it flows through the normal import pipeline like any other bank CSV. No
separate migration tool exists or is planned.

## Stack

SvelteKit + `@sveltejs/adapter-node` (local-only — never deployed),
Tailwind v4, Chart.js, PapaParse, date-fns. Design tokens copied verbatim
from `~/Code/color-system-and-guidelines/kit.css`, following the same
integration recipe proven in `~/Code/wjeather`.
