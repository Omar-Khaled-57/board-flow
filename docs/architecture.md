# BoardFlow architecture

## Technology stack

Versions below come from [`../package.json`](../package.json) and
[`../src-tauri/Cargo.toml`](../src-tauri/Cargo.toml).

| Layer | Technology |
| --- | --- |
| Desktop/mobile shell | Tauri 2 (`tauri`, `tauri-build` 2), Rust 2021 edition |
| Frontend | React 19, React Router 7, TypeScript 5.8, Vite 7 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`; `vite-plugin-pwa` for browser builds only |
| State | Zustand 5 with `persist`, Zod 4 schemas, `idb-keyval` and the Tauri store plugin |
| Utilities | `chrono-node` (dates), `date-fns`, `marked`, `katex`, `mathlive`, `lucide-react`, `clsx`, `tailwind-merge` |
| Native plugins | store, notification, dialog, fs, opener (all official Tauri plugins) |
| Tests | Vitest 4 + Testing Library + jsdom + fake-indexeddb; Playwright 1.60 |

## Entry points and process model

- Web entry: [`../index.html`](../index.html) mounts
  [`../src/main.tsx`](../src/main.tsx), which renders
  [`../src/App.tsx`](../src/App.tsx) in `React.StrictMode` with
  [`../src/index.css`](../src/index.css) and KaTeX CSS.
- Native entry: [`../src-tauri/src/main.rs`](../src-tauri/src/main.rs) calls
  `boardflow_lib::run()` from [`../src-tauri/src/lib.rs`](../src-tauri/src/lib.rs).
  That function registers five plugins and calls `tauri::generate_context!()`;
  there are no custom Rust commands. Rust and the webview run as one Tauri
  process pair; the frontend talks to plugins through `@tauri-apps/api`.
- `App.tsx` owns `BrowserRouter`, lazy-loads all six pages with `React.lazy`
  and `Suspense`, applies the theme via [`../src/hooks/useTheme.ts`](../src/hooks/useTheme.ts),
  requests notification permission on first launch, and dismisses the
  pre-React boot splash once all three stores report `_hasHydrated`.
  The splash markup, script and 2.5 s safety timeout live in
  [`../index.html`](../index.html).
- Router: `/` tasks, `/notes`, `/notes/:id`, `/calendar`, `/stats`, `/options`,
  `*` → `/`. See [`../src/App.tsx`](../src/App.tsx).

## Directory map

| Path | Responsibility |
| --- | --- |
| [`../src/pages/`](../src/pages) | Route screens: `Tasks`, `NotesPage`, `NoteDetails`, `CalendarPage`, `StatsPage`, `Options`. |
| [`../src/components/`](../src/components) | Shared UI: `Layout`, `TodoList`, `TaskItem`, `TaskEditor`, `NoteItem`, `PageHeader`, `SortDropdown`, badges, `UndoSnackbar`, rich insert editor and link/clip buttons. |
| [`../src/hooks/`](../src/hooks) | `useTheme`, `useNotificationScheduler`, `useDragReorder`, `useClickOutside`. |
| [`../src/store/`](../src/store) | Three Zustand stores, the storage-adapter selector, and `__tests__`. |
| [`../src/schemas/`](../src/schemas) | Zod schemas for all persisted types plus import-tolerant variants. |
| [`../src/types/`](../src/types) | `Todo`, `Note`, `Settings`, `DailyGoal` and related TypeScript interfaces. |
| [`../src/utils/`](../src/utils) | ID generation, date formatting, NLP parsing, notifications/audio helpers. |
| [`../src/test/setup.ts`](../src/test/setup.ts) | jsdom setup and Tauri API mocks. |
| [`../e2e/`](../e2e) | five Playwright specs. |
| [`../public/`](../public) | Icons and logo served by Vite. |
| [`../src-tauri/`](../src-tauri) | Rust crate, Tauri config, capabilities, generated Android project, icons and build output. |
| [`../dev/`](../dev) | Git-ignored author notes, old release packages and screenshots; not application source. |
| [`../.github/workflows/release.yml`](../.github/workflows/release.yml) | Tag-triggered Linux/Windows/Android build and GitHub release job. |

## State, storage and validation flow

1. A user action calls an action in
   [`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts),
   [`../src/store/useNotesStore.ts`](../src/store/useNotesStore.ts) or
   [`../src/store/useStatsStore.ts`](../src/store/useStatsStore.ts).
   Task and note mutations push a snapshot into `past` (capped at
   `HISTORY_LIMIT = 50`), clear `future`, and rebuild lookup indexes.
2. Indexes are plain `Map`s: tasks by list/tag/priority/ID, notes by ID.
   Components read them through selectors such as `getTodosByListId()` and
   `getNoteById()` ([`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts),
   [`../src/store/useNotesStore.ts`](../src/store/useNotesStore.ts)).
3. Zustand's `persist` middleware serialises a partialised state through
   [`../src/store/storage.ts`](../src/store/storage.ts). That module chooses
   the adapter: Tauri store plugin (`boardflow.dat`) when `window.__TAURI_IPC__`
   exists, IndexedDB via `idb-keyval` in a browser with `window.indexedDB`, or
   `localStorage` as the last resort. Each adapter swallows read/write errors.
4. On rehydration, merge functions parse persisted records with the Zod schemas
   in [`../src/schemas/index.ts`](../src/schemas/index.ts) and drop invalid
   entries. The same tolerant schemas are used for v2 backup import in
   [`../src/pages/Options.tsx`](../src/pages/Options.tsx), which reports skipped
   duplicates and invalid items.

Domain types are in [`../src/types/index.ts`](../src/types/index.ts); the
strict and importable variants are kept separate so legacy/null-valued exports
can be salvaged without weakening persisted-state validation.

## Integration boundaries

- **Files and dialogs:** `save()` from `@tauri-apps/plugin-dialog` and
  `writeTextFile()` from `@tauri-apps/plugin-fs` implement export
  ([`../src/pages/Options.tsx`](../src/pages/Options.tsx)). Android `content://`
  URIs are deliberately skipped by the FS write tier.
- **Notifications:** [`../src/utils/notifications.ts`](../src/utils/notifications.ts)
  resolves bundled icon paths with `resolveResource()` and falls back to the
  Web Notification API when Tauri APIs throw.
- **Security policy:** the Tauri window uses a restrictive CSP
  (`default-src 'self'`, inline styles and `'unsafe-eval'` allowed for scripts)
  in [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json). Plugin
  permissions and a `$DOWNLOAD/**` write scope are declared in
  [`../src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json).
- **Build/runtime switches:** [`../vite.config.ts`](../vite.config.ts) reads
  `TAURI_DEV_HOST` and `TAURI_ENV_PLATFORM`; see
  [`./configuration.md`](./configuration.md).

## Sources

- [`../src/main.tsx`](../src/main.tsx), [`../src/App.tsx`](../src/App.tsx), [`../index.html`](../index.html), [`../src/store/`](../src/store), [`../src/schemas/index.ts`](../src/schemas/index.ts), [`../src/types/index.ts`](../src/types/index.ts), [`../src-tauri/src/lib.rs`](../src-tauri/src/lib.rs), [`../src-tauri/src/main.rs`](../src-tauri/src/main.rs), [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json), [`../vite.config.ts`](../vite.config.ts), [`../package.json`](../package.json).
