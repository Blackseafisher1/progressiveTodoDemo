# Todo Studio

A deliberately small todo demo that is also a **progressive-enhancement blueprint**:

- **Hono** on Bun for the server
- **Hono JSX** (`.tsx`) for full pages and htmx fragments
- **Real forms and links** for every core action, so the app works with JavaScript disabled
- **htmx** upgrading those same requests into in-place swaps
- **SQLite** via `bun:sqlite` for persistence
- **Pointer Events + TypeScript** for drag reordering with mouse, touch, and keyboard
- **Per-component CSS** bundled into one stylesheet with `Bun.build`
- **TypeScript client components** bundled into one script with `Bun.build`
- **Retro UI** with a maximum border radius of 1px
- **Accessibility and SEO** treated as part of the structure, not an afterthought

The goal is readability, not feature count. There is no auth, multi-user support,
tags, or state-management library.

## Progressive enhancement contract

The same routes serve both modes. The server checks the `HX-Request` header:

| Without JavaScript | With htmx |
|---|---|
| Real `GET` links and `POST` forms | htmx intercepts the same links/forms |
| Full page render after each action | Fragment swapped into `#todo-app` |
| `303` redirect after a successful mutation | `200` with the updated panel or item |
| Full edit page at `/todos/:id/edit` | Inline edit form in the list |
| Validation error renders a full page | Validation error swaps the panel/form |
| Per-todo swap form | Drag or keyboard swap via htmx, no reload |

Core actions that work without JavaScript:

- add a todo
- toggle done
- edit a todo
- delete a todo
- filter All / Active / Done
- swap any todo by entering another title or 1-based position
- reload and use browser back/forward

Enhancements that need JavaScript:

- load the full filtered list instead of paginating
- drag-to-swap reordering
- keyboard swap with the drag handle
- inline edit without leaving the page
- toast notifications
- theme switching
- keyboard shortcuts

The ordering itself is always stored on the server. The client never keeps a
separate ordering state: a drag or keyboard swap sends two todo positions to the
server, and htmx swaps in the server's new panel without a page reload.

Those enhancements are hidden or inactive until the client bundle adds a `js` class
to `<html>`, so no-JS users never see a dead drag handle or theme button.

## Quick start

```sh
bun install
bun run seed
bun run dev
```

Open <http://localhost:3000> and follow the link to the todo app at `/app`.

The landing page is deliberately tiny so it fits without scrolling. The todo app
renders the full filtered list on one page. There is no pagination: fragment links
and redirects use `#todo-<id>` anchors to put the user back at the right todo.

`dev` builds the CSS and client bundles once, then starts the server with Bun hot
reload. Run `watch:css` and `watch:client` in separate terminals if you want the
bundles rebuilt while editing styles or client code.

To build without starting:

```sh
bun run build
```

To run the built app from a cold start:

```sh
bun run build
bun run seed
bun run start
```

## Scripts

| Script | What it does |
|---|---|
| `bun run dev` | Build bundles, then start the Hono server with hot reload |
| `bun run start` | Build bundles, then start the Hono server |
| `bun run build` | Build CSS and client JS |
| `bun run build:css` | Bundle `src/styles/main.css` into `public/styles/main.css` |
| `bun run build:client` | Bundle `src/client/app.ts` into `public/js/app.js` |
| `bun run watch:css` | Rebuild the CSS bundle on change |
| `bun run watch:client` | Rebuild the client bundle on change |
| `bun run seed` | Replace the SQLite data with eight demo todos |
| `bun run typecheck` | Run TypeScript over server, client, and scripts |
| `bun test` | Run the small unit test suite |

## Project structure

```text
src/
  index.tsx              Hono app, static files, server entry
  routes/
    pages.tsx            landing (/), app (/app), help (/help)
    todos.tsx            htmx fragments, mutations, swap endpoint
  views/
    Layout.tsx           document shell, htmx config, CSS/JS links
    Landing.tsx          tiny landing page with a link to /app
    Home.tsx             compact todo app page
    Help.tsx             standalone help page for the no-JS fallback
  components/
    TodoApp.tsx          the swap target: form + filters + stats + list
    AddTodoForm.tsx
    FilterBar.tsx
    Stats.tsx
    TodoList.tsx
    TodoItem.tsx         row + per-todo no-JS swap form
    TodoEditForm.tsx
    HelpDialog.tsx       native modal, Invoker API friendly
    HelpContent.tsx      shared modal/page content
  db/
    todos.ts             SQLite setup, queries, position swap
  lib/
    filter.ts            Filter type and URL helpers
    assets.ts            mtime-based CSS/JS cache-busting URLs
    filter.test.ts
  styles/
    main.css             imports every component stylesheet
    theme.css            light/dark design tokens
    base.css             reset, typography, buttons
    layout.css
    add-form.css
    filters.css
    stats.css
    todo-list.css
    todo-item.css
    swap-form.css
    help.css
    toast.css
  client/
    app.ts               the single client entry point
    components/
      dragSort.ts        pointer + keyboard reordering
      toasts.ts          HX-Trigger toast listener
      theme.ts           light/dark toggle + localStorage
      shortcuts.ts       "?" help, "/" focus, Escape, edit lock
scripts/
  build-css.ts
  build-client.ts
  seed.ts
public/
  styles/main.css        generated
  js/app.js              generated
  vendor/htmx.min.js     pinned local copy
```

