# BoardFlow deployment

BoardFlow is distributed as native installers/packages and an Android APK from
GitHub Releases; the [README](../README.md) links the release page and lists
the per-platform assets. There is no hosted web deployment configured.

## Build commands and artifacts

All build scripts are verbatim from [`../package.json`](../package.json). Tauri
runs `npm run build` (`tsc && vite build`) as `beforeBuildCommand` and embeds
`dist/` ([`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json)).

| Command | Artifacts (as referenced by the repo) |
| --- | --- |
| `npm run build` | `dist/` frontend bundle (git-ignored). |
| `npm run preview` | Serves the built `dist/` locally. |
| `npm run tauri build` | Native bundles for the configured targets under `src-tauri/target/release/bundle/`. |
| `pnpm appimage` / `pnpm appimage:debug` | `src-tauri/target/release/bundle/appimage/*.AppImage` (debug variant uses `--debug`). |
| `pnpm linux` | AppImage, `bundle/deb/*.deb` and `bundle/rpm/*.rpm`. |
| `pnpm windows` | `bundle/nsis/`, `bundle/msi/` (build on Windows). |
| `npm run tauri android build` (README) / `pnpm tauri android build --apk` (CI) | `src-tauri/gen/android/app/build/outputs/apk/…`. |

README download names: `BoardFlow_<version>_amd64.AppImage`, `.deb` / `.rpm`
alternatives, `BoardFlow_<version>_x64-setup.exe` for Windows and
`BoardFlow_v<version>.apk` for Android. The release workflow uploads
`src-tauri/target/release/bundle/appimage/*.AppImage`, `bundle/deb/*.deb`,
`bundle/rpm/*.rpm`, `bundle/nsis/*-setup.exe` and APK outputs, then writes a
`SHA256SUMS.txt` before attaching files to the release.

## Configured targets

[`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) declares
`bundle.targets: ["appimage", "deb", "rpm", "nsis", "msi"]` and a bundle
identifier of `com.omark.boardflow`. The Android native project is generated
under [`../src-tauri/gen/android/`](../src-tauri/gen/android); the CI job
initialises it with `pnpm tauri android init || true` and signs the APK using
repository secrets. Older signed/unsigned APKs, installers and idempotency files
from previous releases remain under [`../dev/release/`](../dev/release) in the
working tree; `dev/` is git-ignored.

## Release automation

[`../.github/workflows/release.yml`](../.github/workflows/release.yml) triggers
on a push of any `v*` tag (with `contents: write`):

| Job | Runner | Output |
| --- | --- | --- |
| `linux` | `ubuntu-22.04` | AppImage, deb, rpm (built with `APPIMAGE_EXTRACT_AND_RUN=1`). |
| `windows` | `windows-latest` | NSIS `*-setup.exe`. |
| `android` | `ubuntu-22.04` | Signed APK, using four Android keystore secrets and a temporary `keystore.jks`. |
| `publish` | `ubuntu-latest` | Downloads artifacts, normalises the APK name to `BoardFlow_${GITHUB_REF_NAME}.apk`, writes SHA256SUMS and attaches everything to the GitHub release with generated release notes. |

Historical release notes live in [`../CHANGELOG.md`](../CHANGELOG.md),
[`../RELEASE-v1.0.0.md`](../RELEASE-v1.0.0.md) and the git-ignored
[`../dev/release-plan-v1.0.2.md`](../dev/release-plan-v1.0.2.md); see
[`./changelog.md`](./changelog.md).

## Build notes and known gaps

- For Linux builds without FUSE, the README documents
  `APPIMAGE_EXTRACT_AND_RUN=1`. An outdated cached linuxdeploy AppImage may
  need replacing in `~/.cache/tauri/`.
- [`../dev/build-staleness-fix.md`](../dev/build-staleness-fix.md) records that
  `dist/` changes used to be missed by Cargo; the fix lives in
  [`../src-tauri/build.rs`](../src-tauri/build.rs). It also documents a Windows
  MSI upgrade-cache workaround.
- The generated Android `gradle.properties` pins a Windows JBR path locally;
  CI rewrites `org.gradle.java.home` before building.
- No macOS or iOS bundle target, code signing/notarisation step, web hosting
  configuration, container image or deployment to a cloud provider is present
  in the repo. Although the README lists Xcode prerequisites, no Apple build
  job or target is configured.
- No release is produced by a plain `git push` to a branch; the workflow only
  reacts to `v*` tags. No publication to a package registry is configured.

## Sources

- [`../package.json`](../package.json), [`../src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json), [`../src-tauri/build.rs`](../src-tauri/build.rs), [`../.github/workflows/release.yml`](../.github/workflows/release.yml), [`../README.md`](../README.md), [`../dev/build-staleness-fix.md`](../dev/build-staleness-fix.md), [`../dev/release-plan-v1.0.2.md`](../dev/release-plan-v1.0.2.md), [`../.gitignore`](../.gitignore).
