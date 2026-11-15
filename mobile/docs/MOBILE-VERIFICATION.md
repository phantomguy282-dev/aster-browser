# Aster Mobile — verification record (2026-11-15)

## Implemented and verified in this environment

- **Android Download Guard hardening** (`mobile/android/app/src/main/java/app/aster/mobile/DownloadGuard.kt`):
  - Busy-flag lifecycle (`busy` AtomicBoolean): cancel/recheck/remove race protection; `Cancelling` state; `Checking` state.
  - Collision-free staging `.aster-<uuid>.part`; rename only when final name free; failed/cancelled transfers delete partial and finalized files and clear stale reports.
  - Consent-time re-check of shield block, item capacity (200), disposal and activity state before creating a transfer.
  - `dispose()` drains queued workers via `shutdown()` so cancellation cleanup executes; startup restoration bounded (200 records, 1 MiB JSON, active states marked interrupted).
  - Startup hash re-inspection only when the file exists; stored ids validated as UUIDs.
- **Kotlin verification (rerun 2026-11-15):**
  - `mobile/compile-check compileKotlin` — BUILD SUCCESSFUL (all Android sources compile against Android API test jar; deprecation warnings only).
  - `mobile/policy-tests test --rerun-tasks` — 10/10 PASSED (PolicyTest ×6, ShieldTest ×4).
- **iOS build handoff completed:**
  - `mobile/ios/Tests/SecurityPolicyTests.swift` (XCTest policy suite) and `mobile/ios/Resources/LaunchScreen.storyboard` added.
  - `mobile/ios/build-ios.sh` (simulator/test/archive/export) and root `build-ios.bat` honest stub.
  - `mobile/docs/IOS-BUILD.md` documents owner-gated prerequisites (Mac, Xcode 16, XcodeGen, team/bundle id, export plist).
- **Website truthfulness:** `website/index.html` gained a "#mobile" section stating Android/iOS are source previews with no APK/IPA/TestFlight/App Store availability. `node website/verify.cjs` PASS (79 local links, manifest + installer SHA-256 match); `node website/smoke.cjs` PASS (desktop + 390px layouts, download link/hash, no page errors).
- **Progress record:** `mobile/docs/ARCHITECTURE-PROGRESS.md` updated with status, verification categories and honest gates.
- **Desktop preserved:** no desktop source/installer/profile changes; package stays 3.0.14.

## Awaiting owner environment (not verified here)

- Android SDK packages not installed; licenses not accepted → no APK/AAB, resource merge, emulator or device test.
- Release signing requires owner keystore env vars (`ASTER_ANDROID_*`); debug builds use a development signature.
- iOS: never compiled; Xcode/build/test/archive require macOS + owner Apple identity.
- No instrumentation tests exist yet for Android.

## Unimplemented, with reasons

- Android private browsing remains explicitly unavailable (WebView storage is process-scoped).
- Camera/microphone/location denied in preview; no permission plumbing implemented.
- No threat-intelligence provider configured; Mobile Shield uses user-imported lists only; local download checks are not antivirus and never yield SAFE.
