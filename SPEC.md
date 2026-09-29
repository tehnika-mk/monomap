# MonoMap — Application Specification

A distraction-free, local-first visual mind & note-mapping web application. The core value proposition is
cognitive flow: instant loading, speed-of-thought keyboard creation, zero UI clutter, and zero friction.

This document is the authoritative specification of the **implemented** application. The original product
requirements are covered below with the concrete build details, data model, behavior, and verification
strategy.

---

## 1. Design Philosophy

- **Chromeless canvas** — no persistent top bars or sidebars during mapping. Chrome appears only on
  interaction (a right settings panel, a collapsible sidebar, a tab bar shown only when multiple maps are open).
- **Sub-50 ms latency** — all mutations are local-first; every keystroke/drag writes to IndexedDB
  (debounced) before any (future) cloud sync.
- **Keyboard-first** — 100% of node-map operations are executable without a mouse.

## 2. Tech Stack

| Component            | Technology                         | Notes                                                              |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Frontend framework   | Svelte 5 + SvelteKit 2 (runes)     | Landing SSR + prerendered at `/`; app client-rendered at `/workspace` |
| Styling              | Tailwind CSS v4 + CSS variables    | Class-based `.dark` variant; no re-renders on theme toggle         |
| Canvas engine        | Hybrid SVG + DOM                   | DOM nodes (contenteditable); background SVG layer for Bezier lines |
| Client database      | IndexedDB via `idb-keyval`         | Debounced (150 ms) autosave, restored on boot                      |
| Static hosting       | `@sveltejs/adapter-static`         | Build output in `build/`                                           |
| Backend & sync       | _Stubbed (planned: Supabase + RLS)_| See §9 Cloud Roadmap                                              |
| Monetization         | _Stubbed (planned: Lemon Squeezy)_ | See §9 Cloud Roadmap                                              |

## 3. Data Model

### 3.1 Local state / IndexedDB schema (`workspace.serialize()`)

```ts
interface Workspace {
  version: 2;
  activeTabId: string;       // id of the active map
  openTabs: string[];        // ids of open maps
  folders: Folder[];
  maps: MapData[];
  viewMode: 'mindmap' | 'kanban';  // active workspace
  activeBoardId: string;     // active kanban board
  boards: KanbanBoard[];
}

interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

interface MapData {
  id: string;
  folderId: string | null;   // null = top level ("Maps")
  title: string;
  createdAt: number;
  updatedAt: number;
  rootNode: MindNode;
}

interface MindNode {
  id: string;
  text: string;
  position: { x: number; y: number };  // absolute canvas coordinates (center-anchored)
  style?: { color?: string; icon?: string }; // icon = unicode emoji
  notes?: string;                        // multi-line Markdown
  links?: string[];
  metadata?: { kanbanCardId?: string };  // bridge: linked execution card
  children: MindNode[];
}

interface KanbanBoard {
  id: string;
  title: string;
  sourceMapId: string | null;  // bridge: originating mind map
  columns: KanbanColumn[];
  createdAt: number;
  updatedAt: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;        // Markdown
  labels?: { text: string; color: string }[];
  dueDate?: number;            // epoch ms
  checklist?: { id: string; text: string; done: boolean }[];
  sourceNodeId?: string | null;  // bridge: originating mind-map node
}
```

- Stored under the IndexedDB key `mindmap:workspace` in `idb-keyval`'s default `keyval-store`.
- Autosave is driven by a module-scope `$effect.root` reactive effect (Svelte 5 rejects a bare module-scope
  `$effect` with `effect_orphan`). Any deep mutation of the workspace re-runs the effect, which snapshots the
  state and schedules a debounced write.
- A `flushSave()` is available for page-unload scenarios.

### 3.2 Pure utility modules

