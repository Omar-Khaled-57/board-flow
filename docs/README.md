# BoardFlow documentation

BoardFlow is a local-first task, notes, calendar and statistics app that ships
as a Tauri desktop app and can be packaged for Android. Start with the
[project README](../README.md) for the product pitch, download table and the
fast path to running it; use this index when you need a specific answer.

## Documentation index

| Page | What it answers |
| --- | --- |
| [Product](./product.md) | What the app does today, which route/file implements each feature, and what is explicitly out of scope. |
| [Architecture](./architecture.md) | Stack, entry points, directory map, state/storage flow, Tauri boundary and process model. |
| [Development](./development.md) | Prerequisites, install, scripts, conventions, adding a feature and evidenced troubleshooting. |
| [Configuration](./configuration.md) | Environment variables, persisted keys, settings defaults, CI secrets and security notes. |
| [Testing](./testing.md) | Vitest and Playwright commands, suites, verified test counts and gaps. |
| [Deployment](./deployment.md) | Build scripts, artifacts, configured targets, release workflow and unconfigured targets. |
| [Changelog](./changelog.md) | Where the running release history lives and a short summary. |
| [Visual identity](./visual-identity.md) | Pre-existing palette guide, canonical CSS tokens and product preview. |

Other author-maintained material kept in place: the running
[`CHANGELOG.md`](../CHANGELOG.md), the
[`RELEASE-v1.0.0.md`](../RELEASE-v1.0.0.md) notes, and the git-ignored
[`dev/`](../dev) scratch folder (analysis, release plan, build notes, old
packages and screenshot source). Links into `dev/` resolve in this working tree
but that directory is excluded from version control by [`../.gitignore`](../.gitignore).

## Canonical sources of truth

| Subject | File |
| --- | --- |
| Version, scripts, dependency versions, package manager | [`../package.json`](../package.json) and [`../pnpm-lock.yaml`](../pnpm-lock.yaml) |
| Frontend entry, routes, build chunks and dev server | [`../src/main.tsx`](../src/main.tsx), [`../src/App.tsx`](../src/App.tsx), [`../vite.config.ts`](../vite.config.ts) |
| Persisted state, defaults and storage adapters | [`../src/store/`](../src/store), [`../src/schemas/index.ts`](../src/schemas/index.ts), [`../src/types/index.ts`](../src/types/index.ts) |
| Native app configuration and permissions | [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json), [`../src-tauri/Cargo.toml`](../src-tauri/Cargo.toml), [`../src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json) |
| Test configuration | [`../vitest.config.ts`](../vitest.config.ts), [`../playwright.config.ts`](../playwright.config.ts) |
| Release automation | [`../.github/workflows/release.yml`](../.github/workflows/release.yml) |
| Theme tokens | [`../src/index.css`](../src/index.css), [`../src/hooks/useTheme.ts`](../src/hooks/useTheme.ts), [`./visual-identity.md`](./visual-identity.md) |

## Sources

- [`../README.md`](../README.md), [`../package.json`](../package.json), [`../.gitignore`](../.gitignore) and the file tree above.
