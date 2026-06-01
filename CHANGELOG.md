# BoardFlow Changelog

A running log of every change, fix, and decision during development.

---

## v0.8.1 — Android Export JNI Fix, Responsive Date/Time & UI Cleanup

**Focus**: Fix Android export root cause (JNI class loading), make date/time picker layout fully responsive, remove duplicate date labels.

### 🐛 Bug Fixes
- **Android export JNI class loading** — `env.find_class()` from a native async thread uses Android's system class loader which cannot find `MainActivity`. Fixed by using the application context's `getClassLoader().loadClass()` instead, resolving the months-old workaround into a proper fix.
- **Android storage permissions** — Added `WRITE_EXTERNAL_STORAGE` and `READ_EXTERNAL_STORAGE` (maxSdkVersion=28) to `AndroidManifest.xml` for Android 6–9 compatibility. Kotlin `saveToDownloads` now checks permissions at runtime and returns a descriptive error code.
- **Android export error reporting** — Kotlin `saveToDownloads` now returns `String` error codes (`ERR_PERMISSION_DENIED`, `ERR_FILE_NOT_FOUND`, `ERR_INSERT_FAILED`, `ERR_EXCEPTION`) instead of a plain boolean. Frontend shows contextual messages per error type.
- **Android MediaStore fallback** — Added `MediaStore.Files` fallback URI if `MediaStore.Downloads` is unavailable on some devices.
- **Horizontal scroll in Task container** — Root cause was absolutely-positioned cross-fade divs escaping their parent bounds on wider screens. Fixed by adding `position: relative` to the content wrapper (`TaskItem.tsx:227`), establishing a containing block so the existing `overflow-hidden` actually constrains absolutely-positioned children.

### ✨ UI Improvements
- **Date/Time pickers now fit on one line** — Removed `flex-wrap` from the date-time row in `TaskItem.tsx`. Changed inputs from fixed `w-28` to `min-w-0 w-20 sm:w-28` so they auto-shrink on small screens. Layout works on mobile portrait, mobile landscape, tablet, and desktop.
- **Removed duplicate date labels** — When a time is selected, the additional parsed-date text label next to the Time Picker is no longer displayed. The date lives only in the Date Picker field; the time lives only in the Time Picker. The underlying `dueDate` value is still stored correctly as a combined timestamp.

### ♿ Accessibility & Security
- **Form field names added** — Added missing `name` attributes to all major form fields across 6 files: TaskItem, TaskEditor, Tasks, Options, NoteDetails, NotesPage.
- **CSP `'unsafe-eval'` allowed** — Added `'unsafe-eval'` to CSP `script-src` in `tauri.conf.json` for dependencies that require it (chrono-node, marked).
- **Label-input association** — Fixed unassociated `<label>` in TaskItem edit mode (`List:` dropdown) by wiring `htmlFor` / `id` with the task's unique ID. Fixed daily goal input in Options by adding `htmlFor="dailyGoal"` / `id="dailyGoal"`.

### 🧹 Changes
- Version bumped to 0.8.1

---

## v0.8.0 — Android Build Fix, Chunk Splitting & Unit Tests

**Focus**: Fix Android build broken by Tauri 2.11.2 API change, optimize bundle size, add unit test infrastructure.

### 🐛 Bug Fixes
- **Android build fixed** — `app.env().android_app` was removed from Tauri's `Env` struct in v2.11.2; replaced with `ndk_context::android_context()` which provides `vm()` and `context()` raw pointers for JNI access. Added `ndk-context = "0.1"` to Cargo.toml. The `save_impl()` function was refactored into two platform-specific implementations to eliminate unreachable code warnings.

### 🚀 New Features
- **Per-notification icon support** — `sendNativeNotification()` now accepts an optional third `iconName` parameter; resolved via `resolveResource()` with a per-name cache
- **Goal notification icon** — daily goal reached notification now bundles `icons/Notifications/target.png` as its icon resource
- **Unit test suite** — vitest + @testing-library/react + jsdom + fake-indexeddb; 25 tests across 3 files covering `generateId`, `useTodoStore` (13 tests), and `useNotesStore` (8 tests). Tauri APIs mocked via `vi.mock()` in the setup file.

