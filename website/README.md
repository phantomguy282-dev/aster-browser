# ASTER Website

Official static website for the ASTER browser ecosystem, hosted on **GitHub Pages**: https://phantomguy282-dev.github.io/Aster-website/

## Architecture

- Pure static HTML/CSS/JS — no build step, no framework
- Strict CSP on every page (`default-src 'self'`; no external assets, no inline scripts)
- `release.json` — single source of truth for the current Windows preview download (version, size, SHA-256); `release.js` renders it
- `versions.json` — cross-platform release manifest (desktop / android / ios with status)
- `verify.cjs` — structural checks: local links resolve, CSP present, manifest ↔ actual installer SHA-256 match
- `smoke.cjs` — Playwright layout/error test at 1440px and 390px (requires the installer under `downloads/` locally)

## GitHub Pages configuration

- Deployed from branch `main`, root path (`/`)
- HTTPS enforced (`.https_enforced: true`)
- `.github/workflows/deploy-pages.yml` validates structure and re-deploys on every push using official Pages Actions (`actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`) with minimal permissions
- Installer binaries are intentionally not in git (GitHub 100 MB file limit); `downloads/` is gitignored. The live page links the real GitHub Releases instead, and `release.json` documents the exact verified artifact.

## Download integration

Download buttons link to real GitHub Releases:

- Desktop: https://github.com/phantomguy282-dev/aster-browser/releases
- Android: https://github.com/phantomguy282-dev/aster-browser-android/releases
- iOS: honestly labeled "not available" until an actual distribution method exists

`versions.json` carries each platform's status (`preview` / `development`) so pages never invent versions.

## Development

```
node verify.cjs   # static checks
node smoke.cjs    # Playwright layout test (needs Edge/Chromium + local downloads/ installer)
```

Deploy: push to `main` → workflow validates and deploys → check https://phantomguy282-dev.github.io/Aster-website/

## Custom domain (prepared, awaiting owner registration)

The repository is ready for `aster.is-a.dev` (a CNAME file can be added the moment the owner's is-a.dev registration PR is merged). DNS configuration must be done by the owner through the official is-a.dev process — see `DOMAIN-SETUP.md`.

## License

MIT — see [LICENSE](./LICENSE).
