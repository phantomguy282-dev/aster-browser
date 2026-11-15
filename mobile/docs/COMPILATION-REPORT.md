# Aster Mobile — compilation and release report (2026-11-15)

Follows "iOS and Android Compilation 4.0 aster browser.md". Every claim below is backed by an executed command on this machine; nothing is fabricated.

## Summary

| Platform | Source verified | Build completed | Installable artifact | Device tested |
|---|---|---|---|---|
| Android | Yes — Kotlin policy tests 10/10; full source compiles | Yes — `assembleDebug` BUILD SUCCESSFUL (2m 3s) | Yes — debug APK, published on GitHub Releases | **No** — no device or emulator attached (`adb devices` empty) |
| iOS | Yes — sources + XCTest written; **never compiled** | **No** — no Mac/Xcode on this machine | No — no IPA exists | No |

## Android — what was actually done

1. **SDK requirements determined** (from `mobile/android/app/build.gradle.kts`): SDK 35 platform, build-tools 35.0.0, platform-tools; AGP 8.9.2, Kotlin 2.1.20, Gradle 8.11.1, JDK 17+ (JDK 21 present locally).
2. **Missing packages identified**: none of the three were installed; licenses not accepted.
3. **Installed via the official Android CLI** (`mobile/.tools/android-cli/cmdline-tools/bin/android.exe --no-metrics "--sdk=…" sdk install platform-tools "platforms;android-35" "build-tools;35.0.0"`), exit 0. Verified: `platform-tools 37.0.1`, `platforms/android-35 2.0.0` listed as installed; `android.jar` and `aapt2.exe` exist.
4. **Build executed**: `powershell -File mobile/scripts/build-android.ps1 -Mode debug` → `testDebugUnitTest` (no unit tests in module — policy tests live in `mobile/policy-tests`, 10/10 passing) + `assembleDebug` → **BUILD SUCCESSFUL in 2m 3s**, 38 tasks.
5. **Artifact verified** with `aapt2 dump badging` and `apksigner verify --print-certs`:
   - Path: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
   - Size: **2,546,420 bytes**
   - SHA-256: `92ddc82f7c90fd4b9d9633de7ec3dd568a1685cb0a952f4b8bb54da833c18b74`
   - Package `app.aster.mobile.debug`, versionName `4.0.0-preview-debug`, versionCode 1
   - minSdk 28 (Android 9), targetSdk 35; permission: `android.permission.INTERNET` only
   - Signed with the standard **Android debug certificate** (CN=Android Debug) — a development signature, **not** a publisher release identity
6. **Release published** after verification: https://github.com/phantomguy282-dev/aster-browser-android/releases/tag/v4.0.0-preview with the APK asset and release notes (checksum, limitations, build instructions). Source pushed to the same repository (`main`, commit 304ce88).
7. **No signed release APK/AAB**: requires the owner keystore (`ASTER_ANDROID_KEYSTORE`, `ASTER_ANDROID_STORE_PASSWORD`, `ASTER_ANDROID_KEY_ALIAS`, `ASTER_ANDROID_KEY_PASSWORD`). Not created; not fabricated.
8. **Device testing NOT performed**: `adb devices` shows no attached device and no emulator is configured on this machine. Startup/navigation/tabs/downloads/permissions/persistence were not exercised on any device.

## iOS — honest status

- No Mac, no Xcode, no Swift compiler on this Windows machine. Nothing was compiled; no IPA exists.
- Prepared project pushed to https://github.com/phantomguy282-dev/aster-browser-iOS (`main`, commit 28b59a4): Swift sources, XcodeGen `project.yml`, `Tests/SecurityPolicyTests.swift`, `LaunchScreen.storyboard`, `build-ios.sh` (simulator/test/archive/export modes), root `build-ios.bat` stub, `IOS-BUILD.md` owner instructions.
- Owner steps remain: install Xcode 16 + XcodeGen on a Mac → `bash build-ios.sh simulator` → run tests with `ASTER_IOS_DESTINATION` → archive/export only with the owner's Apple team, bundle ID, and export options. No Apple credentials were requested or stored.

## Website

- `website/index.html#mobile` updated with the verified Android release (link, package, version, API level, debug-certificate warning, SHA-256, size) and explicit iOS unavailability (no IPA/TestFlight/App Store).
- `node website/verify.cjs` → PASS (81 local links/assets; manifest installer SHA-256 validated).
- `node website/smoke.cjs` → PASS (desktop 1440px and mobile 390px layouts, download link + hash, zero page errors).
- Source pushed to https://github.com/phantomguy282-dev/Aster-website (`main`, commit 21be70c) with README and `.gitignore` excluding `downloads/` (installer exceeds GitHub's 100 MB file limit; README documents distribution via Releases and local placement for verification).

## Remaining owner requirements

- Android release signing credentials (keystore + env vars above) → then `build-android.bat release` / `bundle`.
- A device or emulator for real installation testing of the debug APK.
- macOS + Xcode 16 + XcodeGen + Apple developer identity for the iOS build, tests, archive, and any TestFlight/App Store distribution.
- AAB not generated (release-only; blocked on signing credentials).
