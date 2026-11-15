# Aster 3.0.7 — collapsible tab groups

## Behavior
Click a group heading to collapse or expand it in either horizontal or vertical tab layout. Collapsing hides inactive member controls; it does not close, suspend or unload their websites. The active tab remains visible. Ctrl+Tab can activate a collapsed member, which then becomes visible. Tab search reveals matching members without changing the saved collapse preference.

Normal collapse state persists in the active profile. Private collapse state is memory-only and cannot be modified through a normal-tab group target. It disappears when the final private tab closes. Headings expose expanded/collapsed accessibility state and translated action labels. User group names remain literal data.

## Verification
- Full automated suite: 134 passing tests before packaging.
- Unit tests cover normal persistence, private isolation, strict boolean validation and save-failure rollback.
- Five real Electron checks passed in source, packaged and installed builds: active-content preservation, keyboard cycling, search, restart/vertical layout, and private metadata isolation.
- Existing group-editing/removal, vertical-tab and Site Control regressions passed against the packaged build.
- Installation returned exit0 and preserved existing profile/catalog file hashes. Installed Google navigation passed.
- Evidence: `tests/artifacts/group-collapse-results.json` and `tests/artifacts/installer-3.0.7-results.json`.

## Boundaries
This is an unsigned release candidate. Collapsing a group is a UI organization feature, not a memory-saving suspension mechanism. No CPU/RAM improvement is claimed. This patch does not provision public hosting, live Google OAuth, a provider VPN or signing infrastructure. Existing workspace/split-screen, device-permission and localization limitations remain documented in PROGRESS-3.0.md. Earlier release artifacts remain preserved.