### ✨ UI Improvements
- **Task reminder** — title changed from `"Task Due Soon"` → `"Upcoming Deadline"`, body changed from `<title>` → `"Don't forget: '{title}' is due soon."`
- **Goal achieved** — title changed from `"Daily Goal Reached!"` → `"Goal Achieved 🎯"`, body changed from `"You have completed all your tasks for today. Great job!"` → `"All tasks completed for today. Nice work."`

### 🧹 Changes
- **Bundle optimization** — main JS chunk reduced from 1,535 KB → 211 KB using `manualChunks` splitting (vendor-react, vendor-katex, vendor-utils). `mathlive` is now dynamically imported on-demand (822 KB lazy-loaded only when user opens the math editor). All 6 page routes are lazy-loaded via `React.lazy()` + `Suspense`. Chunk warning limit raised to 1000 KB.
- Version bumped to 0.8.0
- Added `icons/Notifications/target.png` to Tauri `bundle.resources` in `tauri.conf.json`
- `src/utils/notifications.ts` — `resolveIcon` now takes an icon name parameter, caches results per name
- `src/hooks/useNotificationScheduler.ts` — updated notification title and body strings
- `src/store/useStatsStore.ts` — updated notification title, body, and passes icon name
- Added `ndk-context = "0.1"` to Cargo.toml for Android JVM/activity access
- `src-tauri/src/save_to_downloads.rs` — rewritten to use `ndk_context::android_context()`, separated into platform-specific `save_impl` functions
- Added vitest, @testing-library/react, @testing-library/jest-dom, jsdom, fake-indexeddb dev dependencies
- Created `vitest.config.ts`, `src/test/setup.ts` with Tauri API mocks
- Added `npm run test` and `npm run test:watch` scripts

## v0.7.9 — E2E Testing, Delete Animation Fix & Editable Notes Lists

**Focus**: Stabilize the UI with E2E tests, fix the delete-task animation glitch, and make list management consistent across Tasks and Notes.

### 🧪 E2E Testing
- **Playwright installed** — Chromium browser downloaded and configured for E2E testing
- **24 E2E tests** covering Tasks CRUD, Notes CRUD, Export/Import, Undo/Redo, and Theme switching; all ✅ passing
- **playwright.config.ts** — configured with dev server auto-start, single worker, chromium project

### 🐛 Bug Fixes
- **Delete-task animation jump glitch** — removed conflicting CSS `animate-task-exit` animation that caused a double-animation (exit collapse + FLIP) when deleting a task. Deletion now relies entirely on `useDragReorder`'s FLIP effect for smooth sibling transitions while the removed element simply disappears.

### 🚀 New Features
- **Editable and deletable list tabs in Notes page** — Notes page list panel now mirrors the Tasks page: per-list rename (`Edit2`) and delete (`Trash2`) buttons with the same animated expand/collapse reveal, inline rename input with Save/Cancel, and new list creation input with Add button

### 🧹 Changes
- Version bumped to 0.7.9

## v0.7.8 — Storage Infrastructure, Android Export Fix & Import Merge

**Focus**: Replace raw JSON/localStorage with typed schemas, IndexedDB, repository layer, command-pattern history, and fix Android export reliability.

