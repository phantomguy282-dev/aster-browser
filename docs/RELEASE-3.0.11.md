# Aster 3.0.11 — workspace localization

The Saved workspaces page now translates its controls, explanations, busy/empty states, pin label, tab counts and operation summaries into English, Brazilian Portuguese, Spanish, French, German, Japanese, Chinese and Italian. Count messages use named placeholders and are escaped before insertion into HTML. Saved workspace names, website titles and URLs remain literal user data.

## Verification
- Translation-key and interpolation-token parity is tested across all eight catalogs.
- Browser DOM tests cover all eight languages, escaped saved content, unchanged names/titles/URLs and 760px layout.
- Real Electron language switching passed all eight locales, including parameterized saved-tab counts.
- Existing workspace privacy, confirmation, append-only reopening, restart and profile-isolation checks passed after localization.
- Full automated suite: 143 tests passed. All eight language checks passed in source, packaged and installed Electron. Packaged and installed workspace privacy regressions passed; packaged Site Control checks passed. Installer exited0 preserving profile/catalog file hashes, and installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.11-results.json and workspaces-language-results.json.

This patch does not change workspace storage or behavior. Native main-process confirmation dialogs and some other 3.0 screens/diagnostics retain their documented language limitations. The translations have not had independent native-speaker review. Public hosting, live provider VPN/OAuth and production signing remain owner-gated; this remains an unsigned release candidate.
