# ASTER 5.0 Release Notes (Windows preview · Android debug preview)

**ASTER 5.0 — "Advanced browser experience"** — the three-platform release. Built feature-by-feature across Desktop, Android and iOS with the honest parity rules from the project brief. iOS remains source-prepared only (no Mac/Xcode in the build environment); every other claim below is backed by executed tests or verified artifacts.

## New in 5.0

### Password Manager (Desktop + Android)
- Encrypted credential vault: OS-protected storage on Windows (DPAPI via Electron safeStorage); Android Keystore AES-256-GCM with a non-exportable key
- Strict origin binding — credentials only ever offered to the exact saved HTTPS origin; no cross-origin reuse
- Multiple accounts per site, search, edit, delete, strong password generator
- CSV import/export with mandatory explicit warnings (exports are unencrypted by nature)
- Desktop UI at `aster://passwords` and in the main menu; Android in the browser menu
- Web-form autofill capture: **not implemented** on any platform (Electron/WebView provide no safe hook) — the copy/suggest flow in the manager is the alternative; documented in-app

### Context menus (Desktop + Android)
- Desktop: full right-click menus aware of what you clicked — links (open/new/private tab/copy), images (open/copy address/save), editable fields (undo/cut/copy/paste/select), selections (copy/search the web), page actions (save page, bookmark, print, view source, inspect element), tab actions (duplicate/pin/reopen closed/close)
- Android: long-press link and image actions (open, copy, share), page action sheet, tab action sheet with close-others

### Developer tools (all platforms where the engine allows)
- Desktop: Inspect Element at the exact click point, Chromium DevTools, view-source tabs — real engine tooling, not a mock panel
- Android: chrome://inspect remote debugging enabled in debug builds only
- iOS: `isInspectable` documented, requires Xcode

### Screenshots (Desktop + Android)
- Desktop: capture visible page to file or clipboard
- Android: visible-page capture saved to Pictures/Aster via MediaStore (full-page capture not implemented — stated in-app)

### Tab management (Android)
- Tab manager sheet: switch, reopen recently closed (12-deep stack), close other tabs

### Security Center (Android)
- One-tap dashboard: HTTPS status, Safe Browsing state, Mobile Shield rule counts, cookies, Download Guard status, permission state, password vault status — with explicit "not anonymity" disclaimers

### QR codes (Desktop)
- "Show QR code" for any web page — preview and save as PNG (URL-validated)
- Android: honest fallback (copy/share; no QR encoder bundled with the OS SDK — stated in-app)

### Reading mode (Desktop)
- Article extraction with density scoring, rendered in a clean internal view; refuses non-article pages with a clear message
- Android: not implementable without a page-JS bridge (forbidden by the security model) — documented

## Verified quality gates
- Desktop: **173/173 automated tests** (147 pre-existing + 26 new for 5.0 features)
- Android: **15/15 JVM tests** (navigation policy, shield, download risk, password store)
- Android APK rebuilt with all features: `app-debug.apk` — SHA-256 published with the release
- Known issue: two update-artifact tests are intermittently flaky under heavy parallel test load (pass standalone and in consecutive full runs) — documented, not hidden

## Platform honesty
- **iOS**: source project prepared (Swift/WKWebView, XcodeGen, XCTest suite) and pushed, but never compiled — building requires macOS + Xcode + the owner's Apple identity. No IPA exists. No TestFlight/App Store listing.
- **Android release signing**: the published APK is debug-signed (development identity). Release/AAB builds require the owner's keystore credentials.
- No sync backend, no VPN service, no threat-intelligence feed: none exist, none claimed. Mobile Shield uses only user-imported lists.
- Private browsing on Android remains unavailable by design (WebView storage is process-scoped) — the app says so rather than faking it.
