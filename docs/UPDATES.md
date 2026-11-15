# Signed Aster updates

## Current release status

The update manager is implemented, but **no official update feed or production signing key is supplied**. Checks fail closed until the publisher ships a pinned Ed25519 public key and configures a real HTTPS feed. No fake download endpoint, automatically generated production trust, or claimed live deployment is included.

The unit suite uses ephemeral test keys and inert fixture bytes; it does not contact an update host or launch an installer. Live-host deployment, Windows installer execution through this update path, certificate issuance, key custody and recovery remain publisher acceptance tasks.

## Browser integration

```js
const { Updates } = require('./updates.cjs');
this.updates = new Updates(this);
// Include updates: this.updates.status() in trusted shell state.
// Route allowlisted commands to configure/check/download/install.
// Call this.updates.dispose() before closing the application.
```

Public methods:
- `status()` returns `{configured,status,available,progress,error,url,autoCheck,hasKey,manualInstall}`. `available` is verified signed release metadata or null. `progress` is actual `{received,total}` bytes. No staging executable path or credential is exposed.
- `configure({url,autoCheck})`: HTTPS feed URL, or empty URL to disable configuration. `autoCheck` is boolean, default false. Public keys cannot be supplied through settings/IPC.
- `check()`: obtains and authenticates bounded metadata. State is `available`, `current`, or `error`.
- `download()`: downloads the currently verified release to a randomly named staging file with exclusive creation, validates signed size and SHA-256, then marks `downloaded`.
- `install()`: rechecks signature, expiration, current-version floor and replay watermark, checks file size/hash, displays a native Cancel-default confirmation, then repeats metadata/file checks immediately before spawning only the known staged `.exe`. Browser closes after successful process spawn. No arbitrary path, shell command or installer arguments are accepted.
- `dispose()`: stops automatic timers and aborts active network activity.

`autoCheck=true` performs a check after ten seconds and then every 24 hours when fully configured. It never downloads or installs automatically. With defaults, all checks are explicit.

## Trust and publisher setup

1. Independently generate and protect an **Ed25519** signing private key through your organization's key-management process. Do not ship the private key in Aster, the repository, website, logs, or CI artifacts.
2. Ship its SPKI PEM public key at exactly `assets/update-public-key.pem` in the signed-ready application package. The manager reads only this compiled package-relative path. Runtime UI cannot replace the trust anchor. Initial installation must come through your separately trusted distribution channel.
3. Build the real Windows `.exe` installer. Compute its SHA-256 and exact byte length.
4. Publish the executable over HTTPS with no redirects, no content compression and preferably an exact `Content-Length`. Limits: 512 MiB installer, 128 KiB envelope response. TLS validation stays enabled.
5. Prepare signed payload JSON with exactly these fields (values below describe format, not a real release):

```text
version      stable major.minor.patch, newer than installed version
publishedAt  actual ISO-8601 publication timestamp
expiresAt    future ISO-8601 expiry, after publication and no more than 31 days later
url          real HTTPS URL ending in .exe, no URL credentials or fragment
sha256       lowercase 64-character SHA-256 of the real executable
size         exact positive integer byte length, at most 536870912
notes        truthful plain-text release notes, at most 24000 characters
```

6. Sign with an explicitly provided key:

```text
node scripts/sign-update.cjs metadata.json feed.json --key private-key.pem
```

Alternative key sources: `ASTER_UPDATE_PRIVATE_KEY_FILE` or `ASTER_UPDATE_PRIVATE_KEY_PEM`. CLI `--key` takes precedence over environment inputs. Script refuses existing output files, refuses overwriting the key/input and never generates or installs trust keys. The envelope is `{payload:base64,signature:base64}`, with Ed25519 applied directly to the exact UTF-8 JSON bytes represented by `payload`.

7. Host `feed.json` on a real HTTPS endpoint and configure that URL in Aster. The feed URL and artifact URL may use different hosts; both must pass normal TLS validation. Redirects are rejected, not followed.
8. Validate an actual production-host check/download/install with a separately staged release before advertising automatic update availability.

## Replay protection and expiry

The manager compares stable numeric versions (not lexical text), rejects lower-than-installed versions, rejects expired metadata and publication timestamps more than five minutes in the future. A persisted `store.data.updateSecurity` watermark records the highest observed version, signed publication timestamp and payload digest. Older publication timestamps, lower versions or different payloads reusing the same observed version are rejected. This watermark is separate from exported appearance/configuration settings and must not be imported from theme packages.

**Publish a new version for a changed/renewed payload.** Re-signing identical bytes is accepted; replacing release metadata with changed dates/notes under an already observed version is deliberately rejected. Missing metadata after expiration prevents installation, including previously downloaded artifacts. Correct system time is required.

The watermark and staging files are local user-profile data. This design does not protect against a fully compromised Windows user account or a maliciously modified installed application. Key rotation requires a separately trusted application release; there is no remotely editable key-rotation bypass.

## Windows signatures and privacy

Ed25519 metadata authentication and SHA-256 integrity **do not mean the installer is Authenticode-signed**. A publisher can authorize an unsigned installer in signed metadata, but Windows unknown-publisher, SmartScreen and antivirus warnings still apply. Aster never disables those checks or silently elevates. Obtain a valid code-signing certificate independently before claiming signed Windows releases.

Checks send ordinary HTTPS request metadata to the configured feed host; downloads contact the signed artifact host. No browsing history, tabs, account tokens, cookies, device identifier or personal profile data is included. The Node HTTPS client does not use Chromium session cookies. The static request user-agent is `Aster-Update/1`.

## Verification performed

`node --test tests/updates.test.cjs` verifies real Ed25519 signatures using ephemeral fixture keys, exact payload integrity, wrong-key rejection, canonical envelope encoding, metadata bounds, HTTPS policy, expiration, downgrade/replay/conflicting-release rejection, staging file tamper detection, missing-configuration fail-closed behavior, and explicit-key signing CLI refusal to overwrite files. No fixture executable is run. There is no claim of a hosted production update or successful update installation yet.

## Aster 3.0 additions
Signed metadata may contain a boolean `critical`; unsigned UI values cannot manufacture a trusted release. In-browser notices provide Update now, Remind me later and Release notes. `updateAutoDownload` is opt-in and downloads only after signed metadata verification; installation always asks. The profile records an installer attempt, and next startup reports completed or not-completed-review-and-retry by actual version. This is detection/retry guidance, not an atomic rollback installer. HTTPS transport has been tested with a test-only trusted local certificate and inert bytes; production update installation is still owner-gated.
