# ASTER 5.0 — Phase 4: Extension Support Investigation

## Desktop (existing + 5.0 status)

- `src/main/extensions.cjs` already implements unpacked-folder extension loading on Electron's experimental `extensions` API subset: install/enable/remove/details, developer mode. Tests: `tests/extensions-security.test.cjs`.
- Honest scope: **not** Chrome Web Store compatible, no universal MV3 support. Existing UI already states this.

## Android — investigated, result: not implementable

- **Engine**: Android `WebView` (system-updated Chromium) exposes **no extension mechanism** — no content-script injection API, no background-page equivalent, no WebExtensions runtime. This is a browser-engine limitation, not an app-architecture choice.
- **Compatibility layer investigated**: a JS-injection shim could theoretically run content scripts, but (a) requires a JS bridge into pages — which this project explicitly forbids for security (`aster 4.0` brief: "No JavaScript-to-native bridge"); (b) cannot support `chrome.*` APIs (tabs, storage, permissions) without reimplementing an extension host process; (c) would create a silent page-modification surface contradictory to the Download Guard/ Shield trust model.
- **Alternative engine** (GeckoView, system Chromium+extensions forks): would replace the architecture the brief forbids replacing without compelling need, and adds ~100 MB engine binaries. Not justified.
- **Decision**: no extension manager UI on Android. An extension store UI that cannot execute extensions would be a fake button — explicitly not built. Documented in-app.

## iOS — investigated, result: not implementable as conventional extensions

- WKWebView: no extension runtime. Safari Web Extensions require a **containing app distributed with an extension target** and only integrate with Safari, not WKWebView-based apps. Apple's browser-engine rules make a third-engine extension host impossible for this app.
- **Closest alternative implemented at source level**: Mobile Shield content rules (`SFContentRuleList`) — declarative content blocking, the supported mechanism (see Phase 1/7 parity rows). Registration-form autofill via Credential Provider extensions is out of scope for this codebase.

## Security rules reaffirmed

- No silent installs anywhere; no claimed compatibility without testing; extensions (desktop) cannot access the password vault (vault is main-process only, no IPC path exposed to extension processes).

## Status summary

| Platform | Conventional extensions | Alternative implemented |
|---|---|---|
| Desktop | Partial (Electron API subset, unpacked only) | — |
| Android | Not implementable (engine limitation, documented) | Mobile Shield domain lists |
| iOS | Not implementable (Apple restrictions, documented) | SFContentRuleList blocking (source) |