### 🚀 New Features
- **Zod schemas** (`src/schemas/index.ts`) — runtime validation for all persisted types (Todo, Note, Settings, Tag, TaskList, Subtask, NoteAttachment, DailyGoal) with enum schemas and full store schemas; enables data integrity guarantees
- **IndexedDB persistence** (`src/storage/storage.ts`) — primary storage backend via `idb-keyval` replaces localStorage for larger quota and reliability; automatic fallback if IndexedDB is unavailable
- **Migration framework** (`src/storage/migrations.ts`) — schema versioning (`CURRENT_STORAGE_VERSION = 2`), version get/set in IndexedDB, `runMigrations()` with per-version functions for future-proof data migrations
- **Command-pattern history** (`src/storage/history.ts`) — `History` class stores operations (patches) instead of full snapshots, with batch support, configurable limit, serialization; more memory-efficient than snapshot approach
- **Repository layer** (`src/storage/repositories/*.repository.ts`) — tasks, notes, settings, and stats repositories abstract storage access behind typed CRUD interfaces with in-memory caching and cache invalidation
- **Precomputed store indexes** — `useTodoStore` now builds `todoIndexes` (byListId, byTag, byPriority, byId Maps) and `useNotesStore` builds `noteIndexes` (byId Map) on every mutation and on hydrate, providing O(1) lookups via `getTodosByListId()`, `getTodosByTag()`, `getTodoById()`, `getNoteById()`
- **Memoized derived state** — `useStatsStore` exposes `getTodayGoal()` and `getTodayCompletion()` computed from raw dailyGoals record

### 🐛 Bug Fixes
- **Android export not saving** — `save()` dialog returns a `content://` SAF URI on Android that `writeTextFile` cannot reliably persist to a user-accessible location. Fixed: added a custom Rust command `save_to_downloads` that writes JSON to app cache, then on Android uses JNI to call a Kotlin `saveToDownloads` method that inserts the file into `MediaStore.Downloads` (no storage permissions needed). On failure, falls back to a copy-paste textarea.
- **Missing `store:default` capability** — `tauri-plugin-store` was declared in Cargo.toml and imported in the frontend but its permission was absent from `default.json`, causing all data persistence to silently fail in Tauri mode
- **Missing FS scopes** — `fs:allow-write-text-file` without path scopes prevented the FS plugin from resolving `$DOWNLOAD` on Android
- **Android manifest XML namespaces** — duplicate `xmlns:tools` declaration and wrong namespace URIs (`http://android.com` instead of `http://schemas.android.com/apk/res/android`, `http://github.com` instead of `http://schemas.android.com/tools`) would cause Android build failure; rolled back to clean manifest
- **`jni` crate added** — added `jni = "0.21"` dependency to Cargo.toml for JNI calls from Rust to Kotlin on Android

### 🚀 New Features
- **Full backup export** — new "Full backup" option in the export dropdown produces a v2 payload containing all todos, notes, tags, lists, settings, stats (daily goals + streaks), and sort preferences. Filename format: `boardflow-full-backup-YYYY-MM-DD.json`.
- **Import restores everything** — v2 full-backup files restore all data via `setState` on each store, preserving all IDs and relationships (task↔list, note↔list, note↔task linking through `linkedTaskId`, tag IDs, subtask arrays, attachment metadata, timestamps). Legacy v1 per-list task imports continue to work unchanged.
- **Exported `buildTodoIndexes` and `buildNoteIndexes`** — store index builders are now exported from `useTodoStore.ts` and `useNotesStore.ts` so the import can rebuild lookup indexes immediately after restore.

### 🧹 Changes
- Added `zod` and `idb-keyval` dependencies
- Added `jni = "0.21"` to Cargo.toml for Rust-to-Kotlin bridge on Android
- Created `src-tauri/src/save_to_downloads.rs` — custom Tauri command that writes to app cache and on Android copies to `MediaStore.Downloads` via JNI; on desktop copies to user's Downloads folder
- Added `saveToDownloads` companion method to `MainActivity.kt` — Kotlin method called from Rust via JNI, inserts file into `MediaStore.Downloads` using ContentResolver (no storage permissions required)
- Updated `src/store/storage.ts` to use IndexedDB via `idb-keyval` as primary adapter, with Tauri store and localStorage as fallbacks
- `persist` middleware merge callbacks rebuild indexes on hydrate to ensure consistency between persisted and in-memory state
- Version bumped to 0.7.9
- Added `@playwright/test` and `playwright` dev dependencies
- Created 5 E2E test files in `e2e/` with 24 tests
- Removed `animate-task-exit` CSS class and `task-exit` keyframes from `index.css`
- Removed `isExiting` state and `setTimeout`-based deletion delay from `TaskItem.tsx`