## How the server works

### Server-rendered JSX

`src/views/Home.tsx` renders the whole page. It is composed from the components
in `src/components/`, so the same `TodoApp` component is used for the first page
load and for htmx fragment responses.

`src/routes/pages.tsx` handles the full pages:

- `GET /` renders the tiny landing page
- `GET /app` reads `?filter=` and renders all matching todos
- `GET /help` renders the standalone help page used by the no-JS fallback link

`src/routes/todos.tsx` handles the fragment and mutation routes:

| Route | htmx response | No-JS response |
|---|---|---|
| `GET /todos?filter=` | full filtered panel fragment | `303` to `/app?filter=...` |
| `POST /todos` | add, return All panel | `303` to `/app#todo-<id>` |
| `POST /todos/:id/toggle` | toggle, return current filter panel | `303` to `/app?filter=...#todo-<id>` |
| `GET /todos/:id/edit` | one item replaced by its edit form | full page with that item in edit mode |
| `POST /todos/:id/update` | save title, return the normal item | `303` to `/app?filter=...#todo-<id>` |
| `GET /todos/:id` | cancel editing, return the normal item | `303` to `/app?filter=...#todo-<id>` |
| `POST /todos/:id/delete` | delete, return current filter panel | `303` to `/app?filter=...` |
| `POST /todos/swap` | swap two positions, return panel | `303` to `/app?filter=...#todo-<id>` |

The no-JS response is the real form/link target. The htmx response is the same
route with an `HX-Request` header.

Every mutation route has a standard HTML `method` and `action` first. The `hx-*`
attributes are added on top of the same element, so the browser and htmx take the
same path through the server.

Most list-level htmx actions swap the whole `#todo-app` panel:

```html
hx-target="#todo-app" hx-swap="outerHTML"
```

That keeps the mental model simple: the server owns the list, filters, and stats.
Inline editing is the one place where only the closest `<li>` is swapped.

There is no separate Edit button. The todo title itself is the edit link: without
JavaScript it opens the full edit page; with htmx it swaps the item into the edit
form in place.

Only one inline edit can be open at a time. While the edit form is present, the
other title links are disabled for pointer and keyboard users, and clicks are
guarded before htmx receives them. Saving or cancelling re-enables the titles.

### Filters and the URL

Filter links point at real URLs such as `/app?filter=active`, so they work with
JavaScript disabled. htmx intercepts them, requests `/todos?filter=active`, and
pushes `/app?filter=active` into history. Reload and back/forward work because the
full-page route reads the same query parameter.

### Scroll restoration without JavaScript

Every todo row has a stable `id="todo-<id>"`. No-JS redirects and links include a
fragment such as `#todo-12`:

- after add, update, or swap, the `303` points at the todo that moved
- the edit page and cancel link also use `#todo-<id>`

The browser then scrolls to the affected row natively. This does not restore an
exact pixel offset, which is not possible for a POST/Redirect/GET cycle without
JavaScript, but it restores the user to the relevant todo. Normal browser
back/forward navigation still restores the browser's own exact scroll history.

Filter forms and links include `?filter=` in their real URLs, so a no-JS submit
returns to the same filtered view. For htmx requests the server falls back to
htmx's `HX-Current-URL` header if the query parameter is absent. Adding always
returns the All view, and moves the URL back to `/app` when needed, so the new
todo is visible immediately.

### Validation and errors

The `<meta name="htmx-config">` tag in `Layout.tsx` tells htmx to swap `422`
responses. Empty titles therefore return the panel (or edit form) with an inline
error instead of being ignored. Without JavaScript, the same `422` response is a
full page that either keeps the add form draft or reopens the item in edit mode
with the submitted text and an inline error.

Successful add/delete responses also send an `HX-Trigger` header:

```json
{ "toast": { "message": "Todo added", "type": "success" } }
```

The client toast component listens for that event. This is the main htmx → client
TypeScript bridge.

### SQLite

