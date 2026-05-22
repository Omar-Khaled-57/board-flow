# BoardFlow Changelog

A running log of every change, fix, and decision during development.

---

## Session 2 — Code Quality & Stability

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
- **UndoSnackbar infinite loop** — combined Zustand selector `state => ({...})` created a new object on every call, which broke `useSyncExternalStore`’s referential equality check and caused an infinite re-render → crash. Reverted to individual primitive selectors.
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
<summary><strong>Session 1 — Feature Development & Dark Mode</strong></summary>

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

## Session 3 — Time Tags, Calendar Panel & Daily Goals

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

<details>
<summary><strong>Session 2 — Code Quality & Stability</strong></summary>

**Focus**: Clean up the codebase, fix bugs, improve accessibility and performance, make the app more robust.

| File | What changed |
|------|-------------|
| `src/components/Layout.tsx` | Added global undo/redo keyboard listener, removed `undo`/`redo` imports from Home |
| `src/components/UndoSnackbar.tsx` | Fixed infinite loop, added Visual Viewport keyboard detection, dynamic bottom positioning with nav gap + safe-area |
| `src/components/TaskEditor.tsx` | `useMemo` for parseTaskInput, `aria-label` on input |
| `src/components/TaskItem.tsx` | `aria-label` on drag grip |
| `src/components/TodoList.tsx` | `aria-hidden` on ghost element |
| `src/components/NLPGuide.tsx` | `aria-label` on both buttons |
| `src/pages/Home.tsx` | Removed `undo`/`redo` selectors, removed old keyboard shortcut useEffect |
| `src/pages/CalendarPage.tsx` | O(n)→O(1) Map-based todo lookup, removed unused `cloneDay` |
| `src/pages/StatsPage.tsx` | Division-by-zero guard on both current and historical progress |
| `src/store/useTodoStore.ts` | Merged imports, removed `reorderTodos`, type guard on `setTodoOrder`, JSDoc comments |
| `src/store/useStatsStore.ts` | Merged imports, `DEFAULT_DAILY_GOAL` constant |
| `src/App.tsx` | localStorage try/catch |
| `src/utils/nlp.ts` | try/catch on chrono.parse + date validation |
| `src/utils/dateFormat.ts` | null/undefined guard |
| `src/index.css` | Removed ~20 unused classes, wrapped fade-in in `prefers-reduced-motion` |
| `src/App.css` | **Deleted** — unused |
