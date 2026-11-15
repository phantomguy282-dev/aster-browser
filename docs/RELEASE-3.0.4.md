# Aster 3.0.4 — local browser profiles

## Implemented
- Toolbar profile selector and `aster://profiles` management page.
- Create empty profiles, rename them, select one for the next launch, and confirm restart.
- Archive inactive profiles without deleting their files; restore them later. Default, running and next-selected profiles cannot be archived.
- Existing Default profile stays in its original directory. New profiles use validated UUID directories under `Profiles/`.
- Startup selects both Electron userData and sessionData before creating Chromium sessions. One running Aster process uses one profile at a time; switching requires a restart.
- Bookmarks/history/preferences, Chromium site storage/cookies, extensions and account files use the selected directory. Profiles are not separate Windows accounts and do not protect against another process with access to your Windows user files.
- Profile IDs/names/catalogs are bounded and validated; symlinks/junctions cannot redirect managed profile storage. Invalid catalogs fail visibly without replacing existing data.

## Verified
- Four unit tests: default preservation, unique directories, rename/archive/restore without deletion, invalid catalog/input rejection and junction rejection.
- Six real Electron checks: UI creation, cancelled selection, new-profile storage isolation, return to original persistent cookies/localStorage/bookmarks/preferences, restart confirmation/argument scheduling, and retained archived data.
- Restart scheduling test substitutes only the relaunch/quit calls to inspect confirmation behavior; isolation tests close and launch real new Electron processes.
- Initial cookie test incorrectly used session cookies; corrected fixture uses explicit persistent cookies. All six checks then passed.
- Full regression suite: 126 passing tests before packaging. Vertical-tab and measured state-publication regressions passed after profile integration.
- All six profile checks passed against source, packaged and installed executables. Packaged Site Control, vertical-tab and state-publication checks passed. Installer exited0 and preserved existing profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.4-results.json.

## Usage and limitations
Open the profile name in the toolbar. Create a profile, select it for the next launch, then restart. Current tabs and session data are saved in the current profile; private tabs are not restored. Choosing another profile does not import or copy existing browser contents.

Archiving is intentionally not deletion. To back up all profiles, close Aster and securely copy the entire root directory, including `aster-profiles.json` and `Profiles/`. OS-encrypted credentials may not decrypt on another Windows account/device. New profile-page prose is currently English; existing language controls remain.

This patch does not provision public hosting, live Google OAuth, provider VPN accounts or production signing. Other 3.0 limitations remain documented separately.
