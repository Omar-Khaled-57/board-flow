<div align="center">

# 📋 BoardFlow

**A hybrid native productivity app — tasks, notes, calendar, and stats, all local-first.**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/Zustand-5-764ABC?logo=react&logoColor=white)](#)
[![Zod](https://img.shields.io/badge/Zod-4-3068B7?logo=zod&logoColor=white)](#)

</div>

---

BoardFlow is a **local-first productivity app** that combines task management, notes, calendar, and statistics into one cohesive interface. It runs as a native desktop app (Windows, Linux, macOS) via Tauri and can be packaged for Android. Data stays on your device — no accounts, no cloud, no servers.

---

## ✨ Features

- **Task management** — create, edit, reorder, and organize tasks into lists with natural-language date parsing (e.g. "Buy milk tomorrow !!"), priorities, subtasks, and tags
- **Notes system** — full notes page with rich inline editing, tag support, task linking (`linkedTaskId`), file attachments, list management (rename/delete), and sort controls (date added, updated, title, tags)
- **Drag-and-drop reorder** — pointer-based drag with FLIP animations, ghost portal, and drop indicator on both tasks and notes
- **Undo/redo** — snapshot-based history (50 levels) with a floating snackbar; global `Ctrl+Z`/`Ctrl+Y` shortcuts
- **Calendar view** — monthly grid with task density per day, click-to-expand detail panel
- **Statistics** — daily goal tracking, completion streaks, progress indicators
- **Full backup & restore** — export all data (tasks, notes, tags, lists, settings, stats) as a single JSON file; import restores everything with all IDs and relationships intact
- **Android export** — writes directly to `MediaStore.Downloads` via a custom Rust command + Kotlin JNI bridge, no storage permissions required
- **Dark/light/system theme** — accent color picker, smooth transitions
- **Native notifications** — scheduled reminders at task due times ("Upcoming Deadline") via Tauri notification plugin; daily goal achieved alert ("Goal Achieved 🎯") with custom Android notification icons; Web Notification API fallback
- **Responsive layout** — sidebar on desktop, bottom nav on mobile, adapts to landscape
- **Testing** — 24 Playwright E2E tests + 25 vitest unit tests (stores + utilities)

---

## 🛠️ Tech Stack

| Category | Technology | Notes |
| :--- | :--- | :--- |
| App Shell | Tauri v2 | Native wrapper, desktop + Android packaging |
| Frontend | React 19 | Vite-bundled SPA with React Router |
| Language | TypeScript | Full type safety across frontend and schemas |
| Bundler | Vite 7 | Fast HMR and optimized production builds |
| Styling | Tailwind CSS v4 | Utility-first with `@custom-variant dark` for theme |
| State | Zustand 5 | Lightweight stores with `persist` middleware |
| Schemas | Zod 4 | Runtime validation for all persisted data |
| Icons | Lucide React | Consistent icon set |
| Storage | IndexedDB (via `idb-keyval`) | Primary persistence, localStorage fallback |
| History | Command-pattern `History` class | Patch-based undo/redo (50-level, batchable) |
| NLP Dates | `chrono-node` | Natural language date parsing in task input |
| Backend | Rust (Tauri plugins) | Notifications, dialog, FS, store, opener; custom `save_to_downloads` command with JNI → Kotlin for Android MediaStore |

---

## 📁 Project Structure

```
📦 BoardFlow
 ┣ 📂 src                    # React frontend
 ┃ ┣ 📂 components           # Shared UI (Badge, PageHeader, ToggleSwitch, EmptyState, etc.)
 ┃ ┣ 📂 hooks                # Extracted hooks (useDragReorder, useClickOutside, useTagSuggestions)
 ┃ ┣ 📂 pages                # App screens (Tasks, Notes, NoteDetails, Calendar, Stats, Options)
 ┃ ┣ 📂 store                # Zustand stores (useTodoStore, useNotesStore, useStatsStore)
 ┃ ┣ 📂 storage              # Persistence layer
 ┃ ┃ ┣ 📜 storage.ts         # IndexedDB adapter + repository load/save helpers
 ┃ ┃ ┣ 📜 migrations.ts      # Schema versioning framework + migration runner
 ┃ ┃ ┣ 📜 history.ts         # Command-pattern undo/redo engine
 ┃ ┃ ┗ 📂 repositories/      # Typed CRUD layer (tasks, notes, settings, stats)
 ┃ ┣ 📂 schemas              # Zod schemas for all persisted types
 ┃ ┣ 📂 types                # TypeScript interfaces (Todo, Note, Settings, etc.)
 ┃ ┗ 📂 utils                # Helpers (id generation, date formatting, notifications, NLP)
 ┣ 📂 src-tauri              # Tauri backend (Rust) + build configuration
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📜 lib.rs             # Plugin registration, command handler setup
 ┃ ┃ ┣ 📜 main.rs            # Binary entry point
 ┃ ┃ ┗ 📜 save_to_downloads.rs  # Custom Rust command + JNI bridge for Android export
 ┃ ┣ 📂 capabilities/        # Tauri v2 capability permissions (FS scopes, dialog, notification, store)
 ┃ ┗ 📂 gen/android/         # Android native project (Kotlin MainActivity with MediaStore helper)
 ┗ 📂 dev                    # Development notes and analysis files
```

The **storage architecture** is layered:
1. **Zustand stores** hold in-memory state with precomputed indexes (O(1) lookups by ID, list, tag, priority)
2. **Repositories** abstract reads/writes with in-memory caching
3. **IndexedDB** (via `idb-keyval`) is the primary persistence backend; falls back to `localStorage`
4. **Zod schemas** validate every persisted value at runtime
5. **Migration framework** handles schema version upgrades

---

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- Rust (stable)
- Windows: Visual Studio C++ Build Tools
- Android: Android Studio + SDK + NDK
- iOS/macOS: Xcode

### Install

```bash
npm install
```

### Run locally (Tauri desktop app)

```bash
npm run tauri dev
```

### Run web frontend only

```bash
npm run dev
```

### Build desktop bundles

```bash
npm run tauri build
```

### Build for Android

```bash
npm run tauri android build
```

### Run unit tests

```bash
npm run test              # run once
npm run test:watch        # watch mode
```

### Run E2E tests

```bash
npx playwright test
```

---

## 🧪 Tests

### Unit Tests (vitest)

25 vitest tests run in JSDOM with Tauri APIs mocked:

| File | Tests | Coverage |
| :--- | :--- | :--- |
| `useTodoStore.test.ts` | 13 | CRUD, toggle, undo/redo, order, tags, lists, settings, indexes |
| `useNotesStore.test.ts` | 8 | CRUD, undo/redo, sort prefs, order, updatedAt |
| `id.test.ts` | 4 | Length, uniqueness, charset |

### E2E Tests (Playwright)

24 Playwright tests run in Chromium with auto-starting dev server:

| Spec | Tests | Coverage |
| :--- | :--- | :--- |
| `tasks.spec.ts` | 7 | Create, complete, filter, delete, search, clear completed, list management |
| `notes.spec.ts` | 4 | Create, empty state, search, navigation |
| `export-import.spec.ts` | 5 | Options page, export/import buttons, file input |
| `undo-redo.spec.ts` | 3 | Snackbar visibility, undo restores, redo reapplies |
| `theme.spec.ts` | 5 | Toggle light/dark, accent color selection |

```bash
npx playwright test          # run all
npx playwright test --ui     # interactive UI mode
```

---

## 🔄 Data Flow

```
User Action → Zustand Store → IndexedDB (persist)
                ↓
          Precomputed Indexes → O(1) lookups
                ↓
          Re-render via selectors
```

Undo/redo uses snapshot history for tasks and notes (50 levels), while the separate `History` class supports command-pattern batching for future features.

Export/import uses a versioned JSON schema (v1 per-list tasks, v2 full backup) with all relationships preserved by keeping original IDs intact.

---

## 📄 License

<div align="center">
  <i>Built with 🫩 by Omar Khaled El-Khouly.</i>
</div>

<div align="center">
  © 2026 Omar Khaled El-Khouly — created by Omar-Khaled-57 on GitHub.
</div>
