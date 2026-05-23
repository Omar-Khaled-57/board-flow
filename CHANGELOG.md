# BoardFlow Changelog

A running log of every change, fix, and decision during development.

---

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