| Module            | Responsibility                                                        |
| ----------------- | --------------------------------------------------------------------- |
| `utils/id.ts`     | UUID-ish id generators (`map_…`, `node_…`, `folder_…`)                |
| `utils/tree.ts`   | `findNode`, `findParent`, `forEachNode`, `countNodes`, `insertChild`, `removeChild`, `cloneTree`, `getEdges`, `navigate` (arrow-key focus) |
| `utils/bezier.ts` | `calculateBezierPath` — rect-aware cubic Bezier; anchors the side of each node facing the other |
| `utils/bounds.ts` | `getContentBounds(root, sizes)` — world-space bounding box of a map   |
| `utils/markdown.ts`| `renderMarkdown` — small XSS-safe Markdown subset for notes preview   |
| `utils/treeExport.ts` | `mapToMarkdown`, `parseMarkdownTree`, `layoutTree`                 |
| `utils/download.ts` | `downloadText/Json/Blob/DataUrl`, `safeFilename`                    |
| `utils/exportPng.ts` | `exportMapPng` — canvas rasterization via `html-to-image`           |
| `utils/due.ts`      | `dueStatus` (overdue / soon ≤48h / ok), date input conversion, formatting |
| `utils/kanbanDrop.ts`| Pointer-drag hit-testing: `cardDropTarget`, `columnInsertIndex`   |
| `utils/kanbanFilter.ts`| `cardMatches` — keyword / label text / label color / checklist filter |
| `utils/kanbanLink.ts`| Mind Map ↔ Kanban bridge: `sendNodeToBoard`, `boardFromBranch`, `openLinkedCard`, `openNodeLocation` |
| `utils/grid.ts`     | `GRID_SPACING`, `snapToGrid`, `dragTargets` — grid snapping / drag math |
| `utils/auth.ts`     | `isExistingAccount`, `isAlreadyRegisteredError` — signup messaging   |
| `utils/syncRows.ts` | `buildSyncRows` (live rows + full-shape tombstones), tombstone resolution |
| `utils/versioning.ts`| snapshot eligibility/pruning + `countBoardCards`                    |
| `utils/reset.ts`    | `clearLocalData` — wipe local workspace/tombstones after account deletion |

## 4. Feature Specification

### 4.1 Canvas & spatial mechanics

- **Infinite canvas** with a pan/zoom transform `{ x, y, zoom }`.
- Panning:
  - **Space + left drag**, or **middle-mouse drag**, or **trackpad/wheel scroll**.
  - Space uses tap-vs-hold detection: a quick tap edits the selected node; holding (`> 220 ms`) becomes the
    pan modifier.
- Zooming: **`Ctrl/Cmd + wheel`** at the pointer, range **25% – 250%**. `Ctrl/Cmd + 0` re-centers the viewport
  on the origin.
- Node dragging uses **Pointer Events** (`pointerdown/move/up`) with `setPointerCapture`, converting screen
  deltas to world deltas by `/zoom`.
- A subtle **dotted grid** is drawn on the canvas, anchored to the world (dots move with pan and spread with
  zoom); it can be toggled from the **Preferences → Background Dots** setting. **Preferences → Snap to
  grid** makes dragged nodes snap live to the same 26px grid (off by default; persisted locally).
- **First run**: with no saved workspace, a welcome map is seeded — "Your First Map" with a central
  "Central idea" node and two children, "Node 1" and "Node 2", at different vertical positions. New maps
  (Ctrl+T / New map) start as "Untitled Map" with a single root.
- **Dynamic Bezier curves**: a background SVG layer recalculates paths in real time. Anchor points are
  chosen from the dominant direction between the two nodes, so each link exits whichever side of the parent
  faces its child (left/right/top/bottom) and enters the opposite side of the child; curves adapt as nodes
  are dragged anywhere on the canvas. Anchor offsets are computed from live node sizes registered by a
  `ResizeObserver`. Curves inherit the child's color when set.

### 4.2 Node interaction & right settings panel

Selecting a node opens a **right settings panel** (`NodePanel`, auto-opens on selection; a slim edge
button reopens it after it is closed). **Clicking (or tapping) a node immediately starts editing its text** —
a drag (≥4px) still moves the node. The selected node keeps a persistent, prominent highlight (accent ring
plus tinted background) so the active node stays clearly marked even when it has a custom color. A `+` button
in the node's corner creates a child (like `Tab`):

- **Color presets** — 6 curated dots: Default (gray) + Pastel Red `#ef4444`, Green `#22c55e`, Blue `#3b82f6`,
  Yellow `#eab308`, Purple `#a855f7`. Picking Default clears the color.
- **Icon / emoji picker** — "Add / change emoji" opens the searchable picker; "Remove icon" clears it.
- **Hyperlinks** — add/remove URLs; attached links render a `↗` badge on the node corner that opens in a
  new tab (`target="_blank" rel="noopener noreferrer"`).
- **Notes** — a plain-text multi-line area; nodes with notes show a small `📝` indicator.
- **Multiline nodes** — `Shift+Enter` inside the node text inserts a line break; `Enter` still commits and
  creates a sibling. Nodes stay single-line pills by default (text never auto-wraps); explicit newlines
  render as line breaks and nodes re-measure automatically.
- **Add child button** — a `+` button on each node (shown on hover/selection) creates a child node, exactly
  like pressing `Tab`.

### 4.3 Workspace, multi-tabs & sidebar

