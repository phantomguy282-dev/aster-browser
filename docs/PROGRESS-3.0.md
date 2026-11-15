# Aster 3.0 — delivered release candidate status

## Outcome
The existing browser was upgraded and packaged as **3.0.0, unsigned release candidate**. This is not a completed production ecosystem or independent security certification. The remaining owner-gated and unsupported work is explicitly listed below.

## Artifacts and preservation
- Installer: `dist/Aster-Setup-3.0.0.exe` (121,941,772 bytes).
- Portable launcher: `dist/Aster-Portable-3.0.0.exe` (110,996,273 bytes).
- Installed: `%LOCALAPPDATA%/Programs/Aster/Aster.exe`.
- Website: `website/`, with matching actual installer copy and generated checksum metadata; **not publicly deployed**.
- Pre-change source backup: `D:\dsh-workflow\projects\aster-before-3.0-audit.zip`.
- Installer returned exit0 and existing profile JSON was unchanged byte-for-byte by upgrade. HTTP/HTTPS capability registration and quoted launch command were inspected. Windows UserChoice/default selection was not changed.
- Uninstaller generated and present; destructive uninstallation was not run against the user's installed browser.
- Hashes: `docs/SHA256SUMS-3.0.txt`.

## Implemented and tested
- Security audit before code changes; exact trusted UI URL/sender/frame IPC, bounded payloads, malformed-profile preservation, Windows download name hardening.
- Extension staged package review with content hashes, verified reload, contained UUID paths, symlink/junction rejection. Legacy packages without integrity records require re-review.
- Site Control from lock icon; real notification Ask/Allow/Block flow and separate private decisions; camera/microphone type separation and origin/frame/stale/revocation validation covered by handler tests. Sound, popup and download policies backed by browser hooks.
- Security Center reports actual live engine webPreferences and explicit configuration statuses, not invented scores.
- Standard/Enhanced/Strict modes, fixed-provider secure DNS, WebRTC policy and cross-host network header restrictions. Strict is network Cookie/Set-Cookie suppression, not complete JavaScript-cookie/storage prevention.
- First-run wizard and reopenable setup, appearance/privacy/import choices, official Windows default-app settings launcher and read-only real association status.
- Refined reduced-motion-aware UI, system theme, tab pin/reorder/search, visible-page screenshot, fullscreen, window-size/maximized persistence.
- OAuth refresh, expiry status and cancellation; signed critical-update flag, in-browser notices/snooze/notes, opt-in verified auto-download and next-start installer-attempt status.
- Public deployment verifier/workflow prepared with real-file checksum validation, pinned official Actions, owner-triggered Pages deployment and public HTTPS checks. Local fixture tests passed; no authenticated deployment was available.

## Verification evidence
- Latest completed full unit/contract suite: **114 passing tests**, zero failures. Covers prior features, security, OAuth refresh, site permissions, protection, Windows status, extension tamper and public-release validation.
- Site Control real Electron: **5 passed**, including real notification prompt/private denial, setup completion and actual WebRTC policy. Rerun against packaged and installed executable successfully.
- Lifecycle real Electron: pin/reorder/search, real PNG capture, restart/window/pinned persistence passed. 12 tabs yielded13 webContents; closing11 left2. Rerun on packaged executable successfully.
- Prior advanced suite13, security regression6 and expansion19 checks passed after security integration.
- Installed app opened Google through the actual address bar.
- Portable final smoke: real Google navigation recorded in isolated profile and clean shutdown confirmed. Initial Playwright attachment failed through self-extracting launcher; an early-close test interrupted startup. Those failures were not treated as success; final native launch waited for navigation and passed.
- Site UI fixture tests: origin-bound edits, stale panel dismissal, private prompt, redaction, focus/Escape and narrow layout passed.
- Website: five pages/79 local links-assets, matching actual binary SHA-256, desktop/mobile layout and download UI passed.
- npm audit: zero reported vulnerabilities. Lockfile production package/license/integrity metadata in SUPPLY-CHAIN-3.0.json; not proof of malicious-package absence or legal review.

## Implemented but awaiting external setup
1. Google OAuth: owner Desktop client registration and interactive consent. Exact loopback redirect shape and owner steps in GOOGLE-AUTH.md. No live Google login tested.
2. Publisher updates: owner Ed25519 public key/private signing process, direct HTTPS feed/artifact host and Authenticode certificate. No fabricated signing key or live production updater installation.
3. Public website: owner repository/hosting authorization, real public release upload, operator/contact/legal details. DEPLOYMENT-3.0.md and PUBLIC-DEPLOYMENT-3.0.md give exact steps. No domain reserved or URL claimed deployed.
4. VPN: official Proton free plan and companion Windows-client path researched in VPN-3.0.md. Existing Windows VPN controls are retained; no provider account or connection/routing authorization was supplied. Automatic Proton integration and actual connected free VPN are **not completed**.

