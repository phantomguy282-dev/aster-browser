# ASTER 5.0 verified metrics (2026-11-15)

- Desktop tests: **173/173** passing (baseline 147 → +7 vault, +7 context menus, +2 capture, +3 devtools, +3 QR, +4 reading mode). Update-artifact tests have documented flakiness only under heavy parallel load (KNOWN_ISSUES.md).
- Android JVM tests: **15/15** (6 PolicyTest, 4 ShieldTest, 5 PasswordStoreTest).
- Android APK (5.0 work, final this round): 2,748,664 bytes, SHA-256 `8F22B17A33301EEFB9C55D0624B38527BCDB03EA17B8BFAD4B9781A2F7C0FDA3` (debug-signed).
- Website checks: verify.cjs + smoke.cjs PASS.
- iOS: 0 compiled artifacts (no Mac/Xcode in environment).
