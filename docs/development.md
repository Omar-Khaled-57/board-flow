# BoardFlow development

## Prerequisites

The [README](../README.md) lists Node.js 18+, stable Rust, Visual Studio C++
Build Tools on Windows, Android Studio with SDK/NDK for Android, and Xcode for
macOS/iOS. The release workflow uses Node 22, pnpm via `pnpm/action-setup`, a
stable Rust toolchain, Temurin JDK 17 for Android and Tauri's Linux system
packages ([`../.github/workflows/release.yml`](../.github/workflows/release.yml)).
Check the README's Linux build section for the WebKitGTK/GTK dev packages needed
locally.

## Install and run

The manifest declares `pnpm@11.2.2` as `packageManager` and the repo ships a
[`../pnpm-lock.yaml`](../pnpm-lock.yaml); CI installs with `pnpm install
--frozen-lockfile`. The README's quick start uses `npm install`.

```bash
npm install
npm run dev          # Vite web frontend, port 3000
npm run tauri:dev    # Tauri desktop dev shell
```

## Command reference

Every command below is verbatim from the `scripts` block of
[`../package.json`](../package.json); run them with the package manager of your
choice (CI uses `pnpm`).

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Frontend dev server. |
| `build` | `tsc && vite build` | Type-check and produce `dist/`. |
| `preview` | `vite preview` | Preview the built frontend. |
| `tauri` | `tauri` | Tauri CLI passthrough (e.g. the README's `npm run tauri android build`). |
| `tauri:dev` | `tauri dev` | Tauri desktop development. |
| `appimage` | `tauri build --bundles appimage` | AppImage only. |
| `appimage:debug` | `tauri build --debug --bundles appimage` | Debug AppImage. |
| `linux` | `tauri build --bundles appimage,deb,rpm` | Linux bundle set. |
| `windows` | `tauri build --bundles nsis,msi` | Windows installers (build on Windows). |
| `test` | `vitest run` | Unit tests, once. |
| `test:watch` | `vitest` | Unit tests in watch mode. |

Additional commands used by the project's own docs/CI: `npx playwright test`
and `npx playwright test --ui` ([README](../README.md),
[`../playwright.config.ts`](../playwright.config.ts)); `npx tsc --noEmit` as a
type-check gate ([`../dev/release-plan-v1.0.2.md`](../dev/release-plan-v1.0.2.md));
and `APPIMAGE_EXTRACT_AND_RUN=1 pnpm appimage` / `pnpm linux` for headless Linux
builds. See [`./testing.md`](./testing.md) and [`./deployment.md`](./deployment.md).

## Repository structure

See the directory map in [`./architecture.md`](./architecture.md) and the
annotated tree in the [README](../README.md). The working paths that matter
most when changing code:

- `src/pages/` route screens, `src/components/` shared UI, `src/hooks/`
  cross-page behaviour, `src/store/` state and persistence,
  `src/schemas/` validation, `src/types/` domain types, `src/utils/` helpers.
- `e2e/` browser specs, `src/**/__tests__/` and `src/test/setup.ts` unit tests.
- `src-tauri/` native crate, capabilities, icons and generated Android project.
- `docs/` these pages, plus the pre-existing visual identity guide.
- `dev/` git-ignored scratch material — do not rely on it as source of truth.

## Conventions evidenced in the tree

- TypeScript is strict, with `noUnusedLocals` and `noUnusedParameters`
  ([`../tsconfig.json`](../tsconfig.json)). Vite handles bundling; Tailwind 4 is
  configured through the Vite plugin ([`../vite.config.ts`](../vite.config.ts)).
- Imports in the changelog are normalised as React → third-party → local; page
  modules are lazy-loaded in [`../src/App.tsx`](../src/App.tsx).
- Persisted records get both a strict schema and an importable variant in
  [`../src/schemas/index.ts`](../src/schemas/index.ts). Change them together when
  the shapes in [`../src/types/index.ts`](../src/types/index.ts) change.
- State changes in the task and note stores push snapshots into `past`, clear
  `future`, and rebuild `todoIndexes`/`noteIndexes` — follow that pattern for
  new mutations.
- Pre-paint theme values in [`../index.html`](../index.html) must mirror
  `themeVars` in [`../src/hooks/useTheme.ts`](../src/hooks/useTheme.ts);
  canonical CSS tokens are in [`../src/index.css`](../src/index.css) and
  documented in [`./visual-identity.md`](./visual-identity.md).
- Native capabilities are allow-listed in
  [`../src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json);
  new plugin calls need matching permissions.

## Adding a feature

1. Decide the owning layer: route screen in `src/pages/`, reusable UI in
   `src/components/`, shared behaviour in `src/hooks/`, persisted state in
   `src/store/`.
2. If the feature persists data, update the type in `src/types/index.ts`, both
   schemas in `src/schemas/index.ts`, the store's `partialize`/`merge` behaviour,
   and the v2 export/import payload in `src/pages/Options.tsx`.
3. Wire the route in `src/App.tsx` and add the UI with Tailwind utilities and
   the existing CSS variables rather than hard-coded theme colours.
4. Add a unit test beside the changed module (`__tests__/`) and, for major UI
   flows, a spec in `e2e/`. Run `npm run test` and `npx playwright test`.
5. Run `npm run build` before packaging; update `CHANGELOG.md` and the relevant
   page in `docs/` if behaviour or configuration changed.

## Troubleshooting (evidenced in the repo)

- **Stale frontend in a native build:** `dev/build-staleness-fix.md` traces this
  to Cargo not watching `dist/`; the fix is the `cargo:rerun-if-changed=../dist`
  line in [`../src-tauri/build.rs`](../src-tauri/build.rs), plus a one-time
  `cargo clean -p boardflow`. That note also records an MSI upgrade-cache issue
  on Windows and suggests uninstalling the old app and clearing its
  `%LOCALAPPDATA%` data before reinstalling.
- **Linux AppImage fails without FUSE:** the README documents
  `APPIMAGE_EXTRACT_AND_RUN=1` for containers/headless CI. An old cached
  `linuxdeploy-x86_64.AppImage` may also fail to strip modern libraries; the
  README says to replace `~/.cache/tauri/linuxdeploy-x86_64.AppImage` with a
  current build.
- **Android gradle JDK path:** the generated
  `src-tauri/gen/android/gradle.properties` was produced on Windows and pins a
  Windows JBR path; the release workflow removes that line and writes
  `org.gradle.java.home=${JAVA_HOME}` before building.
- **Export writes to an unhelpful Android location:** current code skips the FS
  write for `content://` paths and falls through to clipboard/textarea
  ([`../src/pages/Options.tsx`](../src/pages/Options.tsx)).

## Sources

- [`../package.json`](../package.json), [`../README.md`](../README.md), [`../tsconfig.json`](../tsconfig.json), [`../vite.config.ts`](../vite.config.ts), [`../.github/workflows/release.yml`](../.github/workflows/release.yml), [`../src/`](../src), [`../dev/build-staleness-fix.md`](../dev/build-staleness-fix.md), [`../dev/release-plan-v1.0.2.md`](../dev/release-plan-v1.0.2.md), [`../CHANGELOG.md`](../CHANGELOG.md).
