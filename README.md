# ASTER Browser (Windows desktop)

ASTER is an independent Windows desktop browser built on Electron + Chromium, with a customizable interface, privacy controls, a security center, profiles/workspaces, tab groups, and — new in 5.0 — an OS-encrypted password manager, element-aware context menus, reading mode, QR codes, and screenshot tools.

> **Status: unsigned preview.** No publisher code-signing certificate is configured. Windows SmartScreen may warn on first run. Verify the SHA-256 published with each release before running an installer.

## Features

- Sandboxed web tabs (`WebContentsView`): no Node in pages, no preload in content, narrow trusted-shell IPC
- Bookmarks with folders, history, downloads with safety guard, private sessions
- Security Center, ad blocking with real loaded filter rules, per-site permissions and zoom
- Profiles, workspaces, tab groups, vertical tabs, session restore (all pre-5.0, preserved)
- **5.0**: Password Manager (`aster://passwords`, DPAPI-encrypted vault, origin-bound, generator, CSV import/export with consent), right-click context menus, reading mode, QR codes, capture-to-clipboard
- Honest limitation notes throughout the UI: no sync backend, no bundled threat intelligence, no VPN service

## Installation

1. Download `Aster-Setup-x.y.z.exe` from [Releases](../../releases).
2. Compare the file's SHA-256 with the checksum in the release notes using a trusted local hashing tool (`certutil -hashfile Aster-Setup-5.0.0.exe SHA256`).
3. Run the installer (per-machine or per-user, choose the install directory in the wizard).
4. Or use the portable build (`Aster-Portable-x.y.z.exe`) — no installation.

System requirements: Windows 10 or 11, 64-bit x64.

## Build from source

```
npm ci
npm test        # 173 tests
npm run build   # NSIS installer + portable into dist/
npm start       # run from source
```

Node.js 20+ and npm are required; a C++ toolchain is not needed (prebuilt Electron).

## Development

- `src/main/*.cjs` — main process modules (security, downloads, extensions, profiles, vault, context menus, …)
- `src/ui/*` — renderer (vanilla JS modules, i18n in `locales/`)
- `tests/` — unit + integration tests (`npm test`), real-app Playwright scripts (`npm run test:tab-navigation` etc.)
- AI agent context: see [`AI_CONTEXT/`](./AI_CONTEXT/) (architecture, parity matrix, handoff log)

## Known limitations

- Unsigned preview (see above); trusted automatic updates require publisher infrastructure not yet configured
- Google account connection needs a registered OAuth client ID
- VPN controls operate existing Windows connections only — no VPN service is included
- No DRM/Netflix-style streaming, no Chrome Web Store sync

## License

MIT — see [LICENSE](./LICENSE).