`src/db/todos.ts` creates `todo.sqlite` on first import and manages one table:

```sql
todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

`position` controls order. New todos go to the end. Deleting leaves gaps.

Reordering is a server-side **swap** of two todo positions. Every no-JS swap form
automatically carries the current todo's 1-based position and asks only for the
other todo's title or position. The server resolves the target within the current
filter (title first, then position), writes both positions in one transaction, and
redirects to the page where the first todo landed. Drag and keyboard reordering
send the same swap request using two visible positions. With htmx, the returned
panel is swapped in place and the toast appears without a full page reload; the
JavaScript-without-htmx fallback reloads.

Use `bun run seed` to reset the database to eight demo todos.

## How the client works

### One TypeScript bundle

`src/client/app.ts` is the only client entry point. It imports four small
components:

- `dragSort.ts`
- `toasts.ts`
- `theme.ts`
- `shortcuts.ts`

`scripts/build-client.ts` bundles them with `Bun.build` into `public/js/app.js`.
The page loads exactly one module script.

The first line of the client entry adds a `js` class to `<html>`. CSS uses that
class to reveal the drag handles and theme toggle, so they do not appear as dead
controls when JavaScript is unavailable.

### Drag reordering: mouse, touch, keyboard

`dragSort.ts` uses Pointer Events, so the same code handles mouse, touch, and pen.

- Drag starts only from the `⠿` handle, not the whole row.
- The handle has `touch-action: none`, so touching it does not scroll the page.
- A 6px movement threshold separates a tap from a drag.
- `setPointerCapture` keeps receiving events if the pointer leaves the handle.
- Moving the pointer highlights the todo it would swap with.
- Dragging near the top or bottom edge auto-scrolls the page while the pointer is
  held there. The swap target is recalculated as the page scrolls.
- Auto-scroll only runs when there is actually room to scroll in that direction,
  and stops at the boundary or when the pointer is released.
- On drop, the two 1-based positions are sent to `POST /todos/swap` through
  `htmx.ajax`.
- The server swaps the two positions and returns the full filtered panel.
- htmx swaps `#todo-app` in place, updates the URL, and shows the order toast.
- No full page reload is needed while htmx is available.
- If the request fails, nothing changes and an error toast appears.
- Keyboard swapping works from either the todo title link or the drag handle:
  focus one and use `ArrowUp` / `ArrowDown` to swap with the previous or next
  todo. Clicking the drag handle focuses it so the arrow keys work immediately.
- Moves are announced through a visually hidden `aria-live` status region.
- Drag is available only in the All view. Filtered lists render no handles, which
  avoids ambiguous ordering within a subset.

The client never owns the ordering state. It only chooses two server-side positions
and asks the server to swap them. Each todo's no-JS swap form is the fallback for
the same operation; all swap forms are hidden once JavaScript adds the `js` class.
The no-JS alert is a small inline badge next to the `Todos` heading, so it adds no
separate vertical block.

### Help dialog and shortcuts

- The header Help button uses the native Invoker API:
  `commandfor="help-dialog"` and `command="show-modal"`. In browsers that support
  it, the modal opens without JavaScript.
- Browsers without Invoker support get a small JS fallback when the client bundle
  loads.
- Without JS, a `Help page` link is rendered in the header. It opens `/help` in a
  new tab, so help is still reachable when the Invoker API is unavailable.
- Fixed popup dimensions would require JavaScript. No-JS users get a normal new
  tab; JS users get the in-page modal.
- The modal is a native `<dialog>` with a labelled heading and `method="dialog"`
  close buttons.
- `?` opens the help dialog when JS is available and the user is not typing in a
  field.
- `/` focuses the add input.
- `Escape` closes the dialog or cancels inline editing.
- `ArrowUp` / `ArrowDown` swaps the focused todo with the previous or next todo.

`theme.ts` only sets `data-theme` on `<html>` when there is a stored explicit
choice. If there is none, `theme.css` follows `prefers-color-scheme`, including
when JavaScript is disabled. The toggle stores the user's explicit light/dark
choice in `localStorage`; CSS variables in `theme.css` do the rest.

## How the CSS works

Each component owns a stylesheet. `src/styles/main.css` imports them all:

```css
@import "./theme.css";
@import "./base.css";
@import "./layout.css";
@import "./add-form.css";
@import "./filters.css";
@import "./stats.css";
@import "./todo-list.css";
@import "./todo-item.css";
@import "./swap-form.css";
@import "./help.css";
@import "./toast.css";
```

`scripts/build-css.ts` bundles that single entry into
`public/styles/main.css`. The page has one `<link rel="stylesheet">`, not one per
component.

