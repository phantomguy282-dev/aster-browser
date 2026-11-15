# Aster localization

## Delivered

Offline catalogs for English (`en`), Brazilian Portuguese (`pt-BR`), Spanish (`es`), French (`fr`), German (`de`), Japanese (`ja`), Chinese (`zh`) and Italian (`it`). Each catalog has **611 identical source keys**, with real translations rather than English-filled fallback catalogs. Product names, language self-names, font names, CPU/VPN and some shared international technical vocabulary intentionally remain unchanged.

Files:
- `src/ui/locales/catalogs.js`: executable offline catalog bundle, CommonJS-exportable for tests.
- `src/ui/locales/prose.txt`, `additional.txt`, `final.txt`: translation source rows (English plus seven translations, pipe-separated); their contents are embedded in the bundle. Editing these source rows alone does not update the embedded bundle.
- `src/ui/i18n.js`: `window.AsterI18n` runtime.
- `tests/i18n.test.cjs`: parity, explicit expansion-key coverage and browser DOM tests.

No network requests, dynamic code evaluation or injected translated HTML are used.

## Integration

Load `locales/catalogs.js` and then `i18n.js` before the application render scripts. Call:

```js
AsterI18n.setLanguage(state.settings.language || 'en'); // before rendering
// render controls/pages, including AsterExpansion T/H helpers
AsterI18n.apply(state.settings.language || 'en');       // after rendering
```

Call `apply` after opening dynamically generated menus/modals/toasts or after inserting new controls. The runtime deliberately has no MutationObserver, preventing observer feedback loops. It changes only text node values and known static `title`, `aria-label` and `placeholder` strings, never input values or HTML. `t(source, params)` returns a plain string; callers inserting it in HTML must use the existing escaping helper. `data-i18n="English source key"` is the preferred explicit annotation for new static labels; `data-i18n-ignore` excludes dynamic content.

The selected language is persisted by the main settings service and the selector is implemented by the expansion UI owner. This module does not modify shared settings/UI files.

## User data protections

Fallback DOM translation uses exact catalog matches, source-node WeakMap tracking, and reverse catalog lookup for already-translated templates. It skips tab/page titles, history/bookmark rows and URLs, shortcut labels, user bookmark folder headings, profile account names and emails, profile selector options, VPN names/server descriptions, extension names/descriptions, theme-library names, code/CSS editors, release notes, process-table contents, timestamps and text inputs. These exclusions are deliberate: a user bookmark named “Settings” must not be renamed when changing language.

## Coverage and limits

- All direct literal `H`, `T`, `note` and `card` source strings in the current `expansion.js` are covered, enforced by a test.
- Existing core controls, menu actions, settings descriptions, homepage/empty-state text, permission labels and common success notifications are covered.
- Security/privacy explanations in the expansion pages are translated across all eight catalogs, including real OAuth, VPN routing limitations, untrusted update metadata, migration consent and safe CSS restrictions.
- Newly added language/startup and automatic update preference labels are covered.
- **Arbitrary operating-system, Chromium, network, OAuth-provider, import-parser and security-validation error diagnostics intentionally remain original.** The runtime does not machine-translate unknown diagnostics or fabricate translations.
- Mixed dynamic strings not explicitly routed through `t` may remain partially original: download size/state rows, version-prefixed About text, source path/profile descriptions and timestamps. Date formatting currently follows the OS locale unless the calling UI supplies the chosen locale.
- Preset theme names and Google product names are treated as names; custom theme names are never translated.
- Native file dialogs and security confirmation boxes are controlled by their main-process owners/OS, not this renderer module.
- This is not a claim that every possible future or dynamic diagnostic is localized. Additional static keys should be added to every catalog and tests rerun.

## Installer localization

Electron Builder NSIS supports installer language identifiers `en_US`, `pt_BR`, `es_ES`, `fr_FR`, `de_DE`, `ja_JP`, `zh_CN`, `it_IT` through `nsis.installerLanguages`, with language selection enabled. Main packaging configuration must set these; this assignment did not edit package.json or installer files. NSIS built-in translations cover standard wizard strings, while custom installer text requires corresponding language strings.

## Verification

`node --test tests/i18n.test.cjs` — **4 tests pass**:
1. All eight catalogs have identical nonempty keys.
2. Translation switching/fallback preserves unknown input.
3. Current explicit expansion static source keys have no missing entries.
4. Real headless Edge DOM test switches Portuguese → Japanese → German → English, updates newly added controls and verifies user titles, account names, code and input values remain unchanged.

Catalog translations have not undergone native-speaker editorial review in this session. Installer language switching is outside this module's test scope.

## 3.0.6 profile page
Profile-manager controls, status fragments and explanatory prose now use explicit translation keys in all eight catalogs. Two coverage/DOM tests and installed Electron language-switching checks passed. User-entered names remain unchanged. Other previously documented 3.0 page/native-dialog gaps and native-speaker review requirements remain.

## 3.0.11 saved workspaces
Workspace controls, explanations, busy/empty states and parameterized operation counts now use translated keys in all eight locales. DOM and actual Electron language-switching tests passed without changing saved workspace names, website titles or URLs. Native confirmation dialogs and other documented localization gaps remain; no native-speaker editorial review is claimed.

## 3.0.12 setup screens
All six setup steps, default-browser information and protection settings use explicit translated keys in eight locales. Setup source rows are kept in src/ui/locales/setup-rows.txt and embedded in catalogs.js; editing the text file alone does not regenerate the bundle. Tests verify labels, setting values, no automatic privileged actions, escaped external diagnostics and narrow layouts. Unknown OS/provider diagnostics and native dialogs retain their separate language limitations. No native-speaker editorial review is claimed.

## 3.0.13 security panels
Site Control and Security Center translate browser-owned labels, explanations and known parameterized checks. Origins, extension permissions, cookie metadata and unknown diagnostics remain literal. The security-rows.txt source is embedded in catalogs.js; editing the source file alone does not regenerate the bundle. Tests cover all eight locales, private permission isolation, pending checkbox/focus retention and unknown diagnostic preservation. Native dialogs and unrecognized runtime messages retain their language limitations.
