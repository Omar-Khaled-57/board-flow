# BoardFlow v1.0.0 — Production Release

First stable release. BoardFlow is a cross-platform task and notes manager built with Tauri, React, and TypeScript.

## What's New

### Stats Page
- New wave chart with gradient fill and grid texture, rendering a smooth 7-day activity visualization even with zero tasks completed.

### Export That Actually Works
- **4-tier export chain** — data is guaranteed to leave the app on every platform:
  1. System file picker (desktop & Android)
  2. Android share sheet (Google Drive, email, file manager)
  3. Clipboard copy
  4. Copy-paste textarea (last resort)
- Export silently falls through each tier until one succeeds — no dead ends.

### Android Share
- Export via the system share sheet — send your data to any app that accepts JSON files. No storage permissions required.

## Bug Fixes

- **Task toggle animation** — toggling completion no longer causes a visible jump or disappear-then-slide-back glitch.
- **Android export** — blob-download fallback was completely dead in Android WebView; replaced with a working chain of fallbacks.
- **Android SAF write** — silent failure on file write now falls through to the share sheet instead of showing an error.

## For Developers

- Upgraded `kotlin-gradle-plugin` to 2.1.20 (matched AndroidX Kotlin metadata 2.1.0)
- Updated AndroidX deps: `activity-ktx` 1.13.0, `webkit` 1.16.0, `material` 1.14.0, `lifecycle-process` 2.11.0
- Fixed JDK 26 incompatibility by pinning Gradle to Android Studio's bundled JBR (JDK 21)
- Removed invalid `@tauri.plugin.command` annotations from `MainActivity.kt`
- Removed dead `saveToUri` / `shareExport` methods from `MainActivity.kt`

## Links

- **Source**: [github.com/Omar-Khaled-57/board-flow](https://github.com/Omar-Khaled-57/board-flow)
- **License**: See repository

---

*BoardFlow v1.0.0 — built with Tauri v2.11.2, React, and Vite.*
