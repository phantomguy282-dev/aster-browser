# Aster 3.0.8 — tab keyboard-focus repair

## Fixed
A real Electron test reproduced focus loss when collapsing a group: the tab list refreshed and removed the focused group heading. The renderer now records the focused tab/group control and restores focus to its matching control after replacement. If that control was removed, it selects an available tab control. Focus is restored only when it was already inside the replaced tab list; updates do not steal focus from the address bar or an open permission dialog.

## Verified before packaging
- Four real Electron checks passed: horizontal heading Enter/Space, vertical heading Enter/Space, close-button focus during metadata updates, and no address-bar focus theft.
- Existing collapsible-group and Site Control real-engine regressions passed.
- Full automated suite: 134 tests passed. All four focus checks passed on source, packaged and installed builds. Packaged group-collapse, Site Control and state-publication regressions passed. Installer exited0 and preserved profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.8-results.json and tab-focus-results.json.

No website permissions, storage formats or external-service settings are changed. This remains an unsigned release candidate; public deployment, provider VPN/OAuth and production signing remain independently owner-gated. This targeted repair is not a complete accessibility audit.