## v0.7.8 — Storage Infrastructure, Android Export Fix & Import Merge

**Focus**: Extract duplicated patterns into shared hooks, components, and utilities across the entire app.

### 🧹 Changes
- **Extracted `useClickOutside` hook** — replaced 4+ inline `useRef`+`useEffect` click-outside patterns (SortDropdown, NoteLinkButton, NoteClipButton, RichInsertEditor)
- **Extracted `useDragReorder` hook** — consolidated drag-to-reorder logic duplicated across TodoList and NotesPage into a single reusable hook with FLIP animation support
- **Extracted `useTagSuggestions` hook** — unified tag suggestion filtering logic used in TaskEditor, NoteDetails, and Tasks
- **Created shared UI components** — `PageHeader`, `EmptyState`, `ToggleSwitch`, and `Badge` (DateBadge, TimeBadge, PriorityBadge, TagBadge, MetaDate) replacing 30+ inline duplications across 5 pages
- **Consolidated `generateId`** — moved from per-store inline logic into `src/utils/id.ts` shared utility
- **Added undo/redo to NotesStore** — notes store now supports undo/redo (was missing before), matching TodoStore's pattern
- **Optimized store selectors** — replaced inline `useMemo` wrappers with direct selector access; removed `compareField` utility in favor of inline sort logic
- **Fixed infinite re-render in `useDragReorder`** — removed redundant `setState` call that created a new object on every render when `draggedId` was null, causing a React bail-out loop

## v0.7.0 — Notes System

**Focus**: Full notes subsystem with dedicated pages, rich editing, tag & list integration, and task linking.

### 🚀 New Features
- **Notes page** — new `/notes` route with the same shared Lists system as Tasks, search (title, tags, content), and sort controls (Date Added, Updated, Title, Tags)
- **NoteDetails page** — full note viewer/editor at `/notes/:id` with top bar (back, edit, delete), inline editing with tag management, and floating action buttons
- **NoteItem component** — structured card layout: title + edit/delete actions + creation/edit metadata, primary-colored divider, 2–3 line content preview with "...", and tags section
- **Rich Insert Editor** — floating inline editor (triggered by "+" button) for inserting primary-colored text, highlighted text, inline #tags, clickable links (display name + URL), and math equations
- **Note linking** — link a note to a task via a dropdown of all tasks; shows linked status and supports unlinking
- **File attachments** — attach images, videos, or documents to notes via the Paperclip button with file picker integration
- **Navbar integration** — Notes tab positioned between Tasks and Calendar using the `NotebookPen` lucide icon; mobile nav updated to 5-column grid

### 🧹 Changes
- Added `Note`, `NoteAttachment`, and `NoteSortField` types to the shared type system
- Created `useNotesStore` (Zustand + persist) for notes CRUD, sort preferences, and attachment management
- Mobile bottom nav grid updated from `grid-cols-4` to `grid-cols-5` with adjusted indicator calculations

## v0.6.0 — Custom Dropdowns, Calendar Picker, RTL Support & More

**Focus**: Custom dropdown menus, in-flow calendar picker, tag autocomplete from todos, logical CSS properties for RTL/LTR compatibility.

### 🚀 New Features
- **Sorting options** — new sort controls on the Home page header: sort by Name, Date Added, Due Date, Priority, or Tags, with ascending/descending toggle
- **Task List dropdown in edit mode** — change a task's list assignment directly in the inline editor via a custom dropdown menu with CSS transitions
- **Time input in edit mode** — native `<input type="time">` picker alongside the date input, merges time into the dueDate timestamp
- **Tag suggestions** — when typing `#`, the app suggests tags from the union of the tag library + tags actually used in todos, with keyboard navigation (arrows, enter, escape); available in both TaskItem and TaskEditor
- **Calendar picker** — in-flow mini calendar grid (month/year nav, day grid) that expands the task item to push subsequent items down, replacing quick-select date buttons
- **Arabic NLP support** — recognizes Arabic date/time terms: بكرة/بكره (tomorrow), الصبح/الصباح (morning), المساء (evening), بليل (night)
- **Proactive notification permissions** — requests notification permissions on first app launch instead of waiting until the first scheduled notification
- **Persistent list selection** — the app remembers the last selected task list across sessions

