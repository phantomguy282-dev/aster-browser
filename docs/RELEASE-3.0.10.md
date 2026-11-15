# Aster 3.0.10 — saved local workspaces

## Included
Open **Menu → Saved workspaces** (`aster://workspaces`) to save the normal website tabs currently open. A snapshot contains only HTTP/HTTPS URLs, titles and pin state. Private tabs, internal browser pages, cookies, credentials, form contents and tab-group metadata are excluded.

Opening a snapshot requires confirmation and adds normal tabs without closing or replacing current tabs. It uses the current profile's normal cookies and records normal history, even when initiated from a private tab; the confirmation explicitly explains this. Rename snapshots or delete them with confirmation. Deleting a snapshot never closes tabs.

Workspaces persist only in their owning local browser profile. Limits: 30 snapshots per profile, 30 website tabs per snapshot, and a live 100-tab guard when reopening. Overlapping reopen operations are rejected. Creation failures are reported; individual network/navigation errors remain visible on tabs. A created tab is not a promise that the website loaded successfully.

## Verification
- Full automated suite: **141 tests passed** before packaging.
- Seven workspace unit tests cover private/internal exclusions, data copies, confirmation, append-only creation, persistence, invalid inputs, rollback, concurrent operations and live tab limits.
- Five real Electron checks passed in source, packaged and installed builds: escaped UI names/private exclusion, cancellation and append-only reopening, restart persistence, profile isolation and non-destructive snapshot deletion.
- Packaged profile isolation, Site Control and keyboard-focus regressions passed.
- Installation exited0 and preserved existing profile/catalog file hashes; installed Google navigation passed. Evidence is recorded in `tests/artifacts/installer-3.0.10-results.json` and `workspaces-real-results.json`.

## Boundaries
This is a saved set of website links, not a live multi-window workspace system, session-cookie export, page backup, synchronization service or suspension feature. The new workspace-page prose is currently English. Existing external hosting, live Google OAuth, provider VPN and production signing requirements are unchanged. The release remains unsigned and does not imply completion of the entire original 3.0 specification.
