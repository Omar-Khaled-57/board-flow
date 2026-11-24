# BoardFlow testing

## Commands

The unit-test scripts are verbatim from [`../package.json`](../package.json);
the Playwright commands are documented in the [README](../README.md).

| Command | Source | Purpose |
| --- | --- | --- |
| `npm run test` | `test` script → `vitest run` | Run all unit tests once. |
| `npm run test:watch` | `test:watch` script → `vitest` | Watch mode. |
| `npx playwright test` | README / [`../playwright.config.ts`](../playwright.config.ts) | Run all browser specs. |
| `npx playwright test --ui` | README | Playwright interactive UI mode. |
| `npx playwright test --list` | Standard Playwright CLI option | List discovered specs without running them. |

Vitest is configured in [`../vitest.config.ts`](../vitest.config.ts) with jsdom,
globals, [`../src/test/setup.ts`](../src/test/setup.ts) (Testing Library
matchers, fake IndexedDB, mocked Tauri store/notification/path APIs) and
`e2e/**` excluded. Playwright uses one Chromium project, one worker, no retries,
`baseURL: http://localhost:3000` and auto-starts `npm run dev` with server reuse
([`../playwright.config.ts`](../playwright.config.ts)).

## Verified results in this working tree

- `pnpm test -- --reporter=dot`: **5 test files passed, 45 tests passed**.
- `npx playwright test --list`: **24 tests in 5 files** (discovery only; the full
  E2E suite was not executed for this documentation pass).

These counts are the current source of truth; the older numbers in
[`../CHANGELOG.md`](../CHANGELOG.md) describe the suites as they were at those
releases. No coverage report is committed, and `coverage/` is git-ignored
([`../.gitignore`](../.gitignore)). `test-results/.last-run.json` is a leftover
Playwright run marker, not a report.

## Unit suites

| File | Tests | What the test names cover |
| --- | --- | --- |
| [`../src/store/__tests__/useTodoStore.test.ts`](../src/store/__tests__/useTodoStore.test.ts) | 13 | Add/toggle/update/delete, clear completed, undo/redo, order, tags, lists, settings and indexes. |
| [`../src/store/__tests__/useNotesStore.test.ts`](../src/store/__tests__/useNotesStore.test.ts) | 8 | Add/update/delete, undo/redo, sort preferences, order, `getNoteById`, `updatedAt`. |
| [`../src/schemas/__tests__/schemas.test.ts`](../src/schemas/__tests__/schemas.test.ts) | 12 | Valid todos/notes, exporter-style null optionals, legacy defaults, malformed records, tag and daily-goal schemas. |
| [`../src/utils/__tests__/nlp.test.ts`](../src/utils/__tests__/nlp.test.ts) | 8 | Latin/Arabic/mixed hashtags, deduplication, priorities and Arabic date terms. |
| [`../src/utils/__tests__/id.test.ts`](../src/utils/__tests__/id.test.ts) | 4 | ID length, custom length, uniqueness and character set. |

## Browser suites

| Spec | Tests | What the test names cover |
| --- | --- | --- |
| [`../e2e/tasks.spec.ts`](../e2e/tasks.spec.ts) | 7 | Create, toggle, filter, delete, search, clear completed, list switching. |
| [`../e2e/notes.spec.ts`](../e2e/notes.spec.ts) | 4 | Create note, empty state, search, navigate to detail and back. |
| [`../e2e/export-import.spec.ts`](../e2e/export-import.spec.ts) | 5 | Options page, presence and click behaviour of export/import controls, hidden file input, section presence. |
| [`../e2e/theme.spec.ts`](../e2e/theme.spec.ts) | 5 | Theme buttons, light/dark switching, accent swatches and accent change. |
| [`../e2e/undo-redo.spec.ts`](../e2e/undo-redo.spec.ts) | 3 | Snackbar appearance, undo restore, redo reapply. |

Each spec sets `localStorage.hasSeenSplash` before navigating. Playwright traces
are configured as `on-first-retry`, but retries are set to 0, so no retry trace
is produced by default.

## Gaps

- The export/import E2E spec checks controls, not an actual file round-trip;
  Zod import/export behaviour is covered only at unit level.
- There are no E2E tests for the calendar or statistics pages, native Tauri
  notifications, dialogs, filesystem writes or the Android build.
- No coverage threshold, coverage upload, lint script or test job exists in
  [`../package.json`](../package.json) or
  [`../.github/workflows/release.yml`](../.github/workflows/release.yml); that
  workflow builds and publishes releases only.
- No performance, accessibility-audit or visual-regression tooling is configured
  in the manifest.

## Sources

- [`../package.json`](../package.json), [`../vitest.config.ts`](../vitest.config.ts), [`../playwright.config.ts`](../playwright.config.ts), [`../src/test/setup.ts`](../src/test/setup.ts), [`../e2e/`](../e2e), [`../src/store/__tests__/`](../src/store/__tests__), [`../src/schemas/__tests__/`](../src/schemas/__tests__), [`../src/utils/__tests__/`](../src/utils/__tests__), [`../README.md`](../README.md), [`../.gitignore`](../.gitignore), [`../.github/workflows/release.yml`](../.github/workflows/release.yml).
