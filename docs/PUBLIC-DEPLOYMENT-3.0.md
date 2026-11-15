# Public Aster deployment: owner-authorized path

## Status
**Not deployed.** No authenticated hosting account, repository ownership or authorized deployment token was available in this session. The initial metadata-only check found no `gh`, `wrangler`, `netlify` or `vercel` command and no named provider token environment variables. No account/domain has been invented or registered. Do not send passwords, tokens or private signing keys in chat.

## Why split website and downloads
Cloudflare Pages documents a **25 MiB maximum per static asset**: https://developers.cloudflare.com/pages/platform/limits/ . Aster's Windows installer is substantially larger. Use a small static website on GitHub Pages or Cloudflare Pages, and actual versioned Windows binaries on GitHub Releases (or another approved large-file host). Do not commit installer binaries to the source repository.

GitHub Pages is available for public repositories on GitHub Free. Official workflow requirements are documented at https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages . Publishing via repository Actions requires the owner's authorization; the platform then provides the actual HTTPS site URL.

## Prepared files
- `.github/workflows/deploy-pages.yml`: manual dispatch only; builds static output after public download verification, then uses official pinned Pages actions with `pages:write` and `id-token:write` limited to deployment.
- `scripts/prepare-public-site.cjs`: no dependencies or credentials; checks the exact tag against package.json, downloads the public installer, follows only approved HTTPS GitHub asset redirects, verifies PE `MZ` prefix, size bound and independently supplied SHA-256. Generates `dist/public-site` only after verification.
- `tests/public-deployment.test.cjs`: four tests covering missing/invalid configuration, unsafe redirect targets, exact byte hash verification and missing release failure. Tests use inert fixtures, not a claimed public deployment.

## Exact owner steps
1. Sign into your GitHub account in the official website. Create/select a **public repository you own** for Aster and upload the reviewed source, website, scripts, package.json and lockfile, including `.github/workflows/deploy-pages.yml`. Exclude node_modules, local profiles, test artifacts and dist binaries. Include a real support/operator contact before public production use.
2. Build and test the version represented by package.json. Review its release notes and outstanding limitations. Publish a tag matching that source version (for example `v3.0.0` only after package.json actually says 3.0.0).
3. In the repository's **Releases → Draft a new release**, select that exact tag and attach `Aster-Setup-<version>.exe`. Mark preview builds as pre-releases. Publish the release; the verifier intentionally does not use tokens to access private/draft assets.
4. Compute the local binary checksum independently: `Get-FileHash .\dist\Aster-Setup-<version>.exe -Algorithm SHA256`. Compare with the release file downloaded from GitHub yourself.
5. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. If environment protection blocks tagged deployments, authorize the intended release tag in the `github-pages` environment; do not broadly disable repository protections.
6. In **Actions → Deploy verified Aster website → Run workflow**, enter the existing release tag and verified checksum. Use the reviewed workflow from your trusted default branch. The build job checks out the release source, so the tag must contain the preparation script and website.
7. Review the workflow result. Only after the deploy job succeeds and its HTTPS GET checks pass may you call the website deployed. Use the actual URL shown by the job/environment; no example subdomain is a reservation.
8. Visit the public homepage/download page on desktop and mobile. Download the executable using the real link, verify its full SHA-256, and check the displayed version/size/release notes. GitHub release availability is verified at deployment time; later removal of assets can still break links and must be monitored.

## Optional Cloudflare Pages
After completing real release publication, set `ASTER_RELEASE_REPOSITORY`, `ASTER_RELEASE_TAG`, and `ASTER_RELEASE_SHA256` locally and run `node scripts/prepare-public-site.cjs`. Upload **only `dist/public-site`** through Cloudflare's authenticated Direct Upload flow, not the large installer. Select an available provider subdomain in your account, enable HTTPS, then verify the actual returned URL and download. Exact provider instructions: https://developers.cloudflare.com/pages/get-started/direct-upload/ . No account login or deployment was performed here.

## Update signing remains separate
Website checksums provide integrity against the selected expected bytes, not authenticity if the whole site/account is compromised. The in-app updater additionally requires a publisher-provisioned Ed25519 public key and signed metadata. Authenticode signing is separate again. Use docs/UPDATES.md; never fabricate or publish a private key. The supplied public-site workflow does not sign application updates or claim the installer is Authenticode-signed.
