# Aster 3.0.9 — keyboard activation of tab close buttons

A real Electron regression test found that the parent tab's Enter/Space handler prevented native keyboard activation of its nested close button. The handler now processes those keys only when the tab itself is the event target. Focused close buttons receive normal Enter/Space activation; direct tab activation is unchanged.

Six real keyboard checks passed before packaging: horizontal/vertical group heading focus, close-button focus during metadata changes, no address-bar focus theft, and actual tab closing with Enter and Space. Existing collapsed-group and Site Control regressions passed. Full automated suite: 134 tests passed. All six keyboard checks passed against the packaged and installed executables. Packaged collapse and Site Control regressions passed. Installer exited0 and preserved profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.9-results.json and tab-focus-results.json.

This is a focused accessibility fix. It changes no website permissions, profile formats, signing status or external service configuration. It is not a complete accessibility audit or production security certification. Earlier release artifacts are preserved.
