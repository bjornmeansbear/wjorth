# Wjorth

A local, private spending dashboard. Drop in bank/card CSVs, get spend-by-
category, spend-over-time, and a recurring-charges finder — all client-side,
nothing leaves your browser.

See `SPEC.md` for how it behaves and `CLAUDE.md` for project conventions if
you're working on this with Claude Code.

## Run it

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

Everything happens in your browser. Your bank/card data never leaves your
machine — no server, no accounts, no analytics, no network calls except a
handful of pinned CDN assets (fonts, Chart.js, PapaParse) needed to render
the page. Data is stored in `localStorage`, scoped to whatever origin you
open the page from.

## Push to GitHub

From inside this folder, once you've created an empty repo to push to:

```bash
git remote add origin <your-empty-repo-url>
git push -u origin main
```

## Working on it with Claude Code

Open this folder in Claude Code (or VS Code with the Claude Code extension).
It reads `CLAUDE.md` automatically for context — architecture, conventions,
and a list of open items if you want a starting task.
