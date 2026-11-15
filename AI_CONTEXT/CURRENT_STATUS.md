# ASTER Current Status (updated 2026-11-15)

## Releases
- **Desktop**: 3.0.14 installed and verified (`dist/Aster-Setup-3.0.14.exe`, SHA-256 `6370a2b8…25ab4`, unsigned preview). 147+ tests passing.
- **Android**: real debug APK published — https://github.com/phantomguy282-dev/aster-browser-android/releases/tag/v4.0.0-preview (`Aster-mobile-4.0.0-preview-debug.apk`, 2,546,420 bytes, SHA-256 `92ddc82f7c90fd4b9d9633de7ec3dd568a1685cb0a952f4b8bb54da833c18b74`, debug certificate). Source on `main` (commit 304ce88). Release signing blocked on owner keystore.
- **iOS**: source only on `main` (commit 28b59a4). Never compiled; blocked on Mac + Xcode.
- **Website**: `#mobile` section links the verified APK only; iOS labeled unavailable. verify.cjs + smoke.cjs PASS.

## Environment
- Windows host. `mobile/.tools/`: JDK 21, Gradle 8.11.1, Android SDK (platform 35 + build-tools 35.0.0 + platform-tools installed; licenses accepted via CLI). adb present, **no devices/emulators**.
- No Mac/Xcode. Desktop project dir is **not** a git repo; publishes happen from clean temp copies.

## Active work
- Brief: `aster 5.0 advanced browser experience (semi-final).md`.
- **Desktop** (5.0 work): Password Manager complete except login-form capture (154→163 tests incl. 7 vault + 7 context-menu + 2 capture tests, all passing); context menus implemented; captureCopy added.
- **Android** (5.0 work): Password manager (Keystore) + long-press context menus + page capture + tab manager (reopen-closed/close-others) implemented; **15/15 Kotlin tests; APK rebuilt** — `app-debug.apk` 2,744,004 bytes, SHA-256 `7C99510E03D1B98244688B776501D1C2592A9053A387E72DDE8C7854339BB447` (debug-signed; device verification still pending).
- **iOS**: all 5.0 features Mac-gated; source-level only.
- Phase 0 done; Phases 1, 2, 5, 6 addressed on desktop+Android per parity rules; remaining phases queued in TASKS.md.
