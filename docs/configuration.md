# BoardFlow configuration

## Environment variables

No `import.meta.env` use was found in `src/`. The only environment reads in the
application toolchain are in [`../vite.config.ts`](../vite.config.ts):

| Variable | Read by | Default / effect |
| --- | --- | --- |
| `TAURI_DEV_HOST` | `process.env.TAURI_DEV_HOST` | Unset by default; used as the Vite `server.host` and to configure HMR over `ws` on port 3001. Set by the Tauri CLI for device/mobile development. |
| `TAURI_ENV_PLATFORM` | `process.env.TAURI_ENV_PLATFORM` | When defined, the PWA plugin is omitted from the Vite config (no service worker inside the webview). Set by Tauri's `beforeDevCommand`/`beforeBuildCommand`. |
| `APPIMAGE_EXTRACT_AND_RUN` | Used in the README and CI shell commands, not read by app code | `1` allows AppImage builds to run where FUSE is unavailable. |
| `JAVA_HOME` | Written into `src-tauri/gen/android/gradle.properties` by the release workflow as `org.gradle.java.home` | CI's JDK path; the generated local file currently pins a Windows JBR path. |

No `.env` or `.env.example` file is present;
[`../.gitignore`](../.gitignore) ignores `.env` and `.env.*` (with an exception
for `.env.example`).

## Build-time configuration

| File | What it controls |
| --- | --- |
| [`../package.json`](../package.json) | Version `1.0.2`, scripts, dependency versions and the declared pnpm package manager. |
| [`../vite.config.ts`](../vite.config.ts) | React/Tailwind/PWA plugins, `manualChunks` (`vendor-react`, `vendor-katex`, `vendor-utils`), `chunkSizeWarningLimit: 1000`, dev server port 3000 with `strictPort`, HMR port 3001, and `src-tauri` excluded from watching. |
| [`../tsconfig.json`](../tsconfig.json), [`../tsconfig.node.json`](../tsconfig.node.json) | Strict TypeScript, bundler resolution, no emit; Vite config node project. |
| [`../vitest.config.ts`](../vitest.config.ts) | jsdom environment, globals, `src/test/setup.ts`, excludes `e2e/**`. |
| [`../playwright.config.ts`](../playwright.config.ts) | `./e2e` specs, Chromium project, base URL `http://localhost:3000`, one worker, no retries, dev server auto-start. |
| [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) | Product name, version, identifier `com.omark.boardflow`, window size/minimums/background colour, CSP, bundle targets and bundled resources. |
| [`../src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json) | Plugin permissions and the `$DOWNLOAD/**` filesystem write scope. |
| [`../src-tauri/Cargo.toml`](../src-tauri/Cargo.toml) | Rust crate metadata and Tauri plugins. |
| [`../.github/workflows/release.yml`](../.github/workflows/release.yml) | Release trigger `push` on tags matching `v*`, build matrix and secret names. |

## Persisted keys and local storage

[`../src/store/storage.ts`](../src/store/storage.ts) selects one of three
adapters at runtime: Tauri store (`boardflow.dat`), IndexedDB via `idb-keyval`
(database `boardflow-db`, object store `boardflow-store`), or `localStorage`.
Zustand's `persist` middleware writes these keys:

| Key | Store | Contents |
| --- | --- | --- |
| `boardflow-storage` | [`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts) | Tasks, tags, lists, settings (history and indexes are not persisted). The pre-paint theme script in [`../index.html`](../index.html) reads this key directly. |
| `boardflow-notes-storage` | [`../src/store/useNotesStore.ts`](../src/store/useNotesStore.ts) | Notes, note sort field and direction. |
| `boardflow-stats` | [`../src/store/useStatsStore.ts`](../src/store/useStatsStore.ts) | Daily goals, current streak, longest streak. |

Other keys found in the repo: `hasSeenSplash` is set only by Playwright specs in
[`../e2e/`](../e2e) (no application code reads it), and `theme` is used only by
the private prototype [`../dev/dbtns.html`](../dev/dbtns.html). Attachments in
`Note.path` and `Todo.attachments` are file paths/strings, not embedded data
([`../src/types/index.ts`](../src/types/index.ts)).

## User settings

Defaults come from `defaultSettings` in
[`../src/store/useTodoStore.ts`](../src/store/useTodoStore.ts) and the notes
store; the editable controls are in
[`../src/pages/Options.tsx`](../src/pages/Options.tsx).

| Setting | Default | Notes |
| --- | --- | --- |
| `theme` | `'system'` | `light`, `dark` or `system`; `system` follows `prefers-color-scheme`. |
| `accentColor` | `'#5b6af0'` | Changing it recomputes on-primary, readable and saturated variants in `useTheme.ts`. |
| `soundEnabled` | `true` | Field exists in `Settings`; see `src/utils/audio.ts`. |
| `notificationsEnabled` | `true` | Gates `useNotificationScheduler`. |
| `addToTop` | `false` | Controls where new tasks are inserted. |
| `completedToBottom` | `false` | Behaviour toggle in Options. |
| `landscapeStackedTasks` | `true` | Behaviour toggle in Options. |
| `hideEditInTasks` / `hideDeleteInTasks` | `false` / `false` | Hide per-task actions. |
| `verticalActionButtons` | `false` | Behaviour toggle in Options. |
| `lastActiveListId` | `'all'` | Task list remembered across sessions. |
| `sidebarExpanded` | `true` | Desktop navigation state. |
| `sortField` / `sortDirection` | `'date-added'` / `'desc'` | Task sorting. |
| `noteSortField` / `noteSortDirection` | `'date-added'` / `'desc'` | Notes sorting (stored in the notes store). |
| Daily goal | Fallback `5` when no record exists | `DEFAULT_DAILY_GOAL = 5` in `useStatsStore.ts`; Options uses the same fallback for today's key. |

## CI secrets and security notes

[`../.github/workflows/release.yml`](../.github/workflows/release.yml) reads four
GitHub secrets for signed Android builds: `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`
(via `TAURI_ANDROID_KEYSTORE_*` environment variables in the android job), plus
the repository `contents: write` permission for publishing releases. No secret
values are committed in the workflow.

`dev/my-release-key.jks` and `dev/my-release-key.jks.old-20260824` exist in the
working tree; `dev/` and `*.jks` are git-ignored
([`../.gitignore`](../.gitignore),
[`../dev/release-plan-v1.0.2.md`](../dev/release-plan-v1.0.2.md)). Keystores,
their passwords and any future API tokens must never be committed; keep them as
CI secrets or ignored local files. The Tauri CSP and capability allow-list in
`src-tauri/` are the current boundary for webview access to native APIs.

## Sources

- [`../vite.config.ts`](../vite.config.ts), [`../src/store/storage.ts`](../src/store/storage.ts), [`../src/store/`](../src/store), [`../src/types/index.ts`](../src/types/index.ts), [`../src/hooks/useTheme.ts`](../src/hooks/useTheme.ts), [`../src/pages/Options.tsx`](../src/pages/Options.tsx), [`../index.html`](../index.html), [`../playwright.config.ts`](../playwright.config.ts), [`../vitest.config.ts`](../vitest.config.ts), [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json), [`../src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json), [`../.github/workflows/release.yml`](../.github/workflows/release.yml), [`../.gitignore`](../.gitignore).
