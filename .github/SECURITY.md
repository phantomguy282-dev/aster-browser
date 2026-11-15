# Security Policy for ASTER repositories

## Reporting

No public security contact has been configured yet (no support email — the owner must add one before production distribution). Until then, use GitHub's private vulnerability reporting on the affected repository: **Security → Report a vulnerability**.

## Scope

- aster-browser (Windows desktop, Electron)
- aster-browser-android (Kotlin/WebView)
- aster-browser-iOS (Swift/WKWebView, source only)
- Aster-website (static pages)

## Commitment to honest security claims

This project deliberately avoids overstating protections:

- The Android APK and Windows installer are **unsigned/debug-signed previews** — treat them as untrusted binaries and verify published SHA-256 checksums.
- Mobile Shield contains **no threat intelligence feed**; protection depends entirely on user-imported lists.
- Download checks are local format/SHA-256 inspections, **not antivirus**; a matching hash never proves safety.
- No passwords/credentials are ever transmitted anywhere; the vaults are local-only (DPAPI on Windows, Android Keystore on Android).
- No sync backend, VPN service, or telemetry exists.

## Automated scanning

- Dependabot: configured (`.github/dependabot.yml`) for npm ecosystems (desktop, website) and GitHub Actions
- GitHub secret scanning + push protection: recommended to enable in Settings → Code security (owner action; cannot be set via API without enterprise permissions)

## If a secret was committed

Removing a secret from the latest commit does **not** invalidate it — it remains in git history. Rotate the affected credential immediately, then clean history if needed (requires coordination; never force-push without the owner's explicit authorization).
