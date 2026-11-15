# Google account connection

## What is implemented

`src/main/account.cjs` implements a **real Google Desktop OAuth 2.0 authorization-code flow with PKCE and OpenID Connect**. It opens the fixed official Google authorization endpoint in the system browser, not an embedded Electron window. A temporary HTTP listener is bound only to `127.0.0.1` on an OS-selected port. State, nonce and the PKCE verifier use cryptographically random bytes. Callback validation checks the exact host/port/path, GET method, single matching state, bounded single code and overall request limits.

The main process exchanges the code at `https://oauth2.googleapis.com/token`. It verifies the ID token using the `jose` package and Google's fixed JWKS endpoint, RS256 only, Google issuer, registered client audience, token age/expiry, subject and nonce. No account is marked connected until verification and encrypted persistence succeed. No tokens are returned through `status()`.

Requested scopes are only `openid email profile`. No Gmail contents, contacts, Drive files or browsing history permissions are requested. Authentication does not collect a Google password.

## Required setup (not bundled credentials)

1. Create a Google Cloud project and configure its OAuth consent screen according to Google's current policies.
2. Create an OAuth client of application type **Desktop app**, not Web application. Register/publish or configure test users as required by Google.
3. Supply its client ID via the browser account configuration or `ASTER_GOOGLE_CLIENT_ID` in the launch environment. Expected form: `12345-example.apps.googleusercontent.com`.
4. If the issued Google Desktop client configuration requires a client secret for token exchange, supply `ASTER_GOOGLE_CLIENT_SECRET` in the process environment. It is never written to normal settings, returned in UI state, logged or included in the authorization URL. Desktop client secrets cannot be treated as confidential embedded application secrets. Do not commit them.
5. Use **Sign in** and complete the official consent flow in the system browser. Aster times out after five minutes and closes the loopback listener. Closing the app/disconnecting cancels pending authentication.

No placeholder client ID is shipped. Missing registration or unavailable OS credential encryption fails closed. Environment variables must be present when launching Aster, including when a shortcut launches it. A managed production distribution needs its own registered desktop OAuth identity and policy review.

## Credential storage and disconnect

On Windows, Electron `safeStorage` uses OS-protected encryption. The ciphertext is stored in `google-account.enc` beside the browser profile data; it is not exported in general configuration backups. The account manager refuses unavailable encryption or the Linux plaintext fallback backend. Plaintext access/refresh tokens exist only in main-process memory while the app is running. Do not expose Account internals to renderer IPC; use its safe `status()`.

Disconnect clears in-memory account state, removes the encrypted credential file, and posts token revocation to Google's official revocation endpoint. If online revocation fails, a visible error tells the user to remove Aster in their Google account's third-party permissions. A local file deletion error is also visible; do not claim the file was erased when deletion failed. OS backups may retain old encrypted files. This is OS-user protection, not protection from a compromised logged-in Windows account.

The account status is a saved connection identity, not a guarantee that an access token remains valid indefinitely. Aster 3.0 adds an explicit Refresh account access action when a refresh token exists. It uses the fixed Google token endpoint, retains or rotates the refresh token, persists only OS-encrypted tokens, and refuses late reconnection after disconnect. There is no background Google API sync. The status reports expiry and refresh availability, not a guarantee that the provider has not revoked access.

## Integration contract

```js
const { Account } = require('./account.cjs');
// Construct after Electron app readiness and Store initialization.
const account = new Account(browser);
account.status(); // {configured, connected, profile, pending, error, syncSupported:false}
account.configure({clientId}); // throws while connected or pending
await account.signIn();        // resolves safe status after genuine verification
await account.refresh();       // explicit refresh, safe status only
await account.signOut();       // local cleanup and online revocation attempt
account.dispose();            // on application shutdown: cancels listener/exchange
```

`browser` must expose `store.file`, `store.data.settings`, `store.save()` and `emit()`. IPC must retain the existing trusted sender/frame validation. Authentication exceptions are safe status messages; tokens and callback codes must not be logged. Runtime production dependency: **jose 6.2.17**, installed by the parent implementation.

## Important boundaries

- Connecting an account **does not sign Google website tabs into that account**. System-browser cookies are not copied into Aster, and OAuth tokens are not turned into website cookies.
- Gmail, YouTube, Drive and Calendar can be opened as normal websites; their site sessions are separate and subject to Google's browser policies.
- Browser bookmark/settings/tab synchronization and Chrome account sync are **not implemented**. `syncSupported` is false.
- No successful live Google authentication has been verified in this development session: a user-owned registered client ID and interactive consent were not available.

## Verification performed

`node --test tests/account.test.cjs` passes security helper/lifecycle tests for PKCE entropy and challenge, client ID validation, constant-time state equality, callback binding/duplicate rejection, bounded response parsing, fail-closed configuration/encryption, token redaction, save failure, actual local callback HTTP rejection and cancellation, and system-browser launch failure cleanup. The helper tests use synthetic input and mocked OS storage only; they do **not** simulate a successful Google account or claim genuine sign-in was tested. The local listener test never contacts Google's token endpoint.

## Exact redirect and live verification
The Desktop client uses `http://127.0.0.1:<OS-selected-port>/oauth/callback`. The port is selected for each sign-in; do not configure this as a fixed-port Web application client. Follow Google's installed-app OAuth documentation: https://developers.google.com/identity/protocols/oauth2/native-app . Configure test users/consent in your own Google Cloud project. No live account consent was performed in this session. Refresh tests use injected responses and do not establish a real Google connection.
