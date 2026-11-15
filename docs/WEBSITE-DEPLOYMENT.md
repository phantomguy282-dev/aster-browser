# Aster website deployment

The `website/` directory is a static, responsive product/download site. No deployment, domain purchase, production hosting, or public contact identity has been performed or invented.

## Prepare a real release

From the project root, after a successful Windows build:

```text
node scripts/prepare-website.cjs
node website/verify.cjs
```

An optional absolute installer path may be supplied to the preparation script. Its filename must match `Aster-Setup-<current package version>.exe`; the script refuses to label an older installer as a new version. It checks the Windows executable header, copies the actual binary to `website/downloads/`, and writes `website/release.json` from real artifact bytes and file timestamp. The release remains **preview**, unsigned. It computes SHA-256 independently of any update mechanism.

Rerun both commands whenever the application is rebuilt. Do not hand-edit checksums or sizes. Do not publish a previous release.json alongside a newer installer. The current metadata date is the artifact modification time, not a claimed public launch date.

## Preview locally

Use any static HTTP server rooted at `website/`. For example, if Python is installed:

```text
python -m http.server 8080 --directory website
```

Open `http://localhost:8080`. Do not evaluate download availability by opening HTML directly through `file://`: the browser intentionally fetches the release JSON and performs a same-origin HEAD check on its installer. The download link stays unavailable if metadata or artifact is missing/malformed, or the reported file size differs.

## Deploy to a static host

1. Select a host that serves HTTPS and permits an installer of the generated size. Some static hosts impose per-file limits; do not silently replace the artifact with a fabricated link.
2. Upload `index.html`, `download.html`, `privacy.html`, `terms.html`, `releases.html`, `styles.css`, `release.js`, `release.json`, `assets/`, and `downloads/` together. `verify.cjs` is a local verifier and need not be uploaded.
3. Preserve the relative directory structure and permit GET/HEAD requests for installer files. Serve `.json` as `application/json` and `.exe` as `application/octet-stream`, preferably with attachment disposition.
4. Use a short/no-cache policy for `release.json` and the HTML download page. Versioned installers and image assets may be cached. Switch the complete release atomically where the host supports it.
5. Enable HTTPS and redirect HTTP to HTTPS. Add host security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Set a CSP consistent with the pages' self-only policy and `frame-ancestors 'none'` as a response header.
6. Replace the transparent contact-not-configured notices with the actual legal operator and monitored contact route. Obtain review of privacy/terms for your jurisdiction and disclose the selected hosting provider's request logging/retention. Do not add a fake email address.
7. After upload, verify all navigation links, mobile layout, HEAD/GET installer responses, version, byte size, and downloaded-file SHA-256. Code signing and an update-signing key are separate requirements; the site must not claim either is configured without evidence.

## Contents and truthful claims

- Original ink/lavender/mint design, no external fonts or third-party scripts.
- Real browser homepage and Customization Studio screenshots copied from isolated automated-test artifacts; no test profile data files are published.
- Landing page, FAQ, requirements, download details, release notes, privacy and terms.
- Windows 10/11 x64 only; no ARM/macOS/Linux builds are advertised.
- Existing Windows VPN integration is not a free VPN service. Google login needs developer OAuth registration. Extensions are experimental. Updates require trusted publisher configuration. No stable channel or production security maturity is claimed.
- No analytics/tracking is implemented in the site. Hosting access logs remain the hosting operator's responsibility.

The website download checksum is an integrity reference, **not authentication against a compromised website**. A production release needs code signing, an authenticated release process and appropriate independent review.
