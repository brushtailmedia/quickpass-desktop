# QuickPass - Desktop

A standalone, offline desktop password generator built with **Tauri + React**.

QuickPass is deterministic: the same master password + site name + settings always produce the same output. Nothing is stored in a database or sent to a backend.
The password is derived on the fly using BLAKE2S and SHA-256.

Project repo: [brushtailmedia/quickpass-desktop](https://github.com/brushtailmedia/quickpass-desktop)

Download pre-built binaries from [Releases](https://github.com/brushtailmedia/quickpass-desktop/releases).

## What It Is

QuickPass originally started as a Python Tkinter desktop app which I have used privately for many years now. QuickPass Desktop is the native-app edition for macOS/Windows/Linux. There is also a standalone single HTML file version available at [brushtailmedia/quickpass-standalone](https://github.com/brushtailmedia/quickpass-standalone).

- Local-first deterministic password generation
- No account system
- No cloud sync
- No server dependency

The app keeps its own password core in `src/core.js`.

## How It Works

1. You enter a **site name** (for example `github`, `github/work`, or `user@example.com`) and your **master password**.
2. Inputs are combined and expanded using repeated **BLAKE2S** hashing.
3. The expanded key is hashed with **SHA-256** (Web Crypto API in the webview runtime).
4. Bytes are encoded based on output mode:
   - No special chars mode
   - Limited special chars mode
   - Full special chars mode

## Output Options

| Option | Behavior |
|---|---|
| `s/char` off | Uses alphanumeric-safe output (derived from Base64 with `+` and `/` remapped) |
| `s/char` on + limited | Uses `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=` |
| `s/char` on + full | Uses full Base85 symbol set |
| Character length | 8, 10, 15, 20, 32, or 40 |
| Version (`V.1` ... `V.15`) | Changes key expansion rounds for deterministic password rotation |

## Download Pre-Built Binaries

Download official releases here:
- [brushtailmedia/quickpass-desktop/releases](https://github.com/brushtailmedia/quickpass-desktop/releases)

Choose the asset that matches your platform:
- macOS (Apple Silicon): `.dmg` asset labeled `arm64` / `aarch64`
- macOS (Intel): `.dmg` asset labeled `x64` / `intel`
- Windows: `.msi` or `-setup.exe`
- Linux: `.AppImage`, `.deb`, or `.rpm`

## Install From Pre-Built Binaries

### macOS

1. Download the correct `.dmg` for your CPU (`arm64` or `intel`).
2. Open the `.dmg` and drag **QuickPass** into **Applications**.
3. Launch QuickPass from Applications.
4. If macOS blocks first launch, right-click the app and click **Open**.

### Windows

1. Download the `.msi` or `-setup.exe` installer.
2. Run the installer and complete the setup wizard.
3. Launch QuickPass from the Start menu.

### Linux

Use one of the following package formats:

1. AppImage:
```bash
chmod +x QuickPass*.AppImage
./QuickPass*.AppImage
```
2. Debian/Ubuntu (`.deb`):
```bash
sudo apt install ./QuickPass*.deb
```
3. Fedora/RHEL (`.rpm`):
```bash
sudo dnf install ./QuickPass*.rpm
```

## Build From Source

### Prerequisites

- Node.js `v24.14.0` (see `.nvmrc`)
- npm
- Rust toolchain (stable)
- Tauri platform dependencies

Tauri prerequisite guide:
- [https://v2.tauri.app/start/prerequisites/](https://v2.tauri.app/start/prerequisites/)

Linux (Debian/Ubuntu) example dependencies:
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

### Build Steps

```bash
git clone https://github.com/brushtailmedia/quickpass-desktop.git
cd quickpass-desktop
npm ci
npm run test:vectors
npm run tauri:build
```

If you use `nvm`:

```bash
nvm install
nvm use
npm ci
```

Build outputs are placed under:
- App binary: `src-tauri/target/release/`
- Bundles/installers: `src-tauri/target/release/bundle/`

Typical installer outputs:
- macOS: `.app`, `.dmg`
- Windows: `.msi`, `-setup.exe`
- Linux: `.AppImage`, `.deb`, `.rpm`

## Development (Source)

To run in development mode:
```bash
npm run tauri:dev
```

## Testing

Run static checks (ESLint + Rust fmt + Clippy):

```bash
npm run static:check
```

Run all tests (UI/unit + deterministic vectors):

```bash
npm run test:all
```

Run only UI/unit tests:

```bash
npm run test
```

Run only deterministic vectors:

```bash
npm run test:vectors
```

## Security Model

- Password generation is local and deterministic.
- The app code does not use browser storage APIs (`localStorage`, `sessionStorage`, `IndexedDB`).
- No application backend is required.
- Master password is not persisted by app logic.
- Clipboard is explicit: copy requires user action; clear writes an empty value to clipboard.

## Known Risks

- Clipboard history managers may retain copied passwords.
- Malware/keyloggers can bypass application-level protections.

## Project Structure

```text
.
├── src/                 # React UI + password core
├── src-tauri/           # Rust host + Tauri config/icons
├── scripts/             # Deterministic vector tests
├── index.html
├── vite.config.js
└── package.json
```

## License 

MIT. See [LICENSE](LICENSE).