### ✨ UI Improvements
- **Lists panel overhaul** — "All Tasks" and "No List" tabs are now always visible in the lists panel with consistent styling
- **Independent tag filter** — clicking a tag to filter now uses a dedicated tag filter state, separate from the search bar, so you can search for text within filtered tags
- **Custom SortDropdown** — reusable custom select component replacing native `<select>` for sort field; opacity/scale CSS transitions, keyboard nav, outside-click close
- **List dropdown stylized** — custom button + dropdown replacing native `<select>` in edit mode; same transition pattern as SortDropdown
- **Sort controls position** — moved sort field and direction toggle from header into inline with the task list title, styled as bold glowing primary text with `drop-shadow-[0_0_4px_var(--color-primary)]`
- **Clock icon (view mode)** — clock icon now uses primary color via `text-primary` class
- **Pulse animation** — restored to original 3s speed; idle delay shortened by moving fade-out completion earlier in keyframes (inner 88%, outer 70%)
- **Navigation icon updated** — replaced Home icon with ClipboardList for the Tasks nav item
- **RTL/LTR logical CSS properties** — migrated all directional CSS to logical equivalents across the entire codebase: `left`/`right` → `start`/`end`, `border-l`/`border-r` → `border-s`/`border-e`, `rounded-l`/`rounded-r` → `rounded-s`/`rounded-e`, `pl-`/`pr-` → `ps-`/`pe-`, `ml-`/`mr-` → `ms-`/`me-`, `text-left` → `text-start`, `origin-top-left`/`origin-top-right` → `origin-inline-start`/`origin-inline-end`
- **Sort UI** — compact sort field dropdown and direction toggle added to the home page header
- **Code comments** — added descriptive section comments to Layout.tsx, Home.tsx, TaskEditor.tsx, and index.css

### 🐛 Bug Fixes
- **Android export** — fixed `__TAURI_IPC__` detection for reliable platform check; on Android, if the save dialog fails, shows a clear error message instead of attempting an unsupported blob download
- **Hyphen NLP handling** — removed `-` from flexible date separator regex so hyphens in task titles are preserved rather than treated as date delimiters
- **Duplicate TodoList blocks** — consolidated two conditional `TodoList` render blocks that caused layout duplication
- **Mobile navbar full width** — reverted `inset-inline-0` to physical `left-0 right-0` on mobile bottom nav for Android WebView compatibility; same fix applied to indicator bar (`inset-inline-0` → `inset-x-0`) and its positioning/transition properties
- **Desktop sidebar indicator broken** — reverted logical CSS properties (`start-3 end-3`, `inset-block-0 start-0`, `rounded-e-3xl rounded-s-none`) to physical equivalents (`left-3 right-3`, `inset-y-0 left-0`, `rounded-r-3xl rounded-l-none`) to restore the active page highlight in landscape mode

### 🧹 Changes
- Added `lastActiveListId`, `sortField`, `sortDirection` to `Settings` type with defaults
- Created `SortDropdown.tsx` as reusable custom select component
- Created `dev/tstl8r.md` test-later checklist
- **Sidebar state persisted** — added `sidebarExpanded` to `Settings` type with default `true`; the sidebar's collapsed/expanded state now persists across sessions via `updateSettings`
- Version bumped to `0.6.0`

## v0.5.2 — Android Export Fix

**Focus**: Replace browser blob-download with Tauri native save dialog + fs plugin so export works on Android.

### 🚀 New Features
- **Daily goal notification** — `sendNativeNotification` fires when `completedCount` reaches the daily goal, with a congratulatory title and body. Uses existing notification infrastructure (Tauri native on mobile/desktop, Web Notification API fallback in browser).
- **Version display** — app version shown on the splash screen (under title) and at the bottom of the Options page.

