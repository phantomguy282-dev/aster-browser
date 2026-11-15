# ASTER Architecture

## Desktop (Electron, CommonJS)
- Main process modules in `src/main/*.cjs`; renderer UI in `src/ui/*` (vanilla JS/CSS, i18n via `i18n.js` + `locales/`).
- Web content: sandboxed `WebContentsView` per tab — **no Node in pages, no preload in content**; a narrow trusted-shell IPC bridge only.
- Storage: `store.cjs` JSON profile in `%APPDATA%\aster-browser`; OS-credential encryption via Electron `safeStorage` (pattern established in `account.cjs` for Google tokens — reuse for the password vault).
- Key modules: `security.cjs`, `download-safety.cjs`, `site-control.cjs`, `extensions.cjs`, `profiles.cjs`, `tabs.cjs`, `tab-groups.cjs`, `workspaces.cjs`, `protection.cjs`, `adblock.cjs`, `vpn.cjs`, `updates.cjs`, `windows-integration.cjs`.
- Tests: `node --test tests/*.test.cjs` (147+ tests) plus real-app Playwright scripts (`tests/*-real.cjs`).
- Packaging: electron-builder NSIS + portable (unsigned preview; `dist/Aster-Setup-3.0.14.exe` is the verified current artifact).

## Android (Kotlin)
- `mobile/android/app/src/main/java/app/aster/mobile/`: `MainActivity.kt` (single-activity UI), `NavigationPolicy.kt` (pure JVM URL policy), `MobileShield.kt` (domain lists), `DownloadRisk.kt` + `DownloadGuard.kt` (consent-gated downloads), `BrowserStore.kt` (JSON persistence via AtomicFile).
- 12 independent WebView tabs; INTERNET permission only; SSL errors cancelled; third-party cookies default off; no JS bridge; `intent:`/`file:`/`data:`/`javascript:` navigation rejected.
- Verification: pure-Kotlin tests in `mobile/policy-tests` (10 tests); compile-check harness in `mobile/compile-check`; real build via `mobile/scripts/build-android.ps1` (SDK 35 installed and licensed in `mobile/.tools/android-sdk`).
- No device/emulator available yet (`adb devices` empty).

## iOS (Swift)
- `mobile/ios/Sources/`: `BrowserController.swift` (@main app, WKWebView tabs incl. nonpersistent private tabs), `BrowserStore.swift`, `DownloadCoordinator.swift` (100 MiB cap, HTTPS-only, no redirects), `NativeScreens.swift`, `SecurityPolicy.swift` (WebPolicy/MobileShield/DownloadInspector mirrors).
- Build: XcodeGen (`project.yml`) → `build-ios.sh` (simulator/test/archive/export). Owner-gated: Mac + Xcode 16 + signing identity.

## Shared
- Policy logic is deliberately mirrored per platform (Kotlin / Swift / JS) rather than shared as code: same fixtures and semantics, native implementations. `mobile/shared/` is reserved for schemas/fixture vectors.
- No sync backend exists anywhere; do not imply one.
