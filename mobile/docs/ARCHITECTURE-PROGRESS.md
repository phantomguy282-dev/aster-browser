# Aster Mobile 4.0 — architecture and progress

## Scope and preservation
This is an additive mobile edition in `mobile/`; the working Electron desktop browser is not being rebuilt. Existing source/website backup: `dist/Aster-before-mobile.zip` (includes existing website download binaries, therefore large). Desktop package remains 3.0.14.

## Environment audit
Windows host; Node/npm available. Only Java8 JRE found on PATH; no javac/Gradle/Android SDK/adb/emulator/Flutter/Swift/Xcode command found. No Apple signing environment is available. Actual Android artifacts require obtaining JDK17 and Android SDK tools; emulator availability and virtualization must be checked. No APK/AAB/IPA has been built at this point.

## Architecture choice
Native Kotlin + Android WebView, native Swift + WKWebView. React Native and Flutter were considered: both still need platform-specific browser-engine and permission/download delegates; adding a framework would not remove those security obligations and adds a bridge/build dependency. Native engines provide direct lifecycle and OS permission integration. Electron is not a mobile engine. Android WebView provides Chromium-compatible rendering through the OS-updated engine, with compatibility limited by installed WebView version. iOS uses supported WKWebView by default; no alternate engine entitlement is assumed.

Shared assets, design palette, policy schema and URL/download fixture cases belong in `mobile/shared/`. Share specification/test vectors, not unsafe web-to-native JavaScript bridges. Platform source owns UI, storage, cookies, permissions and downloads.

## Security implementation rules
- No JavaScript-to-native bridge in arbitrary websites; no permissive TLS challenge bypass or arbitrary intent/custom-scheme launching.
- Per-tab navigation state; explicit user confirmation before download task creation. No auto-opening downloaded files.
- Download metadata is marked unknown when unavailable. Local SHA256/type/size checks are not antivirus; without an actual scanning provider status remains UNVERIFIED or SUSPICIOUS based on concrete type risk, never SAFE merely from a hash.
- No files uploaded to VirusTotal/other providers without separate explicit consent; provider configuration and terms must be reviewed first.
- Threat/content policy must use real imported/maintained lists or supported native Safe Browsing; empty lists show unconfigured state. Test domains are test fixtures only, not fake production threat intelligence.
- Android WebView cookies are process-scoped. Private isolation must use a separately isolated process/profile or be honestly unavailable; never label a shared persistent WebView session incognito.
- WKWebView private tabs use nonPersistent WKWebsiteDataStore; credentials not fabricated.
- Permissions default deny or explicit request; OS grants and website grants are separate, stale/closed navigation requests rejected.
- iOS code/build pipeline can be prepared on Windows, but no IPA or simulator/device test claims without macOS/Xcode evidence.

## Roadmap
1. Obtain project-local Android build prerequisites, preserving host defaults.
2. Implement native Android browser and policy/download modules with tests.
3. Implement native iOS WKWebView browser and reproducible Xcode build/signing workflow.
4. Add Mobile Shield, Download Guard and explicit platform limitations.
5. Expand existing website with truthful platform availability (only enable actual prepared/published assets).
6. Build/test available packages; distinguish debug signing from owner release signing; document owner store/signing requirements.

## Current progress (updated 2026-11-15)
- [x] Read entire 976-line mobile brief.
- [x] Inspect desktop, website, environment; create backup/directories.
- [x] Choose architecture and record privacy/build constraints.
- [x] Android sources written: navigation policy, Mobile Shield, Download Guard/Risk, BrowserStore, native UI (`mobile/android/app/src/main/java/app/aster/mobile/`).
- [x] Kotlin verification: 10 policy tests pass (`mobile/policy-tests/build/test-results/test/`); all Android sources compile against the Android API test jar via `mobile/compile-check` (compileKotlin BUILD SUCCESSFUL; deprecation warnings only). This is **source-level verification only** — no APK, resource merge, emulator or device run has happened.
- [x] Android Download Guard hardened: busy-flag lifecycle for cancel/recheck/remove, collision-free `.aster-<uuid>.part` staging, failed/cancelled cleanup of partial and finalized files, capacity/shield re-check at consent time, disposal drains queued workers, bounded startup restoration (200 records, 1 MiB file).
- [x] Android build handoff: `bootstrap-tools.ps1` (verified checksums), `install-android.bat` (interactive, owner accepts SDK licenses), `build-android.bat` (debug/release/bundle/connected/policy; release requires owner keystore env vars; missing SDK packages fail loudly). Android SDK packages remain **not installed** and licenses **not accepted**.
- [x] iOS sources + XcodeGen spec + `Tests/SecurityPolicyTests.swift` + LaunchScreen storyboard written; `mobile/ios/build-ios.sh` (simulator/test/archive/export modes) and root `build-ios.bat` stub; owner steps in `mobile/docs/IOS-BUILD.md`. **Never compiled; Xcode/signing are owner-gated.**
- [ ] Android SDK installation (owner accepts licenses), then APK/AAB build, resource verification, emulator/device testing.
- [ ] Android instrumentation tests (none exist yet).
- [ ] iOS compile/test/archive on a Mac (owner-gated).
- [ ] Website mobile availability section (truthful; no APK/App Store links until artifacts exist).
- [ ] Research optional threat/reputation providers under explicit-consent terms; none configured.

## Verification categories (keep honest)
- **Implemented + verified here:** Kotlin policy tests; Android source compilation. Desktop untouched (3.0.14).
- **Implemented, build awaiting owner environment:** Android APK/AAB (SDK install + license acceptance), iOS compile/archive (Mac + Xcode + signing).
- **Owner-gated externally:** release signing credentials, Apple team/bundle ID, store metadata, any hosted threat-intelligence provider consent.
- **Unimplemented with technical reasons:** Android private-process isolation (WebView storage is process-scoped), mobile sync/VPN (no backend exists), camera/mic/location (denied in preview).

No mobile apps are publicly available or verified as built yet. No sync backend or mobile VPN service exists; do not imply otherwise.
