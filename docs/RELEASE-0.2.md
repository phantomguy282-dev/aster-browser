# Aster 0.2.0 expansion preview — release notes

## New
- Modern URL/IDN/IPv6 handling and explicit connection-error HTTP retry without TLS bypass.
- Official Google Desktop OAuth integration with PKCE, loopback callback validation, OS-encrypted credentials and secure disconnect.
- Explicit Chromium/Firefox/HTML browser migration preserving folders and avoiding duplicate bookmarks.
- Real network AdBlock with maintained filter sources, rules/allowlists, source update status and actual request counts.
- Existing Windows VPN connection adapter; no VPN service subscription supplied.
- Customization Studio: ten presets, colors, CSS preview/editor, image wallpapers, layout, theme sharing and configuration backup/merge.
- Eight-language UI catalogs and language/startup settings.
- Experimental unpacked extension management and real process-resource dashboard.
- Privacy dashboard, pinned signed-metadata update infrastructure and five-page static release website.
- Multilingual graphical Windows installer: welcome, location, shortcuts, optional first-launch import, progress/completion/run and uninstaller.

## Bugs found during verification
- URL parser did not cover Unicode domains and some query/port forms; replaced with validated WHATWG URL handling and no TLD whitelist.
- Studio toolbar-order schema ignored supplied order; fixed and regression tested.
- Studio colors lost priority to the basic light theme; inserted user styles now use deliberate priority and protected controls remain visible.
- Default full malware list exceeded the 12 MiB safety limit; changed to maintained URLhaus online-threat list. EasyList, EasyPrivacy and online URLhaus were all actually downloaded and parsed.
- Installer-only custom NSIS functions/variables leaked into uninstaller compilation and Spanish language ID did not match Modern Spanish; corrected instead of disabling warnings-as-errors.
- Expanded menu could overflow smaller windows; bounded scrolling added.

## Verification
71 unit/contract/security tests pass, including real local HTTPS signed-update transport and cancellation. Existing real Electron browsing, advanced media/download/shortcut tests and security regressions are retained. Expansion integration: 19 checks pass, including real request blocking, shell-only CSS, persistence, generated SQLite migration, MV3 content-script lifecycle, process metrics and fail-closed unconfigured services. Live UI: 15 checks pass including all eight language switches, color/theme reset/disable behavior, narrow layout and all three actual filter-list sources. Website link/hash validation and desktop/mobile browser smoke tests pass. Detailed evidence is retained in `tests/artifacts/` and website verification outputs.

## Do not confuse integration code with a provisioned service
Live Google account consent has not been tested without your registered client. VPN discovery/adapter behavior were tested, but no real tunnel was connected. Production signed updates need your pinned public key, protected private signing key and actual HTTPS publisher feed; no live update install was performed. No code-signing certificate or public website hosting/domain/contact identity was provided. Those are release prerequisites, not simulated functionality.

This is a usable **unsigned expansion preview**, not a claim of fully production-ready browser security or complete compatibility. Unknown dynamic/OS/provider diagnostics and some mixed metadata may remain original language. Sync, passwords/autofill/protected-cookie migration, general Chrome extension-store compatibility, DRM and a hosted theme marketplace are not implemented. Themes can be shared as validated local packages; architecture permits a future store.