## Not implemented / remaining limitations
Concurrent multi-profile windows and destructive profile deletion, workspaces/split screen, password manager, complete fingerprinting protection, per-site JavaScript/autoplay/hardware-device chooser controls, live TLS certificate detail extraction, full localization of new3.0 text, full rollback installer and broad extension compatibility. UI and native animations were refined, not a wholesale native window animation engine. Physical camera/microphone/location grants have not been tested with real devices; unit media decisions do not prove hardware acquisition. No fake controls are exposed for unsupported capabilities.

Audit performance follow-up remains: synchronous filter parsing and full-state serialization. Same-user malware may modify user-owned files after validation; hashes/DPAPI are not protection from a compromised Windows account. Human visual/accessibility/native-speaker review and production security review are still required.

## 3.0.1 follow-up — vertical tabs
Implemented a persistent left tab rail with matching main-process guest bounds, responsive width, unchanged tab controls and configuration backup support. New labels are translated across the eight catalogs. Five real Electron checks passed against source, unpacked and installed patch. Full unit suite: 115 pass. Existing Site Control and lifecycle suites passed against the packaged patch. Installer exited0 and user profile JSON hash was unchanged. Existing3.0.0 artifacts preserved. See RELEASE-3.0.1.md and tests/artifacts/installer-3.0.1-results.json. Other unfinished local work and external account requirements above remain open.

## 3.0.2 follow-up — saved website zoom
Saved hostname zoom is implemented with Site Control controls and existing menu/keyboard actions. Private preferences are memory-only, independent of normal zoom, and cleared after the last private tab. Four unit tests and five real Chromium checks passed. Full unit suite119 passed. Packaged and installed zoom tests passed; installer exited0 preserving the user profile JSON hash and the installed browser loaded Google. New labels translated in all eight catalogs. See RELEASE-3.0.2.md. This patch does not complete profile management, external services or the other limitations above.

## 3.0.3 follow-up — measured state and persistence efficiency
Coalesced synchronous UI state bursts (100 requests -> one built/sent snapshot), retained unchanged tab DOM/focus, and eliminated unchanged-session writes on tab activation (20 switches -> zero writes). Permission layout hiding remains synchronous. Source/packaged/installed measurement checks passed; packaged vertical-tabs/zoom/lifecycle regressions passed. Full unit suite122 passed. Installer exited0 preserving user profile JSON and installed Google navigation passed. Full snapshot contents and synchronous filter parsing remain further optimization opportunities; no overall CPU/RAM savings percentage is claimed. See RELEASE-3.0.3.md.

## 3.0.4 follow-up — local browser profiles
Added toolbar profile selector, empty profile creation, rename, explicit next-launch selection/restart, and non-destructive archive/restore. Default profile stays in place; additional UUID directories are validated and use separate Electron userData/sessionData before session creation. Four catalog tests and six real Electron isolation checks passed in source/packaged/installed runs. Full unit suite126 passed. Persistent cookies/localStorage/bookmarks/preferences remain separate across real process restarts. Restart scheduling confirmation was tested with relaunch/quit spies; no private tabs are restored. Installer exited0 preserving existing profile/catalog file hashes and installed Google navigation passed. Profile UI currently English; one profile runs at a time. See RELEASE-3.0.4.md. External-service requirements remain unchanged.

## 3.0.5 follow-up — named tab groups
Added named/color-coded group creation, assignment, editing and non-destructive removal. Normal definitions and memberships survive profile session restoration; duplicate/reopened tabs retain valid groups. Private groups cannot cross session types and are omitted from profile JSON, then discarded after the last private tab closes. Four group unit tests and five real Electron checks passed; full suite130 passed. Packaged/installed group tests and packaged profile/vertical/Site Control regressions passed. Installer exited0 preserving existing profile/catalog hashes and installed Google navigation passed. See RELEASE-3.0.5.md. Group collapse and workspaces remain unimplemented.

## 3.0.6 follow-up — profile localization
Translated profile-manager controls, statuses and explanatory prose in all eight languages, retaining user names as data. Full automated suite132 passed; profile DOM coverage and narrow-layout tests passed. All eight locales passed on packaged and installed Electron; profile-isolation and tab-group regressions passed on the package. Installer exited0 preserving existing profile/catalog file hashes; installed Google navigation passed. No public deployment, live provider VPN/OAuth or production signing is claimed. See RELEASE-3.0.6.md.

