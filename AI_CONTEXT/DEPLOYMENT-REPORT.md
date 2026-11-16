# ASTER Deployment & Release Infrastructure — Final Report (2026-11-15)

## Deployment status

| Component | Repository | Status | URL |
|---|---|---|---|
| Desktop | aster-browser | **Deployed — CI green, v5.0.0 released** | https://github.com/phantomguy282-dev/aster-browser |
| Android | aster-browser-android | **Deployed — CI green, v4.0.0-preview.1 released** | https://github.com/phantomguy282-dev/aster-browser-android |
| iOS | aster-browser-iOS | **Deployed — CI green, sources compile for simulator (no IPA by design)** | https://github.com/phantomguy282-dev/aster-browser-iOS |
| Website | Aster-website | **Live on GitHub Pages — HTTPS enforced** | https://phantomguy282-dev.github.io/Aster-website/ |

## Workflows created

| Repo | Workflow | Result |
|---|---|---|
| aster-browser | `build-windows.yml` — npm ci → 173 tests → electron-builder NSIS+portable → SHA256SUMS.txt → artifact upload → release attachment | **success** |
| aster-browser-android | `android-ci.yml` — unit tests + debug APK artifact; signed release job gated on `v*` tags **and** presence of `ANDROID_KEYSTORE_B64` secret (skips honestly without them) | **success** |
| aster-browser-iOS | `ios-validate.yml` — XcodeGen generate + simulator build, `CODE_SIGNING_ALLOWED=NO`; **no IPA produced by design** | **success — sources compile for the first time** |
| Aster-website | `deploy-pages.yml` — validation-only CI (structure, manifest, links, live-site check). Pages deploys from `main` branch natively; the workflow never touches the live deployment | **success** |

Final CI state (verified via `gh run list` on all four repos): **4/4 workflows passing**, live site HTTP 200.

## iOS compile fix (first-ever successful build)

The iOS sources had never been compiled; CI surfaced exactly one error: `DownloadCoordinator` lacked `cookiesFor(url:cookies:)` called from `BrowserController.swift`. Added as a `static func` that filters WebKit's cookie store down to domain-matching, scheme-appropriate cookies only (no cross-origin forwarding), preserving the security model. Commit `51926a5`. After the fix, `AsterMobile` builds for the simulator with signing disabled.

## CI fixes applied during verification (root causes found in logs)

1. Desktop: `node --test tests/*.test.cjs` glob isn't expanded by cmd on CI → replaced `npm test` with an explicit generated file list.
2. Desktop: `node:sqlite` (used by migration tests) requires Node ≥ 22 → workflows + `engines` field bumped to Node 22.
3. Android: `secrets` context is illegal in job-level `if:` → signing gated via a step output instead.
4. Android: `android-actions/setup-android@v3` fails installing the deprecated `tools` package → switched to the preinstalled runner SDK + `gradle/actions/setup-gradle@v4` pinned to 8.11.1. **Run now passes: tests + debug APK built in CI.**
5. Website: deploy-pages workflow conflicted with branch-based Pages deployment → converted to validation-only CI (live deploys stay on the working native path).
6. iOS: `macos-14` runner label unsupported → `macos-latest`.

## Published releases & download integration

- Desktop: [v5.0.0](https://github.com/phantomguy282-dev/aster-browser/releases/tag/v5.0.0) — `Aster-Setup-5.0.0.exe`, 122,200,847 B, SHA-256 `ff8dec79…6a150b`
- Android: [v4.0.0-preview.1](https://github.com/phantomguy282-dev/aster-browser-android/releases/tag/v4.0.0-preview.1) — APK 2,748,664 B, SHA-256 `8f22b17a…c0fda3`
- iOS: no release (no IPA exists — honestly stated everywhere)
- Website `#mobile` section and `download` page link these real releases; `versions.json` manifest (desktop/android `preview`, ios `development`) feeds status labels; `release.json` verified against the actual installer by CI-style checks

## Website verification

- Pages status: `built`, source `main /`, **HTTPS enforced**
- Live URL returns HTTP 200; CI validates structure, manifest sanity, release links, and live reachability on every push
- SEO: robots.txt + sitemap.xml added (GitHub Pages host); CSP preserved on all pages

## Security configuration

- `SECURITY.md` with private-vulnerability-reporting guidance on desktop, android, iOS repos
- Dependabot (npm + github-actions) on desktop and website
- No secrets committed anywhere; Android signing documented as secrets-only; keystore cleanup step runs `if: always()`
- Commit-message hygiene: no tokens/keys in any commit

## Custom domain (aster.is-a.dev) — PREPARED, AWAITING OWNER

- `DOMAIN-SETUP.md` in the website repo with the exact owner steps
- Per the brief and is-a.dev policy: **no AI-generated registration PR was made**; the owner must personally submit `domains/aster.json` (CNAME → `phantomguy282-dev.github.io`) via https://github.com/is-a.dev/register
- After the owner's PR merges: Settings → Pages → Custom domain → `aster.is-a.dev` → enable Enforce HTTPS
- All asset paths are relative, so the domain switch breaks nothing; current URL stays live

## Owner actions required

1. Register `aster.is-a.dev` personally via the official is-a.dev process (see DOMAIN-SETUP.md), then set the custom domain in Settings → Pages.
2. Optional: add Android signing secrets (`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) — the workflow already consumes them on version tags.
3. Optional: enable secret scanning/push protection in each repo's Settings → Code security.
4. iOS: build with Xcode on a Mac (`bash build-ios.sh simulator|test|archive|export` per IOS-BUILD.md); CI validation alone produces no IPA.

## Commits created this deployment

- aster-browser: `d9a4387` (CI/CD + README + SECURITY + Dependabot), `a37861b` (test fix), `ad73eb7` (Node 22 + engines)
- aster-browser-android: `0e176ed` (CI/CD + README + SECURITY), `9c0c6ef` (secrets-in-if fix), `915ec02` (runner SDK fix)
- aster-browser-iOS: `c0cc601` (CI/CD + README + SECURITY), `fb5c31a` (runner label fix), `3d7b4f3` (error surfacing), `51926a5` (**compile fix — first successful build**)
- Aster-website: `d15d3fe` (infra + manifest + SEO + domain prep), `cc7ea52` (workflow fix), `2b82ebf` (validation-only CI)

No force-pushes; no deletions; all history preserved; all pushes additive to `main`.
