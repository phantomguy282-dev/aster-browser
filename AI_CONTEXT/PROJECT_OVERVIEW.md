# ASTER Project Overview

ASTER is an independent browser ecosystem with three application platforms and an official website.

## Repositories
1. **Desktop** (this checkout, `D:\dsh-workflow\projects\aster-browser`): Electron 45.3.2 + Chromium via `WebContentsView` sandboxed tabs. Windows 10/11 x64. Version 3.0.14 desktop; mobile edition 4.0.0-preview lives in `mobile/`. NOT a local git repo — publishing is done from clean temp copies pushed to GitHub.
2. **Android** (`mobile/android/`, GitHub `phantomguy282-dev/aster-browser-android`): native Kotlin + system WebView. Package `app.aster.mobile` (debug suffix `.debug`). minSdk 28, targetSdk 35, AGP 8.9.2, Kotlin 2.1.20, Gradle 8.11.1. **Real debug APK published** as release `v4.0.0-preview` (SHA-256 `92ddc82f7c90fd4b9d9633de7ec3dd568a1685cb0a952f4b8bb54da833c18b74`, 2,546,420 bytes).
3. **iOS** (`mobile/ios/`, GitHub `phantomguy282-dev/aster-browser-iOS`): Swift + WKWebView, XcodeGen `project.yml`, XCTest suite. **Never compiled** — no macOS/Xcode on the dev machine.
4. **Website** (`website/`, GitHub `phantomguy282-dev/Aster-website`): static HTML/CSS/JS with CSP; verified by `verify.cjs` + Playwright `smoke.cjs`.

## Governing briefs
- `aster 4.0 mobile edition.md` — mobile edition rules (Mobile Shield, Download Guard, honest limits).
- `aster 5.0 advanced browser experience (semi-final).md` — three-platform feature parity (password manager first), AI_CONTEXT docs, honest statuses.
- Older: `Browser.md`, `second-browser-prompt.md`, `astra 3.0.md`.

## Hard rules
- Never rebuild desktop from scratch; preserve all existing functionality (3.0.14 must keep passing its tests).
- Every desktop feature must be evaluated for Android + iOS in the same work session; statuses tracked in `AI_CONTEXT/MOBILE_FEATURE_PARITY.md`.
- No fake buttons, no fabricated test results, no claimed signing without credentials, no download links to non-existent artifacts.
- Local toolchains in `mobile/.tools/` (JDK 21, Gradle 8.11.1, Android SDK 35 — installed and licensed).
- Build/verify commands: see `AI_CONTEXT/AI_AGENT_HANDOFF.md`.
