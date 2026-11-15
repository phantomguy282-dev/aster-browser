# Aster 3.0.1 — vertical-tabs patch

## Added
- Menu → **Use vertical tabs** moves the existing tabs into a left rail; **Use horizontal tabs** restores the original strip.
- The preference persists across restarts and is included in validated configuration exports/imports.
- The rail uses 220px on wider windows and 180px below 900px. Main-process WebContentsView bounds reserve exactly the same space, so web pages cannot cover tab controls.
- Existing switching, close, pin, drag-reorder and tab search use the same tab instances. No duplicate web renderer is created for the rail.
- New layout labels are translated in all eight existing catalogs.

## Verification
- `npm test`: 115 passing tests after this change, including boolean validation of the exported layout preference.
- `node tests/vertical-tabs.cjs`: five real Electron checks passed in source and packaged builds: menu switch and geometry, keyboard switching, narrow window/internal page layout, permission overlay isolation, restart persistence/horizontal restore.
- Packaged Site Control and lifecycle regressions passed, including 12-tab cleanup, screenshot capture and window/pin persistence.
- Installation returned exit0 and preserved the existing profile JSON hash. All five vertical-tab checks passed again against the installed executable, and Google navigation succeeded. Evidence is recorded in `tests/artifacts/installer-3.0.1-results.json`. Tests use isolated temporary profiles and do not import personal browser data.

## Boundaries
This remains an unsigned release candidate. It does not complete the remaining 3.0 feature list or provision Google OAuth, provider VPN, signing keys or public hosting. See `PROGRESS-3.0.md` for those independent limitations. The 3.0.0 installer and source archive remain preserved; pre-change source backup is `dist/Aster-before-vertical-tabs.zip`.