### 🐛 Bug Fixes
- **Export broken on Android** — `Blob` + `<a download>` doesn't work in Android WebView; replaced with `@tauri-apps/plugin-dialog` (`save()`) and `@tauri-apps/plugin-fs` (`writeTextFile()`). Falls back to blob download in browser mode.
- **Export cancelled state** — now shows "Export cancelled." message when the user dismisses the save dialog without selecting a file.
- **Export fallback chain** — extracted `tryFallbackDownload` helper; if Tauri write fails, falls back to blob download, then to JSON textarea.

### 🧹 Changes
- Added `tauri-plugin-dialog` and `tauri-plugin-fs` (npm + Cargo) with `dialog:allow-save` and `fs:allow-write-text-file` capabilities
- Version bumped to `0.5.2`
- **Clear Stats confirmation layout** — responsive flex: landscape uses `flex-row justify-between` (text left, buttons right); portrait uses `flex-col` with buttons at right bottom via `self-end`

## v0.5.0 — UI Polish, Animation Control & Readability

**Focus**: Refine overachiever glow animation, add saturated accent color variable, improve checked task readability, fix dark mode class mismatch, drag ghost portal, consistency review.

### ✨ UI Improvements
- **Pulse ring choreography** — redesigned inner/outer ring keyframes so outer leads contraction while inner holds at peak, then both share a rest gap before the next pulse; inner ring stroke increased to 5 for better visibility
- **Saturated accent color** — introduced `--color-primary-saturated` (channel+46, capped at 255) computed in `useTheme.ts` from the user-chosen accent, used for the inner pulse ring
- **Checked task item styling** — light mode: `#E7EBEF` bg + `#6B7280` text; dark mode: `#1A1F26` bg + `#9AA4B2` text; reduced dimming (opacity 80 container, opacity 60 meta row)
- **Dark mode hover glow** — uncompleted task items get `#252B33` background with accent-colored shadow in dark mode
- **Clear Stats button** — light mode uses `#EF4444`/`#FEE2E2`/`#B91C1C` palette, container border is always present for smooth width transitions
- **SVG viewBox** — expanded to `-5 -5 110 110` so outer pulse ring (r=48 + stroke 7) is never clipped

### 🐛 Bug Fixes
- **Dark mode class mismatch** — added `@custom-variant dark (&:where(.dark, .dark *))` so Tailwind's `dark:` utilities follow the app's `.dark` class toggle instead of `prefers-color-scheme`, fixing inconsistent rendering when system preference differs from app theme
- **Drag ghost positioning** — portaled to `document.body` via `createPortal` to escape ancestor containment; both `pointerDown` and `pointerMove` now use identical zero-offset `clientX/Y` so the ghost tracks the cursor consistently
- **Hover glow clipped** — removed `overflow-hidden` from task card containers in `Home.tsx` so the dark mode hover shadow isn't cut off at the card boundary
- **Tauri stale frontend** — documented fix: clear `dist/`, `node_modules/.vite/`, and `src-tauri/target/` before `npm run tauri build`

### 🧹 Changes
- Changed `productName` in `tauri.conf.json` to `BoardFlow` (exe name → `BoardFlow.exe`)
- Version bumped to `0.5.0`
- Changelog headers reformatted from "Session N" to semantic versioning
- **Import ordering** — normalized `StatsPage.tsx` and `TaskItem.tsx` to React → third-party → local convention
- **useTheme guard** — added `if (!vars) return;` before `Object.entries(vars)` to prevent crash on unexpected theme values
- **CSP security** — replaced `"csp": null` with a restrictive policy in `tauri.conf.json`
- **Window constraints** — added `minWidth: 375` and `minHeight: 500` to `tauri.conf.json`

## v0.4.0 — Animation & UX Polish

**Focus**: Smooth reorder animations, precise drag feedback, always-visible snackbar, hide controls.

