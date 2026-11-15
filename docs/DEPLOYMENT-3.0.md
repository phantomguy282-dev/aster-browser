# Aster 3.0 deployment handoff

## Outcome
Deployment files are prepared and locally tested. **No public deployment was performed:** no authenticated hosting account or authorized repository was available. No public URL, signing status or live release availability has been fabricated. Account credentials and private signing keys must not be sent in chat.

## Exact deliverables
- `.github/workflows/deploy-pages.yml` — owner-triggered GitHub Pages workflow; validates an existing public release before uploading the small static site, deploys using Pages OIDC, checks the actual returned HTTPS URL.
- `scripts/prepare-public-site.cjs` — requires repository, exact matching release tag and independently verified SHA-256. Streams the public binary; validates approved HTTPS redirect hosts, bounded size, Windows executable prefix and checksum. Does not generate a link if verification fails.
- `scripts/public-release-client.js` — copied into generated site as release.js; validates preview/signed flags, bounded size, checksum syntax, HTTPS GitHub host and exact correspondence between version/tag/installer filename. Uses textContent and hides invalid links. No cross-origin HEAD request needed.
- `tests/public-deployment.test.cjs` — four verifier/input/redirect tests.
- `tests/public-release-client.test.cjs` — two metadata and real headless Edge UI tests.
- `docs/PUBLIC-DEPLOYMENT-3.0.md` — detailed owner workflow and hosting architecture.

## Validation
`node --test tests/public-deployment.test.cjs tests/public-release-client.test.cjs` — **6 passed, 0 failed**. The Edge test renders valid metadata and verifies rejection/hiding for mismatched versions, JavaScript URLs, malformed JSON and oversized metadata. Fetch tests use deterministic inert fixture bytes; they are not a real public installer publication. `node --check scripts/prepare-public-site.cjs` passes.

## Verified official upstream references
Official documentation fetched successfully:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://developers.cloudflare.com/pages/platform/limits/ (25 MiB per static asset; therefore keep the much larger installer on Releases, not Pages)

Action references were resolved with `git ls-remote` against official repositories, not invented:
- `actions/checkout` v6 → `d23441a48e516b6c34aea4fa41551a30e30af803`
- `actions/setup-node` v6 → `249970729cb0ef3589644e2896645e5dc5ba9c38`
- `actions/upload-pages-artifact` v4 → `7b1f4a764d45c48632c6b24a0339c27f5614fb0b`
- `actions/deploy-pages` v4 → `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e`

The workflow uses these immutable commits. Review upstream changes deliberately before updating pins. Its build job has contents:read, deployment job only pages:write/id-token:write, checkout does not persist credentials, and dispatch values enter the verifier through environment variables rather than shell interpolation.

## Owner actions
1. Create/select your public GitHub repository and publish reviewed source including all files above, package.json, website HTML/styles/assets. Exclude local profiles, node_modules, test artifacts and large binaries.
2. Build/test the exact version in package.json. Tag the matching source. The tag must contain `scripts/public-release-client.js` as well as the verifier; do not use an older source tag with new deployment scripts missing.
3. Publish a real GitHub Release at that tag, attach `Aster-Setup-<version>.exe`, and mark previews as pre-releases. Calculate and independently compare its SHA-256.
4. Enable Settings → Pages → GitHub Actions and authorize the intended tag in any github-pages environment protection rules.
5. Run the workflow with the public release tag and checksum. It will generate `dist/public-site` only after downloading and verifying the actual binary.
6. Review the successful deploy output and its actual HTTPS site URL; open homepage/download page and independently download/hash the release. Only then report public accessibility as verified.
7. Supply real operator/contact/legal details and signing infrastructure before describing the product as production-ready.

For Cloudflare Pages, run the verifier locally after public release publication and upload only generated `dist/public-site` using the owner's authenticated Direct Upload workflow. No subdomain is reserved by these files.

## Important boundaries
Public metadata says preview and unsigned by design. Supporting a signed/stable release requires an explicit reviewed change after real signing/QA, not a label edit. Public checksums do not authenticate a compromised site; application update signatures and Authenticode are distinct. The public website's GitHub release link is not automatically suitable for the current in-app updater, which deliberately rejects redirects. Configure a directly served HTTPS updater artifact/feed separately or extend that trust policy with tests before using it.