- **Left sidebar** (open by default; toggle with `Ctrl/Cmd + \`); its header reads **Mind Map** in the map
  workspace and **Kanban** in the board workspace:
  - **Create** group: **New map**, **New Kanban Board**, and **Import .md / .txt**. Folder creation is
    currently hidden (existing folders still render and organize maps).
  - **Mind Maps** group: tree view of loose maps; **Kanban Boards** group: the board list.
  - **Drag-and-drop** map organization (drag onto a folder header or back onto the root drop zone).
  - **Double-click a map or folder** to rename it inline.
  - Map actions menu: **Rename**, **Duplicate**, **Export .md**, **Export PNG**, **Version history…**,
    **Share by link…**, **Delete**. Clicking anywhere outside the `⋯` menu closes it (all sidebar menus
    close on an outside press).
  - Board actions menu: **Rename**, **Duplicate**, **Version history…**, **Share by link…**, **Delete**.
    **Duplicate** deep-copies columns and cards with fresh ids and clears card→node links, opening the
    copy.
  - Folder actions: **Rename**, **Delete**.
  - **MD Editor** row at the top of the menu — toggles the split-view .md editor (Mind Map workspace only;
    the Kanban workspace has no markdown editor).
  - **Account / Settings** row at the bottom opens the unified **Account & Settings** window (left nav
    rail + content pane; a bottom sheet on compact screens). Signed in it shows the user's avatar initials
    and **First Last** (falling back to the email local-part) plus a plan badge; signed out it reads
    **Account & Settings**.
    - **Profile** section (signed in): edit first name, last name and country; email is read-only. Stored
      in Supabase Auth `user_metadata` (`first_name`, `last_name`, `country`) — no schema or RLS change.
    - **Preferences** section: **Dark mode / Light mode**, **Background Dots**, **Snap to grid**,
      **Help & tutorial** (a short tabbed guide: Mind Map / Kanban / Shortcuts), and profile backup
      (**Save profile** / **Import profile** — full workspace + settings JSON).
    - **Plan & Billing** section: sync status, Free → Pro/Studio upgrade, Pro → **Upgrade to Studio**,
      receipts/renewal info, and **Cancel subscription** at period end via `billing-cancel`.
    - **Security** section: **Change password** (emails a reset link), **Danger zone** (**Delete account**,
      requiring the email to be typed to confirm), and **Sign out**.
    - Signed out, the window shows **Preferences** and an **Account** section with a
      **Sign in / Create account** call to action.
  - **Status hint** under the account row: **Local Only · Register to Sync** (signed out),
    **Registered · Upgrade to Sync** (signed in, Free), or **Registered · Sync Enabled**
    (signed in, Pro/Studio; reflects Syncing…/Offline while sync is in flight).
  - Deleting the account calls the `delete-account` Edge Function (which cancels any active subscription
    first, aborting if that fails, then deletes the auth user so every child row cascades), then wipes the
    local IndexedDB workspace, tombstones, and device markers and reloads. Receipts/invoices are emailed
    by AgentaOS on every charge — there is no in-app billing history.
  - **Sign in / create account** (auth modal) also offers **Forgot password?**, which emails a reset link.
    **Create account** collects **First name**, **Last name**, **Email**, **Country** and **Password**
    (all required) and passes the name/country as signup metadata. Both the email-confirmation link
    (after signup) and the password-reset link redirect to `/workspace`; a reset shows the **Set a new
    password** dialog in-app. Signing up with an email that already has an account reports "An account
    with this email already exists" instead of a false success. Successful sign-in, sign-up, and sign-out
    show a brief toast (bottom-center, auto-dismiss).
- **Selecting a map always switches back to the Mind Map workspace** (e.g. clicking a map in the sidebar
  while a Kanban board is open). `openTab()` sets `viewMode = 'mindmap'`.
- **Multi-tab bar** — appears at the top edge only when **> 1 map tab** is open. Supports switch, close,
  and new-tab. `Ctrl/Cmd + T` = new tab, `Ctrl/Cmd + W` = close tab.
- **Center on select** — opening a map (sidebar click, tab click, new/duplicated/imported map, or closing
  the last tab) always recenters the canvas on that map's root node at 100% zoom.
- Creating, renaming, duplicating, deleting maps/folders is fully reactive and persisted automatically.

### 4.4 Import / Export

| Format | Direction | Behavior                                                                  |
| ------ | --------- | ------------------------------------------------------------------------- |
| `.md`  | Export    | Nested outline: `# root` heading, children as indented bullets            |
| `.md`  | Import    | Headings + bullets (and plain text lines) parsed into a node tree         |
| `.txt` | Import    | Plain text lines become sibling nodes under an "Imported" root            |
| `.png` | Export    | Rasterizes the full map (all nodes + connections) at `pixelRatio: 2`      |
| `.json`| Profile   | Full workspace + settings (`Profile` object, versioned) save/import       |

`.md` imports run the **auto-sort algorithm**: children are sorted alphabetically (case-insensitive) and the
tree is laid out with a tidy, non-overlapping layout (leaves stacked, parents centered). The outline format
round-trips: `mapToMarkdown` output is re-importable by `parseMarkdownTree`.

**Profile save/import** backs up the entire local app state — workspace (maps, folders, open tabs) plus
settings (theme) — to a `mindmap-profile.json` file and restores it on import (with a confirmation prompt).

### 4.5 Theming

- Light/dark themes via CSS variables; `color-scheme` is set per theme so native controls match.
- Theme persists in `localStorage` (`mindmap:theme`); an inline script in `app.html` applies the class before
  first paint to avoid a flash.
- A sun/moon toggle row in the sidebar Preferences card; its label switches between **Dark mode** and
  **Light mode**, and the whole row is clickable.

### 4.6 Onboarding & shortcuts helper

A **keyboard shortcuts bar** sits at the bottom-center of the **Mind Map** workspace and is **always shown**
(there is no toggle). It lists the core shortcuts and shows a "Press Tab to add a node" tip while the active
map has a single node. The bar is hidden in the Kanban workspace, which has no canvas shortcuts, and on
compact/touch devices (`ui.isCompact`), where there is no physical keyboard to type them.

### 4.7 Split-screen .md editor

A toggleable **Markdown editor** docks to the left (beside the sidebar) and stays in live two-way sync with
the mind map — type an outline and nodes appear, or edit the canvas and the outline updates:

- **Toggle** from the **MD Editor** row at the top of the left menu (Mind Map workspace only) or with
  **`Ctrl/Cmd + M`**. The markdown editor is not available in the Kanban workspace.
- **Syntax** is the same nested outline as import/export: `# root` + indented `- children`. Typing a new line
  creates (or renames) nodes; deleting a line removes them.
- **Preservation**: edits are applied with an LCS-based diff-merge, so node ids, colors, icons, notes, and
  canvas positions are kept wherever possible; new nodes are placed to the right of their parent.
- **Caret-safe**: while the editor is focused it is never rewritten (undo/redo and caret stay intact);
  canvas edits and map/tab switches are pushed into the outline when it is unfocused. An empty `- ` line is a
  placeholder node so live typing round-trips.
- While the split view is open, the node-settings panel stays closed to keep the canvas clear.
- A **Re-layout** button re-runs the auto-sort/tidy layout after heavy outline editing.

### 4.8 Kanban workspace

A second, separate workspace behind a **segmented header control** at the top-center of the app:
`[🧠 Mind Map] [📋 Kanban]`. The toggle flips `workspace.viewMode` instantly (no reload); map tabs
are hidden while in kanban mode, and the active board opens automatically. `Ctrl/Cmd + K` toggles modes.
Boards are managed from a **Boards** section in the sidebar (create, click-to-open, double-click rename,
`⋯` → rename / **duplicate** / **version history** / share / delete).

- **Customizable columns**: add/rename/reorder columns (drag the `⋮⋮` grip); each header shows a live card
  count badge. **Double-click any card to rename it inline**.
- **Drag the board**: grab the empty board area and drag to pan the column strip horizontally — the board
  draws an accent highlight while it is "picked up". **Drag-and-drop cards** (pointer capture) move cards
  within a column, across columns, or reorder columns via their grip. Dragging a card shows a floating
  **full-card preview** (title, labels, description, checklist, due) following the cursor, with an insertion
  line on the card it will drop before/after — the drop index is computed against the column's **data**
  order, so it stays correct when cards are hidden by the filter or **Hide done**. Dragging a column shows a
  floating **full-column preview** (header + its cards, height-capped with a bottom fade), de-emphasizes the
  source column, and marks the insertion point with a vertical bar **between** columns. The strip
  auto-scrolls near its edges; drops outside the board area are no-ops.
- **Card attributes**:
  - Title + a **description** edited directly in the card panel (no write/preview split).
  - **Color-coded labels** — chips with auto-contrast text; a color dot picker when adding.
  - **Due dates** — a date picker; card-face badges flag *overdue* (red) and *approaching ≤48h* (amber).
  - **Sub-task checklists** — progress bar (`2/5`) on the card face and in the editor.
- **Instant filtering & search** — a live search field in the board header, top-left next to the **＋
  Column** button (`Ctrl/Cmd + F` in kanban focuses it). Case-insensitive matching over title, description,
  label text, label color, and checklist items; non-matching cards are hidden in place (`display: none`),
  with no relayout pass. `Escape` clears.
- The card editor is a right panel on desktop and a **bottom sheet** on mobile (same pattern as §4.2).
- **Board version history (Studio)** — boards are snapshotted like maps (~every 10 min while syncing, the
  last 25 per board) and restored from the board's `⋯` → **Version history…**; restoring snapshots the
  current state first so it is always reversible.
- **Board ↔ map bridge** (see §4.10 cross-workspace actions): nodes can be converted to cards, branches
  into whole boards, and either side can jump to the other with one click — the map view always centers on
  the linked node when arriving from a card.

### 4.9 Navigation recovery

- **`Ctrl/Cmd + 0`** centers the viewport on the map's first node (its current position, zoom reset to 100%),
  for when you get lost in a large workspace.

### 4.10 Cross-workspace bridge (Mind Map ↔ Kanban)

Keeps both tools synergistic without cluttering either surface:

- **Send to Kanban Board** (right node-settings panel): converts the selected node into a card — node title
  becomes the card title, child nodes become checklist items, node notes become the description. The card is
  appended to the first column of the map's linked board; if the map has none, a `<map> Board` is created
  (`sourceMapId` set). The node stores `metadata.kanbanCardId` and the card stores `sourceNodeId`. If the
  node is already linked, the action becomes **Open on Board ↗** and jumps to the existing card (no duplicates).
- **Generate Board from Branch**: the selected branch becomes a standalone board — branch title → board title,
  level-1 children → column headers, level-2 children → cards (their children → checklist items), with
  level-2 nodes linked back to their cards. A leaf branch keeps a single default **Inbox** column.
- **1-click navigation**: cards linked to a node show a **Map ↗** chip that opens the source map, centers on
  and selects the node — centering is applied once the canvas viewport is measured, so the linked node always
  lands centered (not clipped at the origin); linked nodes open their card in the board. Deleting a card
  clears the node link.

## 5. Keyboard Matrix

| Action               | Binding                    | Scope            |
| -------------------- | -------------------------- | ---------------- |
| Create child node    | `Tab`                      | Selected node    |
| Create sibling node  | `Enter`                    | Selected node    |
| Multiline node text  | `Shift+Enter`              | Editing node     |
| Edit node text       | `Space`, or click/tap the node   | Selected node |
| Navigate nodes       | `↑` `↓` `←` `→`            | Canvas (focus)   |
| Delete node          | `Delete` / `Backspace`     | Selected node    |
| Deselect / close     | `Escape`                   | Global           |
| Toggle left sidebar  | `Ctrl/Cmd + \`             | Global           |
| Toggle .md split view| `Ctrl/Cmd + M`             | Global           |
| Toggle workspace mode | `Ctrl/Cmd + K`            | Global           |
| Filter kanban cards    | `Ctrl/Cmd + F`            | Kanban view      |
| New map tab          | `Ctrl/Cmd + T`             | Global           |
| Close map tab        | `Ctrl/Cmd + W`             | Global           |
| Zoom in / out        | `Ctrl/Cmd +` / `Ctrl/Cmd −`| Canvas           |
| Center on first node | `Ctrl/Cmd + 0`             | Canvas           |
| Space (hold) + drag  | pan                         | Canvas          |

While editing node text, `Tab`/`Enter` commit and create a child/sibling; `Escape` reverts the edit and
`Shift+Enter` inserts a line break.

## 6. Project Structure

```
src/
  app.html               early-paint theme script + shell
  app.css                Tailwind v4 + CSS variable themes + markdown preview styles
                         (every font-size is `calc(<base>px + var(--font-bump))`, so one
                         `--font-bump` value scales all app/site typography)
  routes/
    +layout.ts           ssr=false, prerender=true
    +layout.svelte       global head (title, favicon)
    +page.svelte         boot splash → app shell (Canvas + chrome)
  lib/
    components/
      Canvas, ConnectionLayer, Node, Keyboard,
      NodePanel, EmojiPicker, MdPane, Toasts,
      Sidebar, TabBar, ThemeToggle, ShortcutsBar, WorkspaceSwitch,
      AuthModal, HelpModal,
      VersionHistoryModal, ShareBoardModal,
      settings/
        SettingsWindow, ProfileSection, PreferencesSection, PlanSection, SecuritySection
      kanban/
        KanbanBoard, KanbanColumn, KanbanCard, KanbanCardEditor, KanbanFilter
    actions/clickOutside.ts close popovers on an outside press
    stores/
      workspace.svelte.ts   reactive workspace state + mutations + autosave
      canvas.svelte.ts      pan/zoom, selection, editing, panel, sidebar, node sizes
      kanban.svelte.ts      card editor + filter + drag state
      theme.svelte.ts       light/dark theme + persistence
      settings.svelte.ts    background-dots + snap-to-grid preferences + persistence
      account.svelte.ts     transient Account & Settings window state (open + active section)
      toasts.svelte.ts      transient login/logout notifications
    db/idb.ts               idb-keyval load + debounced scheduleSave + flush
    db/tombstones.ts        durable, per-account deletion markers (localStorage)
    profile.ts              Profile build/parse/apply (workspace + settings backup)
    types/index.ts          data model types
    data/emojis.ts          searchable emoji corpus
    data/countries.ts       ISO 3166-1 alpha-2 country list (names via Intl.DisplayNames)
    utils/                  pure logic modules (see §3.2)
    utils/mdSync.ts         split-view engine: outlineFromTree, parseOutline, mergeTree (LCS diff)
    utils/url.ts            normalizeUrl — auto-prepends https:// when no scheme is present
  (unit tests colocated as *.spec.ts)
  routes/
    +layout.ts             prerender + csr (SSR enabled by default)
    +layout.svelte         global head (title, favicon, Google Fonts)
    +page.svelte           MonoMap landing page (SSR + prerendered at `/`)
    privacy/+page.svelte   Privacy Policy (SSR + prerendered at `/privacy`)
    terms/+page.svelte     Terms of Service (SSR + prerendered at `/terms`)
    share/[token]/         public read-only shared-board view (CSR only)
    workspace/+layout.ts   ssr = false (client-rendered app shell)
    workspace/+page.svelte the mind-map application at `/workspace`
  (app.html carries the theme pre-paint script and the Google Analytics (gtag) snippet for every page)
e2e/                       Playwright specs (canvas, node panel, md pane, landing,
                           persistence, workspace, kanban, import/export, polish, mobile)
```

### 4.11 Mobile responsiveness

- **Touch gestures**: one-finger drag pans, two-finger pinch zooms (clamped 25–250%), tapping a node edits
  its text, tap background deselects — implemented with multi-pointer tracking on the canvas.
- **Panels become bottom sheets** on small screens (≤640px): the node-settings panel, the MD editor, and the
  kanban card editor slide up from the bottom (full-width, rounded top, grab handle, safe-area padding); the
  sidebar becomes a narrower overlay with a tap-outside backdrop. The node-settings panel opens manually on
  touch devices to keep the canvas clear.
- **Kanban on mobile**: the column strip scrolls horizontally; cards drag with touch via pointer capture
  (`touch-action: none`); the card editor is a bottom sheet.
- **Compact chrome**: the sidebar is closed by default on phones; the shortcuts bar is hidden entirely (there
  is no physical keyboard), and the tab bar drops the desktop centering offset and wraps to fit the viewport
  width; touch targets (node `+` button, close/tool buttons) are enlarged on coarse pointers.
- `app.html` uses `viewport-fit=cover`; panels/bars apply `env(safe-area-inset-*)`. Desktop behavior is
  unchanged (wheel, Space, middle-drag, auto-open panels).

### 4.12 Analytics & legal

- **Google Analytics** (`G-3WDK5D21PV`) loads on every page (website and app) via the `app.html` template;
  the deployed nginx CSP allows the GA endpoints (`googletagmanager.com`, `google-analytics.com`).
- **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) are server-rendered pages styled like
  the landing; the footer links to both plus "A product by Tehnika" and `hello@tehnika.mk`.

## 7. Verification

- **Unit tests** (`npm test`, Vitest): 90 tests covering tree ops, Bezier math, Markdown renderer, tree
  import/export + bounds + auto-sort/tidy layout, the mdSync diff-merge engine, URL normalization, the
  workspace store (incl. board/column/card CRUD, move semantics, v1 restore), kanban drop-target math,
  card filtering, due-date status, and the mind-map ↔ kanban bridge.
- **End-to-end tests** (`npm run test:e2e`, Playwright + Chromium): 60 tests driving the real browser — the
  desktop suite (keyboard creation/navigation/deletion, node drag, zoom/recenter, space-pan, Bezier layer,
  right settings panel, notes, multiline, `+` child button, click-to-edit, dotted-grid toggle, sidebar/menus,
  tabs, folders, import/export, profile, split-view .md pane, persistence, theme, shortcuts, `Ctrl+0`,
  landing page incl. footer links and privacy/terms pages), a **kanban suite** (mode switch, board/column/
  card creation, card drag-and-drop, inline card rename, keyword/color filtering, node→board bridge,
  board-from-branch, map-link navigation incl. centered landing on a hidden canvas), and a **mobile viewport
  spec** covering touch pan, pinch zoom, tap-to-edit, manual node-panel open, bottom-sheet geometry, and the
  responsive sidebar.
- **Static checks**: `npm run check` (svelte-check) reports 0 errors / 0 warnings; `npm run build` produces
  the static site in `build/` — `/` is the server-rendered landing (`index.html`), `/workspace` the app
  (`workspace.html`), and `200.html` the SPA fallback.

### 7.1 Notable implementation constraints

- Svelte 5 disallows a bare module-scope `$effect` (`effect_orphan`); autosave uses `$effect.root`.
- `structuredClone` throws `DataCloneError` on `$state` proxies in Chrome — the store serializes/clones with
  explicit field reads instead.
- Reactive effect dependencies must be *read* inside the effect; cloning via `structuredClone` bypasses the
  proxy's get trap and would silently break deep-mutation autosave.
- Runes compilation applies only to `.svelte.ts` files (not plain `.ts`).
- e2e helpers target `[data-node]` elements to avoid ambiguity with the sidebar and notes-drawer, which can
  render the same text.

## 8. Getting Started

```bash
npm install          # install dependencies
npm run dev          # start the dev server (http://localhost:5173)
npm run check        # svelte-check type/lint diagnostics
npm test             # unit tests
npm run test:e2e     # Playwright browser tests
npm run build        # static build → build/
npm run preview      # serve the production build
```

## 9. Accounts, Cloud Sync & Monetization (implemented)

Accounts, cloud sync, and paid billing are implemented on top of the local-first core. Local usage
remains free forever. Two paid tiers are billed through **AgentaOS** (Merchant of Record) in EUR or USD
as chosen at checkout: **Pro** (cloud sync; €3.99 / $3.99 per month or **€39.90 / $39.90 per year** —
two months free) and **Studio** (everything in Pro plus version history and shareable board links;
€7.99 / $7.99 per month or **€79.90 / $79.90 per year**). The app is deployed live at `monomap.app`;
AgentaOS billing operates on live keys.

Account display name and country are stored in Supabase Auth **`user_metadata`** (`first_name`,
`last_name`, `country`) — set at signup and editable from the Profile section via
`supabase.auth.updateUser({ data })`. This deliberately needs no `profiles` column or RLS change, and
the values return with every session.

### 9.1 Supabase schema & RLS

- `public.profiles(user_id PK → auth.users, email, plan 'free'|'pro'|'studio', agentaos_subscription_id,
  current_period_end, cancel_at_period_end, updated_at)` — auto-created on signup via
  `handle_new_user` trigger.
- `public.user_meta(user_id PK, data JSONB, updated_at)` — workspace-wide state (folders, open tabs,
  mode, deviceId). RLS is owner-only **without** a subscription gate so free users can write their
  presence marker for the second-device nudge.
- `public.user_maps(id, user_id, title, folder_id, created_at, updated_at, map_data JSONB, deleted_at)` —
  one row per mind map; per-map sync with last-write-wins on `updated_at`.
- `public.user_boards(id, user_id, title, source_map_id, created_at, updated_at, board_data JSONB,
  deleted_at)` — one row per kanban board, same semantics.
- `public.user_map_versions(id, user_id, map_id, version int, node_count, map_data JSONB, created_at)` —
  Studio-only snapshot history; unique `(user_id, map_id, version)` where version is epoch seconds.
  RLS owner-only via `has_studio(auth.uid())`. The client caps history at 25 rows per map
  (`pruneVersionRows`).
- `public.user_board_versions(id, user_id, board_id, version int, card_count, board_data JSONB,
  created_at)` — Studio-only board snapshot history mirroring `user_map_versions`; unique
  `(user_id, board_id, version)`, RLS owner-only via `has_studio(auth.uid())`, capped at 25 per board.
- `public.shared_boards(token PK, owner_id, board_id, created_at)` — token registry for board share links.
  One active link per board (unique index). No client RLS policies at all — every access goes through
  the `share` Edge Function with the service role.
- `public.shared_maps(token PK, owner_id, map_id, created_at)` — the same token registry for mind-map
  share links (unique index on `map_id`); service-role only via the `share` Edge Function.
- Entitlements: `has_active_subscription(uid)` accepts plans `pro`/`studio` with a valid period;
  `has_studio(uid)` requires plan `studio`. Sync tables (`user_meta`, `user_maps`, `user_boards`) gate
  on `has_active_subscription`; `user_map_versions` and `user_board_versions` gate on `has_studio`.
  Profiles are read-only to
  the client; all plan grants/downgrades happen server-side through the Edge Functions via the service
  role, which bypasses RLS.

### 9.2 Client architecture

- `src/lib/supabase.ts` — Supabase client; `PlanId`/`PaidTier` types; `isPro` (true for both paid
  tiers) and `isStudio` entitlement helpers.
- `src/lib/stores/auth.svelte.ts` — session, profile, sign-in/up/out, `startCheckout(tier, plan,
  currency)`, deep-link upgrade intent (`pendingUpgrade` + `pendingUpgradeTier`).
- `src/lib/stores/sync.svelte.ts` — debounced cloud sync: pushes serialized maps/boards/meta as upserts
  (with tombstones for deletions), pulls on sign-in/reconnect, merges per-row by `updated_at`
  (last-write-wins), and seeds the cloud from local on first sign-in. `utils/syncRows.ts` builds live
  rows and tombstones as separate payloads (tombstones are padded to every NOT NULL column so the bulk
  upsert cannot be rejected). Deletions are recorded synchronously in `db/tombstones.ts` (localStorage,
  scoped per account) at delete time and by diffing local state against known cloud ids, so a delete
  survives an immediate refresh even if the debounced push has not run. On pull, a pending tombstone
  newer than a remote live row keeps it deleted until the cloud confirms it. Meta carries a `deviceId`;
  free users get a one-shot presence ping whose cross-device result drives the dismissible sidebar
  nudge ("Your maps are on your other device…").
- `src/lib/db/idb.ts` — debounced IndexedDB autosave, flushed synchronously on `pagehide` and when the
  document becomes hidden so changes made just before a refresh/close are not lost.
- `src/lib/stores/versions.svelte.ts` — Studio snapshot engine: after each successful push, changed
  maps older than 10 minutes since their last snapshot are captured (`shouldSnapshotMap`); restores
  force a snapshot of the current state first, then `workspace.restoreMapSnapshot()` (bumps
  `updatedAt` so LWW propagates).
- The local IndexedDB store remains the always-on source of truth; cloud is a gated mirror. Everything
  keeps working offline and unsigned-in.

### 9.3 AgentaOS billing (Merchant of Record)

- `supabase/functions/create-checkout` — authenticated users get a checkout routed to one of eight
  AgentaOS payment links by `tier` (`pro` | `studio`), `plan` (`monthly` | `annual`) and `currency`
  (`EUR` | `USD`); carries `metadata.userId` and `metadata.tier`; missing link secrets fall back to
  pro-monthly-EUR.
- `supabase/functions/agentaos-webhook` — verifies the HMAC-SHA256 signature, and on
  `checkout.session.completed` grants the tier from checkout `metadata.tier`, else detects it by
  mapping the subscription's link/product id against the configured payment-link secrets
  (`TIER_BY_LINK`), defaulting to `pro` with a logged warning. Links payments to accounts via
  `metadata.userId` (in-app checkouts) or buyer email; returns 200 when no account exists yet.
  When the granted account holds another active subscription of a different product (e.g. Pro →
  Studio switch), the old one is parked cancel-at-period-end via the gateway API.
- `supabase/functions/billing-cancel` — cancels a subscription at period end (`atPeriodEnd: true`); the
  reconcile job downgrades the profile once the paid period ends.
- `supabase/functions/reconcile-subscriptions` — scheduled job over profiles in `('pro','studio')`:
  re-grants the detected tier (renewals, tier changes, period-end drift) or downgrades to `free`.
- `supabase/functions/share` — Studio share links for boards **and** mind maps. Authenticated actions
  `create`/`get`/`revoke` take `{ kind: 'board' | 'map', id }` (owner must be studio-active; one token per
  entity); public action `resolve` maps a token to the board or map payload only while the owner's Studio
  entitlement is valid, so links die on lapse. Consumed by `/share/[token]` (client-rendered read-only
  board view, or a static fit-to-view mind map). CORS must allow `apikey` and `x-client-info`.
- Payment amounts/currencies live as AgentaOS payment links referenced by Edge Function secrets:
  `AGENTAOS_PRODUCT_ID` (Pro EUR monthly), `AGENTAOS_PRODUCT_ID_ANNUAL`, `AGENTAOS_PRODUCT_ID_USD`,
  `AGENTAOS_PRODUCT_ID_ANNUAL_USD`, plus `AGENTAOS_PRODUCT_ID_STUDIO`,
  `AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL`, `AGENTAOS_PRODUCT_ID_STUDIO_USD`,
  `AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL_USD`.
- **Status**: integration is **live** — real charges on `sk_live_*` keys, webhook + cancel + reconcile all
  operating in production. Live API key and webhook secret are set as Edge Function secrets; do not commit
  them.

### 9.4 Client env

- `.env` needs `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. Edge Function secrets (never
  client-side): `SUPABASE_SERVICE_ROLE_KEY`, `AGENTAOS_API_KEY`, `AGENTAOS_WEBHOOK_SECRET`, and the
  eight `AGENTAOS_PRODUCT_ID*` link ids listed in §9.3.

### 9.5 Auth URL configuration (required)

The confirmation and password-reset emails redirect to `${origin}/workspace`, but Supabase falls back to
its **Site URL** when a template uses `{{ .SiteURL }}`. If the Site URL is left at a development default
(`http://localhost:3000`), every new customer's confirmation link lands on a dead page. Required
dashboard state:

- **Authentication → URL Configuration → Site URL**: `https://monomap.app`
- **Redirect URLs**: must include `https://monomap.app/**` (keep localhost entries for dev only)
- **Email templates**: the confirmation (and reset) template links must use `{{ .ConfirmationURL }}`,
  not `{{ .SiteURL }}`
- Verify after changing: sign up with a throwaway address on production and click the emailed link.

### 9.6 Production nginx

The live site's nginx `Content-Security-Policy` **must** allow the Supabase origin or every auth/sync
request is blocked by the browser ("NetworkError when attempting to fetch resource"). Add to `connect-src`:

```
https://<project-ref>.supabase.co wss://<project-ref>.supabase.co
```

`deploy/nginx.conf.example` already includes this; ensure the live server's actual vhost does too, then
`nginx -s reload`. The deployed `build/` must be the cloud-enabled build (the public/local-first build has
no accounts UI).