### ✨ UI Improvements
- **Animated reorder with completedToBottom** — FLIP animation on wrapper divs using `transform: translate()` smoothly transitions tasks to their new positions when `Move completed tasks to bottom` is enabled, instead of instant snapping
- **Precise drag ghost offset** — set initial ghost position on pointerdown at `client -16, -16` so the ghost appears anchored to the contact point immediately, not after first pointermove
- **Always-visible UndoSnackbar** — moved outside `<main>` scroll container so it stays fixed at the bottom of the viewport, never requiring scrolling
- **Hide Edit / Hide Delete toggles** — new options in Behavior to hide Edit and Delete buttons per-task, with auto-reflowing layout that stays balanced

### 📁 Files Changed
| File | What changed |
|------|-------------|
| `src/components/TodoList.tsx` | Added FLIP animation via `transform` on `[data-flipid]` wrapper divs for `completedToBottom` reorder; set initial ghost pos on pointerdown; drag offset `-16, -16` |
| `src/components/Layout.tsx` | Moved `<UndoSnackbar />` outside `<main>` to prevent scroll-container clipping |
| `src/types/index.ts` | Added `hideEditInTasks` and `hideDeleteInTasks` to `Settings` |
| `src/store/useTodoStore.ts` | Added defaults for the two new settings |
| `src/pages/Options.tsx` | Added "Hide Edit in Tasks" and "Hide Delete in Tasks" toggles in Behavior section |
| `src/components/TaskItem.tsx` | Conditionally renders Edit/Delete buttons based on settings; hides container when both hidden |

## v0.3.0 — Time Tags, Calendar Panel & Daily Goals

**Focus**: Add time display to tasks, build calendar day-panel, add daily goals setting.

### 🚀 New Features
- **Time tag on tasks** — `formatTaskTime` in dateFormat.ts returns `h:mm a` only when hours/minutes are non-zero; `Clock` icon badge rendered alongside the date tag in TaskItem (view + edit) and TaskEditor NLP preview
- **Calendar selected-day panel** — clicking a date cell sets `selectedDate` state, reveals a detail panel below the calendar grid with all tasks for that day, showing title, time, priority, and tags
- **Daily Goals setting** — numeric `<input type="number">` in Options page, wired to `useStatsStore.setDailyGoal`, validates integer ≥ 1, defaults to 5; spinner buttons styled with primary-tinted background

### 🐛 Bug Fixes
- **`dailyGoal` vs `dailyGoals` type mismatch** — Options page initially referenced `state.dailyGoal` (non-existent), fixed to access `state.dailyGoals` record and derive today's goal

### 🧹 Code Cleanup
- **`dateFormat.ts`** — added `formatTaskTime` export, clean condition for hiding time when hours/minutes are zero
- **`TaskItem.tsx`** — imported `Clock` icon, added time badge in view mode and inline time in edit date preview
- **`TaskEditor.tsx`** — imported `Clock` icon, added time badge to parsed preview
- **`CalendarPage.tsx`** — added `selectedDate`/`setSelectedDate` state, click handlers on cells, animated detail panel with todo list grouped by day

## v0.2.0 — Code Quality & Stability

**Focus**: Clean up the codebase, fix bugs, improve accessibility and performance, make the app more robust.

### 🚀 New Features
- **`dev/changelog.html`** — private styled changelog page inside the gitignored `dev/` folder
- **`CHANGELOG.md`** — this public dev log at the project root
- **Keyboard shortcuts go global** — `Ctrl+Z` / `Ctrl+Y` (`Cmd+Z` / `Cmd+Shift+Z`) now work on **every page** (not just Home), on **any viewport size** (not just landscape). Handled in `Layout.tsx` instead of `Home.tsx`.
- **Snackbar follows the keyboard** — uses the Visual Viewport API to measure on-screen keyboard height and dynamically offsets the snackbar so it's always visible above the keyboard on both Android and iOS.

