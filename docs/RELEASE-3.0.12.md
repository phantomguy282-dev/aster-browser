# Aster 3.0.12 — setup, default-browser and protection localization

The six-step first-run wizard, default-browser information page and protection settings page now translate their headings, controls, status messages and explanatory text in all eight supported languages: English, Brazilian Portuguese, Spanish, French, German, Japanese, Chinese and Italian.

## Behavior preserved
- Stored theme, protection-level and DNS-provider values are unchanged by translation.
- Provider names remain literal. External OS/provider diagnostics are escaped and displayed as received, not falsely translated or interpreted.
- Moving through setup never imports data or opens Windows default-app settings automatically. Those remain explicit actions.
- Default-browser UI distinguishes unknown, registered-but-unconfirmed and confirmed HTTP/HTTPS status.
- Standard, Enhanced and Strict explanations retain their technical limitations; strict network cookie headers are not described as comprehensive document.cookie blocking or device-wide protection.

## Verification
- **145 automated tests passed** before packaging, including translation coverage and six-step DOM tests in every language.
- Real Electron tests completed all six steps in all eight languages; theme and protection changes applied correct underlying values. Strict WebRTC policy was checked through the engine API.
- Test instrumentation verified no automatic Windows settings or external browser import calls. No Windows default selection was changed.
- Packaged setup-language, Site Control and workspace-language tests passed.
- Installed setup-language and Site Control tests passed; installed Google navigation succeeded.
- Installer exited0 and preserved the existing profile/catalog file hashes. Evidence: `tests/artifacts/installer-3.0.12-results.json` and `setup-language-results.json`.

## Remaining limits
This is an unsigned release candidate, not production security certification. Native dialogs and unknown OS/provider diagnostics retain their documented language limitations; translations have not had independent native-speaker editorial review. Public hosting, live provider VPN/OAuth and publisher signing/update infrastructure still require legitimate owner setup. This patch does not complete the entire original browser specification.