## 3.0.7 follow-up — collapsible groups
Group headings now collapse/expand inactive tab controls without closing or suspending pages. Active tabs remain visible, keyboard cycling reveals the newly active member, and search temporarily shows matches without changing saved collapse. Normal collapse persists; private collapse remains memory-only. Full unit suite134 passed. Five real checks passed in source, packaged and installed builds; existing group/vertical/Site Control regressions passed. Installer exited0 preserving profile/catalog hashes and installed Google navigation passed. See RELEASE-3.0.7.md. Collapse is not a memory-saving suspension feature; no CPU/RAM savings claimed.

## 3.0.8 follow-up — keyboard focus repair
Reproduced and fixed focused group-heading loss on tab-list replacement. Matching group/tab controls regain focus after rendering; updates do not steal focus from the address bar or existing permission dialogs. Four real tests passed on source, packaged and installed builds. Full automated suite134 passed; packaged collapse/Site Control/state-publication regressions passed. Installer exited0 preserving profile/catalog hashes and installed Google navigation passed. See RELEASE-3.0.8.md. This is a targeted fix, not full accessibility certification.

## 3.0.9 follow-up — keyboard close-button activation
Reproduced and fixed parent-tab interception of Enter/Space on nested close buttons. Six real keyboard tests passed on packaged/installed builds; existing group-collapse and Site Control checks passed. Full automated suite134 passed. Installer exited0 preserving profile/catalog hashes and installed Google navigation passed. Source and earlier artifacts retained. See RELEASE-3.0.9.md. External hosting/VPN/OAuth/signing requirements and separately listed unsupported features remain open; no full-project completion claim.

## 3.0.10 follow-up — saved local workspaces
Added bounded per-profile snapshots of normal HTTP/HTTPS URLs, titles and pin state. Private/internal tabs and credentials/page contents are excluded. Reopening requires native confirmation and appends normal tabs without replacing current tabs; deletion only removes the snapshot. Seven workspace unit tests and five real tests passed; full suite141 passed. Packaged profile/Site Control/keyboard regressions passed. Installed workspace tests and Google navigation passed; installer exited0 preserving profile/catalog hashes. Workspace prose is English and snapshots do not preserve groups/cookies/forms. See RELEASE-3.0.10.md. External hosting/VPN/OAuth/signing prerequisites remain open.

## 3.0.11 follow-up — workspace localization
Translated saved-workspace controls, explanatory text, count messages and statuses in eight locales while preserving saved names/titles/URLs. Full automated suite143 passed. DOM and real source/packaged/installed Electron language checks passed in all eight locales. Workspace privacy/persistence regressions passed against the installed build. Installer exited0 preserving profile/catalog hashes; Google navigation passed. See RELEASE-3.0.11.md. Native confirmation dialogs and other previously documented limitations remain. Public hosting, provider VPN/OAuth and production signing are not configured by this patch.

## 3.0.12 follow-up — setup localization
Translated all six setup steps, default-browser information and protection settings in eight languages without changing stored values or automatically invoking Windows settings/import. Full automated suite145 passed. Real source/packaged/installed Electron setup flows passed across all locales, with actual theme/protection settings and strict WebRTC policy checks. Packaged/installed Site Control and packaged workspace-language regressions passed. Installer exited0 preserving profile/catalog hashes; installed Google navigation passed. See RELEASE-3.0.12.md. Native OS/provider diagnostics, public hosting, live provider VPN/OAuth and production signing remain outside this patch.

## 3.0.13 follow-up — security-panel localization
Translated browser-owned Site Control, permission request, remembered-rule and Security Center text in eight locales, preserving literal origins/cookie metadata/extension names and unknown diagnostics. Full automated suite147 passed. Source/packaged/installed real Electron language tests passed for all eight locales and pending-prompt language switching; checkbox/focus and private isolation stayed intact. Installed Site Control and Google navigation passed. Installer exited0 preserving profile/catalog hashes. See RELEASE-3.0.13.md. This closes the scoped localization task, not the full original brief; native/provider language gaps and external hosting/VPN/OAuth/signing requirements remain.

## 3.0.14 follow-up — tab keyboard navigation
Added orientation-aware arrows and Home/End for visible focused tabs. Targets receive focus and scroll into view; hidden collapsed/search-filtered tabs are skipped, modified shortcuts and nested close buttons are not intercepted. Five real navigation checks and six focus checks passed against packaged and installed builds; packaged collapse/Site Control checks passed. Full automated suite147 passed. Installer exited0 preserving profile/catalog hashes; installed Google navigation passed. See RELEASE-3.0.14.md. External services and other documented original-brief limitations remain open.
