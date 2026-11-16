# ASTER — Production Readiness & Security Configuration (2026-11-15)

Statuses: **COMPLETED AND VERIFIED** / **PREPARED — OWNER ACTION REQUIRED** / **BLOCKED** / **NOT APPLICABLE**.
Verification method is stated for every claim. Nothing here is asserted without a tool result behind it.

## 1. Executive summary

- GitHub security features (secret scanning, push protection, Dependabot alerts + security updates, dependency graph) are **enabled and verified via API** on all four repositories. Zero open Dependabot alerts at audit time.
- Android production signing is **fully prepared and gated**: CI builds debug APK + tests with no secrets (verified locally and in CI); the signed release path activates only when **all four** signing secrets exist (gate fixed this session to check all four, not just the keystore).
- iOS sources **compile for the iOS simulator in CI** (first successful build this session). Device build and IPA export procedures exist (`build-ios.sh`) but require a Mac + Apple Developer identity — never fabricated.
- Release safety: both published releases are now explicitly marked **prerelease** (they were missing that flag — fixed and verified); debug artifacts are labeled debug everywhere; no secrets print to CI logs.
- No releases were published, no versions changed, no history rewritten during this task.

## 2. GitHub security configuration per repository

| Feature | aster-browser | aster-browser-android | aster-browser-iOS | Aster-website |
|---|---|---|---|---|
| Secret scanning | ✅ enabled (verified via API) | ✅ enabled | ✅ enabled | ✅ enabled |
| Push protection | ✅ enabled | ✅ enabled | ✅ enabled | ✅ enabled |
| Dependabot alerts | ✅ enabled (vulnerability-alerts endpoint returns 204) | ✅ enabled | ✅ enabled | ✅ enabled |
| Dependabot security updates | ✅ enabled (PATCH verified, state read back `enabled`) | ✅ enabled | ✅ enabled | ✅ enabled |
| Dependency graph | ✅ enabled (implicit with alerts; 204 on alerts endpoint confirms active) | ✅ | ✅ | ✅ |
| Open Dependabot alerts found | 0 | 0 | 0 | 0 |

Verification commands used: `gh api repos/... --jq '.security_and_analysis'`, `gh api -i .../vulnerability-alerts` (HTTP 204 = enabled), `gh api .../dependabot/alerts?state=open` (count 0).

**Feature flags returned `disabled` by the API but that require org/plan support** (cannot be enabled via REST with current permissions; owner manual steps below): `secret_scanning_validity_checks`, `secret_scanning_non_provider_patterns`.

**Owner manual steps (if desired):** Settings → Code security and analysis → enable "Secret scanning validity checks" and "Non-provider patterns". These require GitHub Advanced Security on private repos; on public repos some toggles are UI-only.

## 3. Android signing setup instructions

Current verified state (from `app/build.gradle.kts` and `.github/workflows/android-ci.yml`):

- `build.gradle.kts` creates an `ownerRelease` signing config **only** when `ASTER_ANDROID_KEYSTORE` env is set; debug builds are unaffected (verified: local `assembleDebug` BUILD SUCCESSFUL with zero signing env vars set).
- CI `release` job runs only on `v*` tags, and its `has_secrets` step now requires **all four** secrets (gap fixed this session — previously only `ANDROID_KEYSTORE_B64` was checked; a mismatched secret set would have produced a failed/broken signing attempt).
- Keystore is decoded to `$RUNNER_TEMP` (never committed), and a cleanup step (`if: always()`) deletes it after the build.
- No `echo ${{ secrets.* }}` patterns exist in any workflow (audited); passwords flow only via `env:` into Gradle.

## 4. Required Android GitHub Actions secrets

Configure in **aster-browser-android → Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_B64` | `base64` encoding of your release keystore file (`base64 -w0 my.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Key password |

Status: **PREPARED — OWNER ACTION REQUIRED**. With all four set, tagging a commit `vX.Y.Z` makes CI produce signed `app-release.apk` + `app-release.aab` with a `SHA256SUMS.txt`. Until then, the release job writes an honest "skipping signed release (no fabrication)" summary and no signed artifact is produced.

## 5. iOS build and signing instructions

- Simulator build: **COMPLETED AND VERIFIED** — CI job `validate` on `macos-latest` runs XcodeGen → `xcodebuild … CODE_SIGNING_ALLOWED=NO build` → all steps success (verified via jobs API).
- Device build: `bash build-ios.sh archive` on a Mac with `ASTER_APPLE_TEAM` + `ASTER_IOS_BUNDLE_ID` set — **PREPARED — OWNER ACTION REQUIRED** (no Mac in dev environment; never simulated).
- IPA export: `ASTER_EXPORT_OPTIONS=<plist> bash build-ios.sh export` — **PREPARED — OWNER ACTION REQUIRED**.
- The CI workflow contains no IPA step; it cannot falsely report an IPA from a simulator build (verified by reading the workflow: only `CODE_SIGNING_ALLOWED=NO build` exists).

