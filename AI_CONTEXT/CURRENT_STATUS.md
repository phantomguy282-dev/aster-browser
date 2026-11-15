# ASTER Current Status (updated 2026-11-15 — ASTER 5.0 endgame)

## Releases (all published and verified)
- **Desktop 5.0.0**: https://github.com/phantomguy282-dev/aster-browser/releases/tag/v5.0.0 — `Aster-Setup-5.0.0.exe`, 122,200,847 bytes, SHA-256 `ff8dec79fc1583f39733b924812c3461db775a31ff0a9a813d7106196d6a150b`, unsigned preview. **173/173 tests**.
- **Android v4.0.0-preview.1**: https://github.com/phantomguy282-dev/aster-browser-android/releases/tag/v4.0.0-preview.1 — APK 2,748,664 bytes, SHA-256 `8f22b17a33301eefb9c55d0624b38527bcdb03ea17b8bfad4b9781a2f7c0fda3`, debug-signed. **15/15 JVM tests**. Includes ASTER 5.0 parity features.
- **iOS**: source-only (main branch), never compiled — Mac/Xcode-gated.
- **Website**: https://github.com/phantomguy282-dev/Aster-website main — 5.0 sections, manifest matches the verified installer; verify.cjs + smoke.cjs PASS.

## Final documents
- `AI_CONTEXT/RELEASE-NOTES-5.0.md` — user-facing release notes
- `AI_CONTEXT/FINAL-REPORT-5.0.md` — parity matrix, artifacts, hashes, owner requirements
- `AI_CONTEXT/MOBILE_FEATURE_PARITY.md` — per-feature per-platform statuses

## Environment
- Windows host. `mobile/.tools/`: JDK 21, Gradle 8.11.1, Android SDK (platform 35 + build-tools 35.0.0 + platform-tools installed; licenses accepted via CLI). adb present, **no devices/emulators**.
- No Mac/Xcode. Desktop project dir is **not** a git repo; publishes happen from clean temp copies.

## Active work
- Brief: `aster 5.0 advanced browser experience (semi-final).md`.
- **Desktop** (5.0 work): Password Manager complete except login-form capture (154→163 tests incl. 7 vault + 7 context-menu + 2 capture tests, all passing); context menus implemented; captureCopy added.
- **Android** (5.0 work): Password manager (Keystore) + long-press context menus + page capture + tab manager (reopen-closed/close-others) implemented; **15/15 Kotlin tests; APK rebuilt** — `app-debug.apk` 2,744,004 bytes, SHA-256 `7C99510E03D1B98244688B776501D1C2592A9053A387E72DDE8C7854339BB447` (debug-signed; device verification still pending).
- **iOS**: all 5.0 features Mac-gated; source-level only.
- Phase 0 done; Phases 1, 2, 5, 6 addressed on desktop+Android per parity rules; remaining phases queued in TASKS.md.
