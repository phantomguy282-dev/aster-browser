# Aster 3.0.2 — saved website zoom

## Implemented
- Site Control now displays the actual saved zoom percentage and offers minus, plus and reset controls.
- Existing menu/keyboard zoom actions use the same bounded preference service.
- Normal preferences persist by **hostname**, matching Chromium's shared host zoom behavior. Scheme/port/path are not independent zoom scopes.
- Private zoom uses a separate in-memory map, does not inherit normal preferences and is discarded after the final private tab closes.
- Zoom changes update other loaded tabs of the same hostname/session type. Navigating to another hostname restores its own preference or 100%.
- Values are validated and bounded; stale Site Control tab/URL targets are rejected. Failed persistence rolls back the preference.
- New labels are included in all eight catalogs. Normal stored zoom is limited to 500 hosts.

## Verification
Four unit tests cover persistence/same-host propagation, private isolation, reset/validation, and write-failure rollback. Five real Electron tests passed: Site Control changes the real guest zoom, same-host sharing, private separation/reset, different-host default, restart persistence/reset and stale-target rejection.

Full unit suite: 119 passed. All five saved-zoom checks passed against source, packaged and installed builds. Packaged vertical-tab and Site Control regressions also passed. Installer exited0 and preserved the profile JSON hash; installed Google navigation passed. See tests/artifacts/installer-3.0.2-results.json. This change does not resolve external OAuth/VPN/hosting/signing requirements or unrelated unfinished 3.0 features. 3.0.0 and 3.0.1 artifacts are preserved.