### ♿ Accessibility
- Added `aria-label` to every icon button: drag handles, undo/redo, close, search, add-list, NLP guide help icon, month navigation arrows
- Added `aria-hidden="true"` on ghost drag element and decorative UI elements
- Wrapped `animate-fade-in` in `@media (prefers-reduced-motion: no-preference)` so users with motion sensitivity always see content immediately

### 🐛 Bug Fixes
- **UndoSnackbar infinite loop** — combined Zustand selector `state => ({...})` created a new object on every call, which broke `useSyncExternalStore`'s referential equality check and caused an infinite re-render → crash. Reverted to individual primitive selectors.
- **StatsPage division by zero** — if the daily goal was set to 0, the progress percentage became `NaN`. Added a `safeGoal` guard that defaults to 1.
- **CalendarPage performance** — replaced O(n×m) per-cell filtering (calling `todos.filter()` for each of 35+ cells) with a single O(n) `useMemo` pass that builds a `Map<dateString, Todo[]>`, giving O(1) lookups per cell.
- **Error resilience** — wrapped all `localStorage` calls in try/catch so private browsing doesn't crash the app. Wrapped `chrono-parse` in try/catch with date validation. Added null/undefined guard to `formatTaskDate`.

### 🧹 Code Cleanup
- **Removed dead `reorderTodos`** — the action was defined in both the store interface and implementation but never called anywhere
- **Merged split imports** — `createJSONStorage` was imported twice across two lines in both stores, now imported once
- **Safer `setTodoOrder`** — replaced non-null assertion (`!`) with a proper `t is Todo` type guard
- **Constants over magic values** — extracted `DEFAULT_DAILY_GOAL` (was hardcoded `5` in two places) and `ID_LENGTH`
- **Deleted `App.css`** — unused file, never imported anywhere
- **Removed ~20 unused CSS classes** — all the direction-aware page transition keyframes and classes (slide-in/out, scale-in, fade-slide-up, edit-transition-enter/exit, glass-card, text-shadow, transition-smooth) that were left behind when page transitions were removed

### 💡 Considered But Not Done
- **Extract `<Badge>` component** — inline approach is simpler and the pattern is consistent enough via utility classes
- **Rename store `tags` → `tagLibrary`** — would break persisted data migration for existing users
- **Move helpers outside component body in `Options.tsx`** — minor perf win, not worth the churn right now
- **CSS variables for all badge colors** — the current `.dark .badge-*` class overrides work reliably

<details>
<summary><strong>v0.1.0 — Feature Development & Dark Mode</strong></summary>

**Focus**: Build the core task management UI, implement dark mode, add NLP input.

### 🚀 New Features
- **NLP-powered task input** — uses `chrono-node` for natural language date parsing (e.g. "Buy milk tomorrow !! #home") with a custom `parseFlexibleDate` fallback for common formats like `20/05/27`
- **Edit mode** — inline editing with auto-resizing textarea, tag chips (with add/remove), priority selector (high/medium/low with color-coded rings), debounced date preview
- **Drag-and-drop reordering** — pointer-based drag with a semi-transparent ghost preview, drop indicator line, and auto-scroll
- **Undo/redo snackbar** — pops up at the bottom after any task mutation, with undo/redo buttons and a 6-second auto-dismiss
- **Dark mode** — `#222227` card backgrounds, `#1A1A1A` page background, `color-mix()` borders, with `.dark .badge-*` CSS overrides for reliable badge colors across themes
- **Page fade-in animation** — a subtle `opacity 0→1` + `translateY` animation on `<main>` for app launch
- **Edit mode collapse animation** — left section (drag grip + toggle button) smoothly shrinks to `w-0 opacity-0 scale-75` when entering edit mode

### 🐛 Bug Fixes
- **Port EACCES** — Windows reserved ports 1420/1421 → moved dev server to 3000/3001
- **Badge color specificity** — dark mode badges needed explicit `.dark .badge-*` rules to override light mode defaults

### 🧹 Removed
- **Direction-aware page transitions** — the AnimatedOutlet approach caused snapping and duplication issues on route changes, replaced with the simple one-time fade-in
</details>
