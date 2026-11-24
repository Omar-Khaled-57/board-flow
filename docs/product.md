# BoardFlow product

BoardFlow is a local-first productivity app: tasks, notes, a calendar and
completion statistics in one interface. The [README](../README.md) describes it
as a native desktop app (Windows, Linux, macOS) via Tauri that can also be
packaged for Android, with data kept on the device — no accounts, cloud or
server. The current version is `1.0.2` in
[`../package.json`](../package.json), [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json)
and [`../src-tauri/Cargo.toml`](../src-tauri/Cargo.toml).

## Problem and audience

The problem it addresses, in the author's words, is keeping task management,
notes, calendar and statistics in "one cohesive interface" without giving up
local ownership of data ([README](../README.md)). The intended audience is
anyone who wants a cross-platform personal organiser that works offline and
prefers native installers to a hosted service; the Arabic hashtag/date support
and RTL-aware CSS in [`../src/utils/nlp.ts`](../src/utils/nlp.ts) and
[`../src/index.css`](../src/index.css) point to Arabic-speaking users as a
first-class audience too.

## What it does today

| Capability | Where it lives |
| --- | --- |
| Task CRUD, lists, priorities, tags, subtasks, search/status/tag filters, sorting, drag reorder and complete/clear actions | [`../src/pages/Tasks.tsx`](../src/pages/Tasks.tsx), [`../src/components/TodoList.tsx`](../src/components/TodoList.tsx), [`../src/components/TaskItem.tsx`](../src/components/TaskItem.tsx), [`../src/components/TaskEditor.tsx`](../src/components/TaskEditor.tsx), [`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts) |
| Natural-language task entry (`tomorrow`, `!!` for high priority, Arabic terms, Unicode `#hashtags`) | [`../src/utils/nlp.ts`](../src/utils/nlp.ts), [`../src/components/NLPGuide.tsx`](../src/components/NLPGuide.tsx) |
| Notes: list tabs, search, sorting, rich insert editor, links to tasks, attachments and note detail editing | [`../src/pages/NotesPage.tsx`](../src/pages/NotesPage.tsx), [`../src/pages/NoteDetails.tsx`](../src/pages/NoteDetails.tsx), [`../src/components/RichInsertEditor.tsx`](../src/components/RichInsertEditor.tsx), [`../src/components/NoteItem.tsx`](../src/components/NoteItem.tsx), [`../src/store/useNotesStore.ts`](../src/store/useNotesStore.ts) |
| Monthly calendar grid with per-day task detail panel | [`../src/pages/CalendarPage.tsx`](../src/pages/CalendarPage.tsx) |
| Daily goal, completion streak and 7-day activity chart | [`../src/pages/StatsPage.tsx`](../src/pages/StatsPage.tsx), [`../src/store/useStatsStore.ts`](../src/store/useStatsStore.ts) |
| Options: theme/accent, behaviour toggles, daily goal and JSON export/import | [`../src/pages/Options.tsx`](../src/pages/Options.tsx), [`../src/types/index.ts`](../src/types/index.ts) |
| Undo/redo with a floating snackbar and global shortcuts | `past`/`future` snapshots in [`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts) and [`../src/store/useNotesStore.ts`](../src/store/useNotesStore.ts); [`../src/components/UndoSnackbar.tsx`](../src/components/UndoSnackbar.tsx), [`../src/components/Layout.tsx`](../src/components/Layout.tsx) |
| Native notifications for due tasks and goal achievement, with a web fallback | [`../src/hooks/useNotificationScheduler.ts`](../src/hooks/useNotificationScheduler.ts), [`../src/utils/notifications.ts`](../src/utils/notifications.ts) |
| Responsive shell: sidebar on desktop, bottom navigation on small screens | [`../src/components/Layout.tsx`](../src/components/Layout.tsx), [`../src/index.css`](../src/index.css) |
| JSON backup export and schema-validated import | [`../src/pages/Options.tsx`](../src/pages/Options.tsx), [`../src/schemas/index.ts`](../src/schemas/index.ts) |
| Brand colours and dark/light tokens | [`./visual-identity.md`](./visual-identity.md), [`../src/index.css`](../src/index.css), [`../src/hooks/useTheme.ts`](../src/hooks/useTheme.ts) |

Routes are declared in [`../src/App.tsx`](../src/App.tsx): `/` (tasks),
`/notes`, `/notes/:id`, `/calendar`, `/stats`, `/options`, with any unknown path
redirecting to `/`. Data is validated by Zod schemas in
[`../src/schemas/index.ts`](../src/schemas/index.ts) both on rehydration and on
import. Export writes a version 1 task file or a version 2 `full-backup`
payload; import of a v2 file **merges** new records by ID and keeps the current
session's settings and sort preferences
([`../src/pages/Options.tsx`](../src/pages/Options.tsx)).

## Non-goals and known gaps

- No accounts, sync service, API or server code was found. Persistence is local
  ([`../src/store/storage.ts`](../src/store/storage.ts)) and the native backend
  registers plugins only ([`../src-tauri/src/lib.rs`](../src-tauri/src/lib.rs)).
- The browser build is a fallback, not a separately deployed product: the PWA
  plugin is disabled whenever the Tauri CLI sets `TAURI_ENV_PLATFORM`
  ([`../vite.config.ts`](../vite.config.ts)), and no web hosting configuration
  is committed.
- Export has no Android share-sheet tier in the current code: on Android the
  blob download tier is skipped, so the remaining fallbacks are clipboard and
  a copyable textarea ([`../src/pages/Options.tsx`](../src/pages/Options.tsx)).
  The Android share Intent described under v1.0.0 in
  [`../CHANGELOG.md`](../CHANGELOG.md) is historical, not present in the
  current frontend.
- `bundle.targets` lists `appimage`, `deb`, `rpm`, `nsis` and `msi`, plus an
  Android project under `src-tauri/gen/android`. No macOS or iOS bundle target
  is configured, despite the macOS/iOS prerequisites listed in the README.
- No coverage report, performance metric, Lighthouse score or product analytics
  configuration is committed. `test-results/` holds a Playwright `.last-run.json`
  marker only; `coverage/` is git-ignored ([`../.gitignore`](../.gitignore)).
- `dev/` is author scratch material and git-ignored. Some of its older notes
  (for example `dev/analysis_results.md`) describe an earlier code layout and
  should not be treated as canonical; the current source and manifests are.

## Sources

- [`../README.md`](../README.md), [`../package.json`](../package.json), [`../src/App.tsx`](../src/App.tsx), [`../src/pages/`](../src/pages), [`../src/store/`](../src/store), [`../src/schemas/index.ts`](../src/schemas/index.ts), [`../src-tauri/src/lib.rs`](../src-tauri/src/lib.rs), [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json), [`../vite.config.ts`](../vite.config.ts), [`../CHANGELOG.md`](../CHANGELOG.md).
