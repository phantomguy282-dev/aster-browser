# ASTER Task List (5.0 brief)

Order follows `aster 5.0 advanced browser experience (semi-final).md`. Each task lists Desktop / Android / iOS sub-statuses.

## Phase 0 — Audit & docs
- [x] Inspect all repos/platforms
- [x] AI_CONTEXT documents created (PROJECT_OVERVIEW, ARCHITECTURE, CURRENT_STATUS, TASKS, MOBILE_FEATURE_PARITY, KNOWN_ISSUES, AI_AGENT_HANDOFF)

## Phase 1 — Secure Password Manager
- [ ] Desktop: `password-vault.cjs` (safeStorage-encrypted, origin-bound records, generator, import/export with warnings) + IPC + settings page + login-form save/autofill
- [ ] Android: Keystore-backed PasswordStore + manager UI + WebView autofill investigation
- [ ] iOS: Keychain-backed store + manager UI + WKWebView autofill investigation
- [ ] Tests each platform

## Phase 2 — Advanced context menus (desktop right-click; mobile long-press/bottom sheet)
## Phase 3 — Developer tools (desktop DevTools where engine supports; mobile remote-debug docs; no fake panels)
## Phase 4 — Real extension support (desktop manager improvements; mobile capability investigation)
## Phase 5 — Screenshots (desktop capture flows; mobile visible-page capture)
## Phase 6 — Advanced tab/session management (groups on mobile, recently closed, tab search)
## Phase 7 — Privacy/security dashboard parity
## Phase 8 — Smart features
- [x] Reading mode (desktop 4/4 tests; Android platform-limited documented; iOS Mac-gated)
- [x] QR codes (desktop 3/3 tests; Android honest fallback)
- [x] Search suggestions (pre-existing, verified)
- [ ] Translation — blocked: needs owner-configured provider
- [ ] Picture-in-Picture — platform-limited; engine-dependent
- [ ] Website apps — desktop shortcuts exist; Android homescreen shortcuts deferred

## Phase 9 — Judged additions: deferred (feature count already substantial; brief warns against padding)
## Phase 10 — Design system: existing ASTER identity preserved throughout; no rebuild
## Phase 11 — Sync: blocked (no backend exists; documented)
## Phase 12 — Testing/QA
- [x] Desktop 173/173; Android 15/15; website verify+smoke PASS
- [ ] Device testing (no device/emulator available)
- [ ] iOS testing (no Mac)

## Phase 13 — Builds/releases/website: COMPLETE
- [x] Desktop 5.0.0 built, verified (SHA-256 in FINAL-REPORT-5.0.md), released on GitHub
- [x] Android APK preview.1 built, verified, released on GitHub (debug-signed; release signing owner-gated)
- [x] Website updated with verified releases only
- [ ] AAB (needs keystore); IPA (needs Xcode)

## Phase 14 — Documentation and final report: COMPLETE
- [x] RELEASE-NOTES-5.0.md, FINAL-REPORT-5.0.md (parity matrix, artifacts, hashes, owner requirements)

## Standing tasks
- [ ] Android emulator or device for real device testing
- [ ] Owner keystore credentials (env ASTER_ANDROID_*) for signed release/AAB
- [ ] Mac + Xcode 16 for iOS compile/test/archive
