# Aster 3.0.6 — profile-manager localization

The profile-management page now translates its controls, status labels and explanatory text across English, Brazilian Portuguese, Spanish, French, German, Japanese, Chinese and Italian. User-entered profile names remain untouched, including names that happen to match interface words. Status fragments are separately translated rather than concatenated English phrases.

## Verification
- Complete profile-page translation-key coverage checked in all eight catalogs.
- Real browser DOM tests verify all eight languages, 760px layout, escaped markup and unchanged profile-name input values.
- Real packaged Electron profile-language switching passed for all eight locales.
- Full automated suite: 132 tests passed before packaging.
- Real profile isolation and tab-group regressions passed against the package.
- All eight profile languages passed in the installed executable. Installation exited0 and preserved existing profile/catalog file hashes; installed Google navigation passed. Evidence: tests/artifacts/installer-3.0.6-results.json and profile-language-results.json.

This is a focused localization patch. Native operating-system dialogs and some other 3.0 screens/diagnostics retain their previously documented language limitations. Translations have not received independent native-speaker editorial review. Public hosting, live provider VPN/OAuth and production signing still require owner configuration and are not claimed complete.
