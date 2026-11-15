# Aster 3.0.13 — Site Control and Security Center localization

Site Control, permission requests, remembered site permissions and Security Center now translate browser-owned labels and explanations across English, Brazilian Portuguese, Spanish, French, German, Japanese, Chinese and Italian.

## Behavior preserved
- Website origins, cookie names/paths, extension names/permissions and unknown runtime diagnostics remain literal escaped data.
- Known browser-authored certificate/storage limitations and security-check messages are translated; numeric tab counts use named placeholders. No certificate data, safety scores or permission grants are invented.
- A language change while a permission prompt is open preserves its remember checkbox and focused control. Permission values remain `ask`, `allow`, `block` or `mute` as appropriate.
- Private permission decisions stay separate from normal-profile decisions. Escape still blocks a pending request.

## Verification
- Full automated suite: **147 tests passed** before packaging.
- Translation-key/token parity and browser DOM tests cover eight languages, unchanged origins/data, escaped diagnostics, real check counts, private prompt text, focus and checkbox retention.
- Real Electron tests passed all eight languages with actual notification requests and an open-request language change.
- Packaged Site Control and keyboard-focus regressions passed.
- All eight security languages and open-request language switching passed in the installed executable. Installed Site Control and Google navigation passed. Installation exited0 and preserved existing profile/catalog file hashes. Evidence: `tests/artifacts/security-language-results.json` and `installer-3.0.13-results.json`.

This is a localization patch, not a change to permission policy or a complete security audit. Unknown OS/provider diagnostics and native dialogs retain documented language limitations. Translations have not received independent native-speaker editorial review. Public hosting, live provider VPN/OAuth and signing/update infrastructure remain owner-gated. The release remains unsigned.