`theme.css` defines light and dark design tokens. On a first visit with no stored
choice, a `prefers-color-scheme: dark` media query selects the dark tokens. An
explicit `data-theme` choice overrides that query. Component CSS uses only the
tokens, so no component needs duplicated theme rules.

The visual direction is deliberately retro: monospace type, paper/CRT palettes,
hard offset shadows, square controls, and `--radius: 1px`. No component uses a
larger radius, which keeps the 1990s terminal/print feel consistent.

## Accessibility and SEO

General structure is part of the demo:

- one `<h1>` per page and visible section headings
- semantic `header`, `main`, `footer`, `nav`, `ul`, `li`, and real forms
- skip link to `#main`
- visible `:focus-visible` outlines
- labels for every input, including visually hidden labels
- `aria-invalid` and `aria-describedby` on validation errors
- `aria-pressed` on toggle buttons, `aria-current` on active filters
- `aria-live` for stats, toasts, empty state, and reorder announcements
- keyboard-operable drag handles with `aria-keyshortcuts`
- no-JS controls are real links/forms; JS-only controls are hidden until enhanced
- descriptive page title, meta description, robots meta, and Open Graph tags
- one heading hierarchy and a meaningful document outline

## Why this design

- **Real HTML is the baseline.** Core actions are forms and links first.
- **htmx owns server state when available.** The client bundle does not manage the
  todo list.
- **JSX owns markup.** There are no client-side templates.
- **Client TypeScript owns local interaction only.** Drag, toast display, theme,
  and keyboard shortcuts are the things the server cannot do.
- **One CSS bundle and one JS bundle.** Source stays split by responsibility;
  production loads two files.

The tradeoff is a page-level swap for most actions. That is slightly less granular
than OOB swaps, but much easier to follow in a demo. Inline editing still shows
item-level swapping, and without JavaScript the browser performs a normal
POST/Redirect/GET cycle.

## Verification

```sh
bun run typecheck
bun test
bun run build
```

Manual checks worth doing:

- **With JavaScript disabled:** add, toggle, edit by clicking the todo title,
  delete, filter, paginate, and swap by title and by number; confirm each action
  reloads or redirects.
- **With JavaScript enabled:** add, toggle, edit by clicking the todo title,
  cancel, delete, drag, and keyboard swap without a full page reload; the server
  order updates in place.
- while one title is being edited, confirm every other title is disabled and a
  second edit form cannot open
- cancel or save, then confirm the title links are enabled again
- confirm the landing page at `/` fits without scrolling and only links to `/app`
- confirm the app shows all matching todos on one page with no pagination
- without JS, add/update/swap and confirm the redirect includes `#todo-<id>` and
  scrolls to that row
- filter All/Active/Done, then reload and use back/forward
- drag with a mouse
- drag with touch or browser device emulation
- drag near the top/bottom edge and confirm the page auto-scrolls; release and
  confirm scrolling stops
- swap with a todo title or drag handle focused and `ArrowUp` / `ArrowDown`
- confirm handles, the theme button, and every per-todo swap form are hidden with
  JavaScript on
- confirm each todo has a swap form without JavaScript
- confirm handles are absent in filtered views
- switch themes, reload, confirm the choice persisted
- clear the theme choice, emulate `prefers-color-scheme: dark`, and confirm the
  page starts dark; repeat with JS disabled
- submit an empty title and confirm the inline validation message
- submit an invalid swap and confirm the inline error
- navigate the page with the keyboard only, including the skip link
- click Help in the header, then close it with Escape or the Close button
- press `?` to open Help, and confirm it does not open while typing in an input
- with JS disabled, confirm the `Help page` fallback link opens `/help` in a new tab
- confirm no visual radius exceeds 1px

## Performance notes

- htmx is pinned and self-hosted, not loaded from a CDN.
- Both scripts use `defer`; CSS is the only render-blocking resource.
- `bun run build` minifies CSS and JavaScript by default. Use
  `NODE_ENV=development bun run build` to keep readable output.
- App CSS/JS links include an mtime-based `?v=` query, so they can use a long
  immutable cache safely. Rebuilding changes the URL and busts the cache.
- Vendored htmx also gets a long immutable cache header.
- There are no images in the UI, so Lighthouse alt-text audits should not apply.
  If a run reports impossible failures such as a missing `<title>` or missing
  image alts alongside a “page loaded too slowly” warning, the run was incomplete
  rather than the markup being wrong.

## Notes

- htmx is self-hosted at `public/vendor/htmx.min.js` and loaded with `defer`, so
  there is no third-party render-blocking request.
- The app binds to port `3000` by default. Override with `PORT=...`.
- Override the database path with `DB_PATH=...`.
