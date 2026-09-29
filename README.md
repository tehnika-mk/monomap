# MonoMap

One tool, two workspaces — a keyboard-first, local-first mind map **and** kanban board. Zero bloat.

MonoMap runs entirely in your browser. Maps and boards live on your device (IndexedDB) and work offline,
with no account needed. Create a free account and subscribe to **MonoMap Pro** (€3.99/month or
€39.90/year — two months free) to sync your work across devices, or go **Studio** (€7.99/month or
€79.90/year) for version history and shareable board links. Both are billed in EUR or USD, or keep
everything 100% local forever.

![og image](static/og-image.png)

## Features

- **Mind map + Kanban** — a top-center `[🧠 Mind Map] [📋 Kanban]` switch (`Ctrl/Cmd + K`) flips between
  workspaces without reloading.
- **Infinite canvas** — pan and zoom (25–250%), drag nodes anywhere, world-anchored dotted background.
- **Speed-of-thought editing** — `Tab` to branch, `Enter` to continue, `Space` or a click/tap to edit,
  arrows to navigate, `Del` to delete. A `+` button on each node creates children too.
- **Right settings panel** — colors, emoji icons, hyperlinks, and notes per node.
- **Live Markdown split view** — type an outline on the left, watch the map build itself on the right
  (`Ctrl/Cmd + M`).
- **Kanban boards** — drag-and-drop cards and columns, labels, due dates, sub-task checklists, and instant
  filtering (`Ctrl/Cmd + F`).
- **Mind map ↔ board bridge** — send a node to a board as a card (children become checklist items), or
  generate an entire board from a branch; jump between a concept and its execution card in one click.
- **Organized workspace** — folders, multiple tabs (`Ctrl/Cmd + T` / `W`), drag-and-drop organization,
  inline rename (double-click).
- **Local-first** — autosaves to IndexedDB; export maps to `.md` / `.png`, back up the whole profile as
  `.json`, and import `.md` / `.txt` / profiles.
- **Cloud sync (Pro)** — accounts (email + password) with cross-device sync of maps and boards via
  Supabase; billed monthly or yearly through AgentaOS, in EUR or USD.
- **Version history (Studio)** — automatic map snapshots (~every 10 min while syncing), the last 25
  per map, with one-click rollback that is always reversible.
- **Shared boards (Studio)** — a read-only link (`/share/<token>`) lets anyone follow a board in
  their browser; revocable at any time.
- **Second-device nudge** — signed-in free users who open MonoMap on another device get an honest,
  one-line prompt about Pro sync (dismissible).

## Quick Start

```bash
npm install
npm run dev    # http://localhost:5173
```

`/` is the landing page, `/workspace` is the app.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run check      # svelte-check diagnostics
npm test           # unit tests
npm run test:e2e   # Playwright browser tests
```

## License / Contact

MonoMap is a product by **Tehnika**. Contact: [hello@tehnika.mk](mailto:hello@tehnika.mk) ·
[tehnika.mk](https://www.tehnika.mk)
