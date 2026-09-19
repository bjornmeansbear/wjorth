# Wjorth

A local, private budgeting dashboard. Drop in bank/card CSVs, get
spend-by-category, spend-over-time, zero-based budgeting, recurring-charge
detection, and necessity tagging (essential/discretionary/wasteful) — all
local, nothing leaves your machine.

This repo has two tracks:

- **`app/`** — the active SvelteKit rebuild (v2). This is where development
  happens now: zero-based budgeting, necessity tagging, multi-year view, a
  CSV inbox you drop files into instead of a file picker, JSON-file
  persistence instead of `localStorage`. See [`app/README.md`](app/README.md)
  and [`app/SPEC.md`](app/SPEC.md).
- **`index.html`** — the original single-file vanilla-JS app (v1), **frozen**
  as a working reference/fallback. Still fully functional; not receiving new
  features. See `SPEC.md` (this folder) and `ARCHITECTURE.md` for how it
  works.

If you're picking this up fresh: use `app/`, not `index.html`, unless you
specifically need the zero-dependency single-file version.

## Run it

**v2 (`app/`, active development):**

```bash
cd app
npm install
npm run dev
```

**v1 (`index.html`, frozen reference):**

No build step, no dependencies to install.

```bash
# just open it
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# or serve it, if you'd rather use localhost than file://
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Privacy

Your bank/card data never leaves your machine — no server, no accounts, no
analytics. v1 (`index.html`) runs entirely in the browser, storing data in
`localStorage`; v2 (`app/`) runs a local Node server (needed to scan the
CSV inbox folder and read/write its JSON state file) but still never makes
a network call with your data — the only outbound requests either version
makes are to pinned CDN/font assets needed to render the page.

## Working on it with Claude Code

Open this folder in Claude Code (or VS Code with the Claude Code extension).
It reads `CLAUDE.md` automatically for context — architecture, conventions,
and a list of open items if you want a starting task. `app/` has its own
`SPEC.md` for v2-specific conventions.
