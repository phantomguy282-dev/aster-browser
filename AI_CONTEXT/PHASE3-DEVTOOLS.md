# ASTER 5.0 — Phase 3: Developer Tools & Inspector

## Desktop (implemented in 3.x/5.0, verified)

- **Inspect Element**: right-click → "Inspect element" (`webContents.inspectElement(x, y)` at the exact click point; falls back to detached DevTools). Also F12 / menu → Developer tools (`openDevTools`, detach mode).
- **DOM/CSS/computed styles/accessibility tree/console/network**: provided by Chromium DevTools via `inspectElement`/`openDevTools` — real engine tooling, not a custom mock panel.
- **View Page Source**: context menu → `view-source:` tab (sandboxed WebContentsView; same navigation policy gates).
- **Element highlighting / selector copying / responsive preview / property copying**: available through Chromium DevTools itself (device toolbar, copy selector/styles).
- Tests: context-menu tests assert `View page source` and `Inspect element` are only offered on web pages, never on internal pages (`tests/context-menus.test.cjs`).

## Android (implemented, device verification pending)

- `WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)` — real remote debugging via **chrome://inspect** on a connected desktop over USB in debug builds; release builds disable it. Full DOM/CSS/console/network inspection through Chrome DevTools.
- **No in-app DevTools UI is faked**: the WebView engine exposes no in-app inspector API. The app's About notice states this.

## iOS (Mac-gated, prepared)

- WKWebView equivalent: `webView.isInspectable = true` (iOS 16.4+) enables Safari Web Inspector on a connected Mac. Planned one-line change in `BrowserController.swift` during the Xcode session; documented here in advance because it cannot be verified without Xcode.

## Honest limits

- No in-app custom DevTools panels exist on any platform by design — building fake ones would misrepresent engine capability.
- Desktop DevTools are Chromium's own; ASTER adds entry points, not a reimplementation.
