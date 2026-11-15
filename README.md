# Aster 3.0.14 — security release candidate

A real Windows x64 desktop browser powered by Electron 45 / Chromium. This release expands the original Aster rather than replacing its working architecture.

## Install and launch

- Run **`dist/Aster-Setup-3.0.14.exe`** for graphical installation. Choose a language, destination, shortcuts and optional first-launch import wizard.
- Launch **Aster** from the desktop or Start menu. No terminal, Node.js or editor is needed after installation.
- Without installation: run `dist/win-unpacked/Aster.exe`, keeping its entire directory together.
- For source development: `install.bat`, then `start.bat`. `build.bat` creates the installer.

**Preview, unsigned, not production-hardened.** Windows may show an unknown-publisher warning. No Windows security or TLS checks are disabled. Production publication still needs a responsible operator, code-signing certificate, review and external integration configuration.

## New in 3.0.14

When a tab has keyboard focus, use Left/Right in horizontal layout or Up/Down in vertical layout to select visible tabs. Home/End selects the first/last visible tab. Collapsed groups and nested close buttons retain their existing behavior. See [navigation verification](docs/RELEASE-3.0.14.md).

## New in 3.0.13

Site Control, permission requests and Security Center now translate browser-owned controls and explanations in all eight supported languages. Origins, cookie metadata and unknown diagnostics remain literal; permission values and private-session isolation are unchanged. See [security localization verification](docs/RELEASE-3.0.13.md).

## New in 3.0.12

The six-step setup wizard, default-browser information and protection settings now support all eight interface languages. Stored setting values and explicit Windows/import actions are unchanged. See [setup localization verification](docs/RELEASE-3.0.12.md).

## New in 3.0.11

Saved-workspace controls, explanations and count messages now support all eight interface languages. Saved names, titles and URLs remain unchanged. See [workspace localization verification](docs/RELEASE-3.0.11.md).

## New in 3.0.10

Use **Menu → Saved workspaces** to save normal website URLs, titles and pin state in the current profile. Reopen with confirmation as additional normal tabs; private tabs and browser settings pages are excluded. See [workspace verification](docs/RELEASE-3.0.10.md).

## New in 3.0.9

Focused tab close buttons now respond correctly to Enter and Space. Direct tab activation and group-focus behavior remain intact. See [keyboard repair verification](docs/RELEASE-3.0.9.md).

## New in 3.0.8

Keyboard focus now stays on tab-group headings when you collapse or expand them, and on tab controls during metadata updates. Updates do not steal focus from the address bar. See [accessibility repair](docs/RELEASE-3.0.8.md).

## New in 3.0.7

Click a tab-group heading to collapse or expand inactive members. Your active tab stays visible, Ctrl+Tab reveals the selected member, and search finds collapsed tabs. Collapse state is saved for normal groups and stays temporary for private groups. See [collapse verification](docs/RELEASE-3.0.7.md).

## New in 3.0.6

The profile manager now translates its controls, status messages and explanatory text in all eight supported languages without changing your profile names. See [localization verification](docs/RELEASE-3.0.6.md).

## New in 3.0.5

Right-click a tab → **Tab group…** to create or assign a named, color-coded group. Normal groups persist with the profile; private groups remain temporary. Removing a group keeps its tabs open. See [group verification](docs/RELEASE-3.0.5.md).

## New in 3.0.4

Use the profile name in the toolbar or **Menu → Browser profiles** to create a separate local browsing space. Select it for the next launch and confirm restart. Profiles keep independent cookies, storage, bookmarks and preferences; archiving retains their files. See [profile-manager verification](docs/RELEASE-3.0.4.md).

## New in 3.0.3

State-update bursts now publish one latest snapshot per event-loop turn; unrelated changes preserve tab DOM and keyboard focus. Tab switching no longer writes unchanged session data. Measured tests and limits: [performance patch report](docs/RELEASE-3.0.3.md).

## New in 3.0.2

Site Control now includes saved website zoom. Use the icon beside the address bar, then the zoom controls. Normal zoom is saved by hostname; private zoom stays in memory and is cleared with the private session. See [zoom patch verification](docs/RELEASE-3.0.2.md).

## New in 3.0.1

Use **Menu → Use vertical tabs** for a persistent left tab rail. The existing tab controls, keyboard switching and permission dialogs keep working. Return with **Use horizontal tabs**. See [patch verification](docs/RELEASE-3.0.1.md).

## New in 3.0

Site Control on the address-bar icon, real permission prompts with private isolation, Security Center, configurable protection levels/DoH/WebRTC controls, first-run setup, official Windows default-app registration/status, pinned/reordered/searchable tabs, visible-page screenshots, saved window state and OAuth refresh/update notices.

See [3.0 release report](docs/RELEASE-3.0.md), [security audit](docs/SECURITY-AUDIT-3.0.md) and [owner deployment steps](docs/DEPLOYMENT-3.0.md). Public hosting, live free-provider VPN and production signing are **not completed**. New 3.0 pages are not fully localized. This is not a production-readiness certification.

## What is included

### Everyday browsing
Real navigation, JavaScript, media, independent tabs, titles/favicons, back/forward, duplicate/reopen, bookmarks/folders, history, actual downloads, private sessions, settings and session URL restoration. Modern domains including `.wtf`, IDNs, ports, IPv4/IPv6, queries and fragments are recognized without a TLD whitelist. A connection failure can offer an explicitly confirmed HTTP retry; certificate failures never bypass TLS validation.

