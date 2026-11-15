# ASTER Known Issues & Limitations

## Platform-hard limitations (documented, not bugs)
- Android private browsing: WebView storage is process-scoped → private mode explicitly unavailable on Android.
- Android extensions: system WebView has no extension mechanism → no extension manager can be honestly implemented.
- iOS compilation: requires macOS + Xcode; the dev machine is Windows → iOS source is verified by review only.
- Android release signing/AAB: blocked on owner keystore credentials.
- Sync: no backend server exists on any platform.

## Known code issues (tracked, fix or document)
- **Updates tests intermittently flaky under parallel `node --test` load** (`valid signed HTTPS feed…`, `same-length corrupt artifact…`): pass standalone and in 4 consecutive full runs; observed failing once when many timing-sensitive server tests run concurrently. Pre-existing timing sensitivity, not caused by 5.0 changes. Candidate fix: serialize the two update test files or add retry backoff.
- MobileShield trailing-dot URL-host normalization: potential mismatch for hosts like `example.com.` (low risk, hardening pending).
- MainActivity download progress: refresh cadence coalesced at 350 ms; verify on device.
- Android WebView Safe Browsing availability depends on installed WebView provider — surfaced in UI honestly.
- Desktop: unsigned preview installer triggers SmartScreen; expected, documented.

## Verification gaps (honest)
- No Android device/emulator testing of any feature yet (`adb devices` empty).
- No iOS compile/test ever run.
- Desktop mobile-website section verified only via static + Playwright checks.
