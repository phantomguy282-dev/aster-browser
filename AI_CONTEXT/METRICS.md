# ASTER 5.0 verified metrics (final, 2026-11-15)

- Desktop tests: **173/173** passing (baseline 147 → +7 vault, +7 context menus, +2 capture, +3 devtools, +3 QR, +4 reading mode). Update-artifact tests have documented flakiness only under heavy parallel load (KNOWN_ISSUES.md).
- Android JVM tests: **15/15** (6 PolicyTest, 4 ShieldTest, 5 PasswordStoreTest).
- Desktop installer: `Aster-Setup-5.0.0.exe`, 122,200,847 bytes, SHA-256 `ff8dec79fc1583f39733b924812c3461db775a31ff0a9a813d7106196d6a150b` (unsigned preview; asar verified to contain all 5.0 modules).
- Android APK: 2,748,664 bytes, SHA-256 `8f22b17a33301eefb9c55d0624b38527bcdb03ea17b8bfad4b9781a2f7c0fda3` (debug-signed; all 5.0 parity features included).
- Website: verify.cjs (82 links, manifest↔installer hash match) + smoke.cjs PASS.
- iOS: 0 compiled artifacts (no Mac/Xcode in environment) — honestly documented everywhere.
- All four repositories published with preserved history: aster-browser (v5.0.0 release), aster-browser-android (v4.0.0-preview.1), aster-browser-iOS (source), Aster-website (5.0 sections).

