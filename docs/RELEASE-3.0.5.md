# Aster 3.0.5 — named tab groups

## Included
Right-click a tab and choose **Tab group…** to create a named group, assign an existing group, rename/recolor it, remove a tab from its group, or remove the group while keeping its tabs open. Group labels and colors appear in horizontal and vertical tab layouts.

Normal group definitions and membership persist within the active browser profile. Duplicating or reopening a normal tab retains a still-existing group. Private groups stay in memory, cannot be assigned to normal tabs, and disappear when the final private tab closes. Private group names and IDs are not written into profile JSON. Group labels are not permissions or security boundaries.

Names and colors are validated and bounded. There are at most 50 groups per session type. Removal never closes tabs. Group controls have translated labels; user group names are preserved as data. Some explanatory prose remains English, consistent with the documented 3.0 localization gap.

## Verification
Four group unit tests passed for persistence, removal, private isolation, invalid input and save-failure rollback. Full unit suite: 130 passing tests. Five real Electron checks passed for UI creation/escaping, assignment/duplicate/reopen, restart/vertical layout, private metadata isolation and editing/removal without closing tabs. Existing real profile-isolation suite passed after grouping integration.

All five group checks passed again against packaged and installed executables. Packaged profile isolation, vertical-tab and Site Control regressions passed. Installer exited0 and preserved existing profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.5-results.json.

## Scope
This is an unsigned patch, not a hosted production service. It does not add group collapse, group-wide closing, workspaces, sync, public hosting, provider VPN provisioning or production signing. Earlier installers/source archives remain preserved.