## 6. Apple Developer requirements (owner documentation)

1. Apple Developer Program membership ($99/year) — needed for device builds and any distribution.
2. A distribution certificate (Apple Distribution) created in the developer portal, installed in Keychain on the signing Mac.
3. A provisioning profile matching the final bundle ID (`app.aster.mobile` is a placeholder — the owner's real ID must be set in `project.yml` or overridden in the archive step, as `build-ios.sh archive` does via `PRODUCT_BUNDLE_IDENTIFIER`).
4. For App Store/TestFlight: an App Store Connect record for the bundle ID.
5. Never commit certificates/profiles; keep them in Xcode/Keychain on the signing Mac.

## 7. Release workflow verification (Phase 4)

| Check | Desktop | Android | iOS | Website |
|---|---|---|---|---|
| Version consistency | package.json 5.0.0 = release.json 5.0.0 = v5.0.0 tag ✅ | versionName 4.0.0-preview-debug in APK + release notes ✅ | project.yml 4.0.0 ✅ | versions.json matches release URLs ✅ |
| Artifact naming | `Aster-Setup-5.0.0.exe` / `Aster-Portable-5.0.0.exe` ✅ | `*-debug.apk` explicitly named ✅ | n/a (no IPA) ✅ | links to release assets ✅ |
| SHA-256 generation | CI step writes `SHA256SUMS.txt` ✅ | CI step writes `SHA256SUMS.txt` ✅ | n/a | release.json hash verified against actual installer by verify.cjs ✅ |
| Release attachments | workflow attaches on `release` events ✅ | release job attaches when secrets exist ✅ | n/a | download buttons link real releases ✅ |
| Prerelease marking | **fixed this session**: was `false`, now `true` (verified via API) | **fixed**: same | n/a | n/a |
| No debug-as-production | `signed: false` + "unsigned preview" everywhere ✅ | "debug certificate" stated in release notes + APK name ✅ | "no IPA" stated ✅ | statuses `preview`/`development` ✅ |
| No secrets in CI logs | audited: no `echo ${{ secrets }}` ✅ | audited ✅ | audited ✅ | audited ✅ |

## 8. Security findings

1. **Fixed:** Android signing gate checked only 1 of 4 required secrets — now requires all four (commit in aster-browser-android).
2. **Fixed:** Both published preview releases lacked the `prerelease` flag, presenting debug/unsigned builds as stable-looking releases — now marked prerelease on both (metadata edit only; no republish).
3. **Fixed:** Desktop workflow had blanket `contents: write` for all jobs including tests — now split to least-privilege (test: read, build: write).
4. **Informational:** `secret_scanning_validity_checks` and `secret_scanning_non_provider_patterns` remain `disabled` via API — org/plan-level toggles; manual UI steps documented in §2.
5. **Informational:** 0 open Dependabot alerts across all repos at audit time.

## 9. Remaining manual actions (owner)

1. Add the four Android signing secrets (§4) → signed APK/AAB on next `v*` tag.
2. Apple Developer Program + certificate + profile + real bundle ID for iOS device builds (§6).
3. Personal is-a.dev registration for `aster.is-a.dev` (see website `DOMAIN-SETUP.md`).
4. Optional: enable secret-scanning validity checks / non-provider patterns in repo Settings UI.
5. Windows code-signing certificate (publisher identity) — still not configured; installer remains unsigned.
6. Documentation paths: iOS build instructions live at `mobile/docs/IOS-BUILD.md` (not inside the iOS repo root); domain guide at `website/DOMAIN-SETUP.md`.

## 10. Production readiness status per platform

| Platform | Status | Blocking items |
|---|---|---|
| Windows desktop | **PREPARED — OWNER ACTION REQUIRED** | Code-signing certificate for the installer; trusted-update publisher key |
| Android | **PREPARED — OWNER ACTION REQUIRED** | The 4 signing secrets; device/emulator testing |
| iOS | **PREPARED — OWNER ACTION REQUIRED** (sources compile in CI ✅) | Mac + Xcode + Apple identity for device build/IPA; App Store record |
| Website | **COMPLETED AND VERIFIED** (live, HTTPS, validated by CI) | Optional custom domain (owner registration) |
