# Aster 3.0 — release candidate and verification boundaries

This release continues Aster 0.2. It is an **unsigned release candidate**, not a claim of fully provisioned or independently audited production readiness.

## Implemented
- Pre-change security audit and source backup; exact trusted-document IPC, bounded payloads, profile validation/recovery, safer Windows filenames, extension staged review and integrity verification on reload.
- Aster Site Control on the address-bar icon: actual Chromium permission decisions, explicit sensitive requests, distinct camera/microphone, private-only memory decisions, stale navigation/revocation cancellation, sound muting, popup/download policy and site cookie metadata/clearing.
- Security Center with reported engine preferences and configuration checks, not an arbitrary score.
- Standard, Enhanced and Strict protection with engine WebRTC policy, named secure-DNS providers, cross-host referrer and network Cookie/Set-Cookie controls. Network cookie restrictions are not complete DOM/storage isolation.
- First-run setup and default-browser page, official Windows default-app settings flow, read-only actual HTTP/HTTPS status and selectable installer capabilities. Windows UserChoice is never overwritten.
- Accessible subtle transitions, system theme, pin/reorder/search tabs, visible-page PNG capture, fullscreen, saved window dimensions/maximized state. No artificial closing delay.
- OAuth refresh and expiry state, signed critical-update field, update banner with snooze/notes, opt-in verified automatic downloads and installer-attempt recovery state.
- Owner-triggered public Pages workflow with actual public-release download/hash verification before link generation.

## Test evidence before final packaging
114 unit/contract/security tests passed; real Site Control suite 5 passed; lifecycle suite pin/reorder/search/screenshot/window restoration passed, and opening12/closing11 tabs reduced live webContents from13 to2. Existing advanced media/download/shortcut, security and expansion suites passed. Final packaged/installer results are recorded separately in PROGRESS-3.0.md.

## Requires owner authorization/configuration
- Google Desktop OAuth client registration and real interactive account consent. Refresh transport fixtures are not a live Google login test.
- Free VPN: Proton's official free plan and Windows-client route documented in VPN-3.0.md. No provider account was supplied, no automatic Proton tunnel integration or live routing test was performed. Existing Windows configured VPN controls remain available. Do not claim a provider is connected from process presence.
- Public hosting: no authenticated repository/hosting account available. Workflow and exact owner steps are in DEPLOYMENT-3.0.md; no domain or public URL is fabricated.
- Production signing: Authenticode certificate and pinned publisher Ed25519 key/feed must be provided by owner. No production signing key was invented. Public GitHub downloads use redirects; in-app updater intentionally requires its separately configured direct HTTPS policy.

## Not implemented or not fully verified
Full browser profile manager, vertical tabs/groups/workspaces/split view, password manager, complete fingerprinting prevention, per-site JavaScript/autoplay and hardware-device chooser policies, live TLS certificate details, complete localization of new 3.0 pages, connected free-provider VPN, public deployment, full rollback installer and independent security certification. Unsupported Site Control items are not offered as functional switches. Existing multi-language core remains; new pages include English text. OS-native minimize/maximize/close behavior is retained rather than simulated.

The security audit also identifies remaining performance work: full-state serialization and synchronous filter parsing can be improved. Tests do not establish protection against malware already running under the same Windows account. Review SECURITY-AUDIT-3.0.md before sensitive use.
