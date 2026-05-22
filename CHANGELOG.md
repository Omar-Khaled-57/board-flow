# BoardFlow Changelog

## Session 2 — Code Quality & Stability

### Added
- `CHANGELOG.md` — development session log
- `dev/changelog.html` — private styled changelog page (in `.gitignore`'d `dev/`)
- `aria-label` attributes on icon buttons (drag handle, close, undo/redo, search, add-list, NLP guide, month nav)
- `aria-hidden="true"` on ghost drag element
- `useMemo` for `parseTaskInput` in `TaskEditor` to avoid re-parsing on every render
- JSDoc comments on store interfaces (`useTodoStore`)
- `DEFAULT_DAILY_GOAL` constant in `useStatsStore`
- `@media (prefers-reduced-motion: no-preference)` guard on `animate-fade-in` for accessibility
- Error handling wrappers for `localStorage`, `chrono.parse`, and date formatting

### Improved
- **CalendarPage**: replaced O(n*m) per-cell filtering with O(1) `Map` lookup via `useMemo`
- **Merged imports**: `createJSONStorage` no longer split across two import lines in stores
- **Type safety**: `setTodoOrder` now has a proper `t is Todo` type guard instead of non-null assertion
- **StatsPage**: division-by-zero guard (`safeGoal`) prevents NaN progress bars
- **Badge colors**: dark mode badge overrides standardized in CSS

### Fixed
- **UndoSnackbar infinite loop**: combined Zustand selector `state => ({...})` created a new object reference every render, triggering `useSyncExternalStore` → infinite re-render → crash. Reverted to individual primitive selectors.

### Removed
- Dead `reorderTodos` action from `useTodoStore` (interface + implementation — unused)
- ~20 unused CSS animation classes and utility classes from `index.css` (slide-in/out, scale-in, edit-transition, glass-card, text-shadow, transition-smooth)
- `App.css` — unused file, never imported

### Reverted
- Direction-aware page transitions (removed entirely due to snapping/duplication issues)
- Page transition `AnimatedOutlet` approach — replaced with simple one-time `animate-fade-in` on `<main>`

### Considered but not added
- Extracting `Badge` component (deferred — current inline approach is simpler)
- Renaming store `tags` to `tagLibrary` (would break persisted data migration)
- Moving helper functions outside component body in `Options.tsx`
- Using CSS variables for all badge colors (dark mode overrides work via class rules)
- Extracting shared header pattern into a reusable component

---

## Session 1 — Feature Development & Dark Mode

### Added
- NLP-powered task input with `chrono-node` and custom `parseFlexibleDate`
- Edit mode with textarea, tag chips, priority selector, date editor
- Drag-and-drop reordering with ghost preview
- Undo/redo snackbar
- Dark mode with `#222227` card bg, `#1A1A1A` page bg
- `.dark .badge-*` CSS overrides for reliable dark mode badge colors
- Page fade-in animation
- Edit mode left-section collapse animation (grip + toggle)

### Fixed
- Port EACCES error → moved from 1420/1421 to 3000/3001
- Badge color specificity in dark mode

### Removed
- Direction-aware page transitions (snapping/duplication issues)
- Page transition animation code (AnimatedOutlet, direction tracking, slide keyframes)
