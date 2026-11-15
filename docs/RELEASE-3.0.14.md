# Aster 3.0.14 — keyboard navigation in tab lists

When a tab itself has keyboard focus:
- Horizontal layout: Left/Right selects the previous/next visible tab, wrapping at the ends.
- Vertical layout: Up/Down performs the same navigation.
- Home/End selects the first/last visible tab.

The destination receives focus and is scrolled into view. Search-filtered tabs and inactive members of collapsed groups are not included. Groups stay collapsed. Existing Ctrl+Tab behavior is unchanged. Modified key combinations and keys targeted at nested close buttons are not intercepted.

## Verification
Five real Electron checks passed before packaging: orientation-specific wrapping/Home/End, nested-button/nonmatching-key behavior, collapsed-group boundaries, and search-filtered navigation. Existing six keyboard-focus checks and Site Control tests passed. Full automated suite: 147 passing tests. All five navigation checks and six focus checks passed against packaged and installed executables. Packaged collapsed-group and Site Control regressions passed. Installation exited0 and preserved profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/tab-navigation-results.json, tab-focus-results.json and installer-3.0.14-results.json.

This patch changes only browser UI keyboard navigation. It does not change profiles, site permissions, private storage, default-app choices, or external service configuration. It remains an unsigned release candidate and is not a complete accessibility audit.
