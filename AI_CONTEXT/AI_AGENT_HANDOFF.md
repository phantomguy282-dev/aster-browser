# ASTER AI Agent Handoff

Read `AI_CONTEXT/PROJECT_OVERVIEW.md`, `CURRENT_STATUS.md`, `MOBILE_FEATURE_PARITY.md` at session start. Update this file before ending a session.

## Environment facts
- Project root: `D:\dsh-workflow\projects\aster-browser` (not a git repo; publish from temp copies with `gh` authenticated as `phantomguy282-dev`).
- Desktop verify: `npm test` (or `node --test tests/*.test.cjs`), Node 24.16.0.
- Kotlin verify:
  ```powershell
  $tool=Get-Content mobile/.tools/environment.json -Raw | ConvertFrom-Json
  $env:JAVA_HOME=$tool.javaHome; $env:PATH="$env:JAVA_HOME\bin;$env:PATH"
  & $tool.gradle -p mobile/policy-tests test --no-daemon --console=plain
  ```
- Real Android build: `powershell -ExecutionPolicy Bypass -File mobile/scripts/build-android.ps1 -Mode debug` (SDK installed; APK at `mobile/android/app/build/outputs/apk/debug/app-debug.apk`).
- Website verify: `node website/verify.cjs` then `node website/smoke.cjs`.
- GitHub publish pattern: copy sources to clean temp dir → `git init -b main` → commit → push to existing repo (never force-push) → `gh release create` with verified artifact.

## Session log
- **2026-11-15 (session A)**: 4.0 mobile completed — Android debug APK built & released (v4.0.0-preview), iOS/website repos pushed, COMPILATION-REPORT.md written.
- **2026-11-15 (session B)**: 5.0 brief accepted. Phase 0 complete: all AI_CONTEXT docs created.
- **2026-11-15 (session C)**: Phase 1 password manager — **Desktop COMPLETE (except login-form capture)**: `src/main/password-vault.cjs` + 12 IPC actions + `src/ui/passwords.js` settings page (aster://passwords, menu entry) + syntax-verified. `npm test` → **154/154**. **Android store+crypto+UI COMPLETE**: `PasswordStore.kt`/`PasswordCrypto.kt`/manager UI/persistence; **15/15 Kotlin tests**; APK rebuilt (SHA-256 `FBC3C72471060D014693F2F4F799589086DABDC20AF7A8FA3B696FD2654AB677`, 2,733,960 bytes). **iOS**: not started (Mac required). Autofill capture: documented platform limits; desktop/Android offer manager-page copy flow.
- **2026-11-15 (session D)**: Desktop UI page wired into app.js render chain + main menu ("Password Manager" → aster://passwords).
- **2026-11-15 (session E)**: Phase 2 desktop context menus: `src/main/context-menus.cjs` (element-aware: page/link/image/editable/selection/tab actions), attached per-tab; 7/7 tests; preload/app `onBookmarkEditor` bridge. Desktop suite **163/163**. Phase 2 Android: long-press menus (link open/copy/share/new tab, image open/copy), page+tab action sheets, `closeOthers`. Phase 5: desktop `captureCopy` (2/2 tests, allowlisted); Android `capturePage()` → MediaStore Pictures/Aster (visible area only, documented). Phase 6 Android: tab manager extended with reopen-closed (12-deep stack) + close-others; compile-check BUILD SUCCESSFUL; 15/15 Kotlin tests; final APK hash in session F output.

- **2026-11-15 (session F)**: Phase 3 complete: desktop DevTools entries verified by tests (3/3); Android `setWebContentsDebuggingEnabled(BuildConfig.DEBUG)` (chrome://inspect, debug-only); iOS `isInspectable` documented Mac-gated. PHASE3-DEVTOOLS.md. Phase 4 complete: honest investigation — Android/iOS conventional extensions not implementable (engine/Apple limits documented in PHASE4-EXTENSIONS.md); no fake store UI built. Desktop suite **166/166** stable (transient parallel-run flakes re-verified clean).

- **2026-11-15 (session G)**: Phase 7 Android: Security Center dashboard sheet added (HTTPS/Safe Browsing/Shield/cookies/Download Guard/permissions/vault status; honest limits text); compile-check BUILD SUCCESSFUL; parity row updated.

- **2026-11-15 (session H)**: Phase 8 QR: desktop "Show QR code" menu + qrGenerate/qrSave IPC (URL-validated, `qrcode` dep, 3/3 tests); Android honest fallback (copy/share; no bundled encoder — documented). Desktop suite **169/169**; update-artifact test flakiness under parallel load documented in KNOWN_ISSUES.md (passes standalone + 4 consecutive full runs). Final APK: 2,748,664 bytes, SHA-256 `8F22B17A33301EEFB9C55D0624B38527BCDB03EA17B8BFAD4B9781A2F7C0FDA3`.

- **2026-11-15 (session I)**: Phase 8 Reading Mode (desktop): `src/main/reading-mode.cjs` scored-density extractor (executeJavaScript in page context, no bridge), `readingExtract` IPC + menu entry; 4/4 tests; **173/173 suite**. Android documented platform-limited (JS bridge forbidden by security model). readerSource contract: returns function source; main invokes with `+"()"`.

- **2026-11-15 (session J — endgame)**: Phase 13/14 complete. Desktop version → 5.0.0, built (`Aster-Setup-5.0.0.exe`, SHA-256 `ff8dec79…a150b`, asar verified to contain all new modules), released https://github.com/phantomguy282-dev/aster-browser/releases/tag/v5.0.0; source pushed to main (installers excluded from git). Android v4.0.0-preview.1 released (APK `8f22b17a…fda3`); source pushed 304ce88→f990424. Website updated (manifest→5.0.0 installer, verify+smoke PASS) and pushed 21be70c→526f1b8. RELEASE-NOTES-5.0.md + FINAL-REPORT-5.0.md (full parity matrix) written. TASKS.md closed out.

## Session ended — all environment-feasible work complete.
