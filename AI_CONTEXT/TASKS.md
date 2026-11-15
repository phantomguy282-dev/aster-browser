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
## Phase 8 — Smart features (reading mode, PiP, translation, QR, search, web apps)
## Phase 9 — Judged additions
## Phase 10 — Unified design system pass
## Phase 11 — Sync investigation (documented, no backend exists)
## Phase 12 — Per-platform testing + regression
## Phase 13 — Builds/releases/website (desktop 5.0 artifacts, Android release build if keystore arrives, website 5.0 sections)
## Phase 14 — Final report with parity table

## Standing tasks
- [ ] Android emulator or device for real device testing
- [ ] Owner keystore credentials (env ASTER_ANDROID_*) for signed release/AAB
- [ ] Mac + Xcode 16 for iOS compile/test/archive
