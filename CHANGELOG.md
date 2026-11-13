# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [1.1.0] - 2026-11-13

Security hardening.

### Added
- Clipboard is cleared when the app exits (window close or Cmd+Q), as the original Tkinter app did. Implemented in Rust on `RunEvent::ExitRequested`; a crash or kill does not run it.
- Copy uses the clipboard plugin's `writeSecret`, which asks clipboard managers to skip the entry: `org.nspasteboard.ConcealedType` on macOS (Paste, Alfred, Raycast, Maccy honour it) and exclude-from-monitoring on Windows (keeps it out of Win+V history and cloud clipboard sync). Clears use the native `clear`.
- Editing any field after a copy clears the stale password from the clipboard; the form is kept so a mistyped site name can be fixed without retyping.
- Both "show" toggles turn off when the window is hidden or minimised.
- "Change password output length:" heading above the length options in Extras.
- `src-tauri/capabilities/default.json` granting `core:default`, `clipboard-manager:allow-write-secret`, `clipboard-manager:allow-clear`.
- Content Security Policy `default-src 'self'; connect-src ipc: http://ipc.localhost`, with a looser `devCsp` for Vite HMR.

### Fixed
- Site name input no longer autocorrects, autocapitalizes or spellchecks (macOS WebKit autocorrect could silently change the output).
- Master password uses `autoComplete="current-password"` so macOS stops offering "Use Strong Password", which would replace the master password with a random one.

### Changed
- Tauri crates and npm packages updated to 2.12.x; `@tauri-apps/api` and `@tauri-apps/plugin-clipboard-manager` added.
- Version 1.1.0.

## [1.0.0] - 2026-05-16

First public `v1` release of the standalone QuickPass desktop app after long-term private use.

### Added
- Standalone Tauri desktop project structure for independent GitHub publishing.
- Release-ready project documentation in `README.md` (overview, setup, build, security model, known risks).
- Deterministic vector test suite (`npm run test:vectors`) for algorithm/output verification.
- UI/unit test suite with Vitest + Testing Library (`npm run test`).
- Static analysis checks for JavaScript and Rust (`npm run static:check`):
  - ESLint
  - `cargo fmt --check`
  - `cargo clippy -D warnings`
- Node version pinning via `.nvmrc` (`v24.14.0`) for consistent local and CI builds.
- Hardened `.gitignore` coverage for Node, Vite, Tauri/Rust build outputs, installer artifacts, and local machine files.
- GitHub Actions workflows for matrix and release builds across Windows, Linux, macOS arm64, and macOS Intel.

### Changed
- Limited special-character mode charset updated to:
  - `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=`
- Limited-mode vector expectations updated to match the new deterministic output.
- Package renamed for standalone distribution:
  - `quickpass-desktop`
- README and scripts aligned to standalone usage (no monorepo workspace flags required).
- CI/release workflows now run both unit/UI tests and deterministic vector tests (`npm run test:all`) before building.
- CI/release workflows now run static checks before tests and builds.

### Security
- Password generation remains local and deterministic (no backend required).
- No browser storage APIs are used by app logic (`localStorage`, `sessionStorage`, `IndexedDB`).
- Clipboard operations remain explicit user actions (copy/clear flows).

### Notes
- `src-tauri/Cargo.lock` is intentionally tracked for reproducible Rust builds.
- Build artifacts under `dist/` and `src-tauri/target/` are intentionally ignored.
