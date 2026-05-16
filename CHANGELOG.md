# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

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