### Customization Studio
Open **menu → Customization Studio** (or `aster://studio`). Ten presets, ten color controls, local PNG/JPEG/WebP wallpapers, blur/opacity, typography, density, tab shape, toolbar order, homepage layout and sidebar controls. The CSS editor highlights syntax and previews changes live. Imported CSS is parsed and restricted to supported browser-UI selectors/properties; no remote resources, scripts or website policy changes. Save, preview, install/remove and import/export theme packages. Disable customization to return to the basic light/dark theme. Configuration export/merge creates a backup before replacing preferences and preserves existing bookmarks/shortcuts.

### Protection
**AdBlock** uses a maintained EasyList-compatible engine at the network layer. Click **Update filter lists** to fetch EasyList, EasyPrivacy and URLhaus online-threat filters; until downloaded or custom rules are entered, the UI reports no loaded rules. Add custom rules and per-site allowlists. Counters reflect actual blocked requests, not estimates. Website breakage is possible; allowlist a site or disable blocking to troubleshoot.

**VPN** controls existing Windows VPN connections with saved Windows credentials. Aster does not supply a subscription, servers, countries, kill switch or DNS-leak guarantee. Routing depends on the selected Windows configuration. Discovery is tested; no live tunnel was connected during verification.

### Accounts and migration
**Google account** implements the official Desktop OAuth code flow with PKCE in the system browser, validated identity tokens and OS-encrypted credential storage. A registered Google Desktop client ID must be configured first. Aster does not collect passwords or automatically sign website cookies into Google. Gmail/YouTube/Drive/Calendar shortcuts open the real services. Cross-device synchronization is not implemented.

**Import** discovers browser-profile metadata on request. Explicitly authorize selected categories and confirm the source browser is closed before reading data. Chromium/Firefox bookmarks and history, nested folders, supported search preferences and bookmark HTML are supported with deduplication and skipped-item reports. Passwords, autofill and protected cookies are deliberately not extracted. See [migration guide](docs/MIGRATION.md).

### More tools
- Eight interface languages: English, Brazilian Portuguese, Spanish, French, German, Japanese, Chinese and Italian. Select in Studio; persists immediately. Unknown OS/provider diagnostics and some mixed dynamic metadata remain original; translations have not had native-speaker review.
- Experimental unpacked extensions with manifest/permission review and native installation confirmation. One generated Manifest V3 content script was tested; this is **not Chrome Web Store compatibility**. Review and reinstall new packages manually; no silent extension updates.
- Task manager with actual process IDs, CPU and memory metrics; browser privacy dashboard.
- Signed-update architecture: pinned Ed25519 metadata key, HTTPS, expiry/replay/downgrade checks and installer size/hash verification. **No production feed or trust key is included**, so live updates fail closed until the publisher configures them. Automatic checks are opt-in; download/install require user action.

## Shortcuts

Ctrl+T new tab · Ctrl+W close · Ctrl+Shift+T reopen · Ctrl+Tab next · Ctrl+L address · Ctrl+R reload · Ctrl+H history · Ctrl+J downloads · Ctrl+Shift+N private tab · Ctrl+F find · Ctrl+/−/0 zoom · Alt+Left/Right navigation · F12 developer tools.

## Source and verification

Requires Node.js 24 LTS and Windows x64 for development:

```text
npm ci --include=dev
node node_modules/electron/install.js
npm test
node tests/integration.cjs
node tests/advanced.cjs
node tests/security-regression.cjs
node tests/expansion-integration.cjs
node tests/expansion-live-ui.cjs
npm run build
node tests/packaged.cjs
node scripts/prepare-website.cjs
node website/verify.cjs
node website/smoke.cjs
```

Tests use temporary profiles and generated import/extension fixtures. They do not import your actual browsing history or connect your VPN. Network tests contact public sites and maintained filter sources; their availability varies. Evidence: `tests/artifacts/`. Current detailed status: [EXPANSION-PROGRESS.md](docs/EXPANSION-PROGRESS.md).

Source modules under `src/main/` separate tabs, storage, downloads, security, accounts, migration, filtering, VPN, customization, extensions and updates. `src/ui/` holds the original shell and modular expansion pages/catalogs. `website/` is a deployable static product site, **not yet publicly hosted**; its release manifest is generated from the actual installer bytes, never fabricated.

## Data and limits

Profile data is local in Electron's user-data directory, normally `%APPDATA%/aster-browser`; `ASTER_PROFILE` is an isolated test override. Chromium cookies/cache use its persistent partition. Account tokens are encrypted separately by Electron safeStorage/Windows; ordinary bookmarks/history/settings are not encrypted by Aster. Private pages use a separate in-memory partition; explicitly saved bookmarks and downloaded files remain.

Normal tab URLs persist, not complete navigation stacks; download/recently closed lists remain session-only. Native Chromium sandboxing/context isolation/web security stay enabled. No passwords manager, account sync, DRM/Widevine guarantee, general extension compatibility or commercial security reputation service is claimed. See [privacy](docs/PRIVACY.md), [release notes](docs/RELEASE-0.2.md), [Google setup](docs/GOOGLE-AUTH.md), [VPN](docs/VPN.md), [updates](docs/UPDATES.md), and [website deployment](docs/WEBSITE-DEPLOYMENT.md).
