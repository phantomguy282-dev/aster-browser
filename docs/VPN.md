# Windows VPN adapter

Aster integrates **existing Windows system VPN connections**. It does not operate a VPN service, create a tunnel by changing a displayed IP, provide server locations, or include a VPN subscription. Configure a compatible connection and save its credentials in Windows Settings first. Commercial VPN service charges and policies still apply.

## Integration contract

```js
const { Vpn } = require('./vpn.cjs');
const vpn = new Vpn(browser); // browser.emit() notifies the trusted shell
await vpn.refresh();          // read-only Windows metadata discovery
vpn.status();                // cached status, no external request
await vpn.connect({ id });    // explicit user-selected discovered opaque ID
await vpn.disconnect({ id }); // explicit user-selected discovered opaque ID
```

Only connect/disconnect UI actions should call the corresponding methods. Do not automatically connect at startup or disconnect on exit. Both actions affect the user's Windows VPN, potentially including applications other than Aster. Present this clearly before the user acts.

`refresh()` invokes a fixed, noninteractive PowerShell script using `Get-VpnConnection` for current-user and all-user profiles. No profile name or renderer input is interpolated into that script. Discovery reveals local metadata (connection name, configured server address, observed Windows connection status and split-tunnel configuration). It does not retrieve passwords or send data to an IP lookup service.

`connect()`/`disconnect()` accept a discovered opaque ID, not an arbitrary command, path or server. They invoke `rasdial.exe` using an argument array, without a shell or supplied username/password. Windows uses its saved credentials; if these are missing, configuration or authentication fails rather than Aster collecting a password. All-user connections use the standard Windows all-user phonebook path. UAC, permissions, provider MFA and incompatible authentication requirements may prevent connection.

## What status means

- Connection status is taken from `Get-VpnConnection`, not assumed from button clicks or a successful process exit.
- Split tunneling means **only configured routes**, not all device traffic, traverse the VPN.
- Even without split tunneling, routing, DNS, IPv6 and provider configuration determine actual coverage. Aster does not assert that every packet is protected.
- Connection duration is available only after Aster observes a transition from not connected to connected. An already-connected profile discovered on first refresh has an unknown start time, displayed as unavailable rather than an invented timer.
- Countries are not inferred from connection names or servers. The current adapter returns an empty country; the UI should say “Not specified” and not manufacture flags or locations.
- `ip` is `null`: no public-IP lookup is performed. A configured VPN server address is **not** the user's public IP.
- No Aster kill switch, DNS leak prevention mechanism, provider catalog or automatic reconnect is included. Existing Windows/provider protections remain under their own control.

## Failure behavior

Commands have a 20-second process timeout and a 1 MiB output limit. Failures populate a bounded error message and never fabricate a successful connection. A discovery failure clears actionable cached profiles. A process timeout is not proof that Windows stopped a tunnel operation; refresh status before retrying. Aster does not change routing, DNS, firewall rules, VPN configuration or subscriptions.

The browser should expose Refresh and actual status/errors. Avoid advertising generic WireGuard or OpenVPN control: standalone third-party clients are not automatically managed by `Get-VpnConnection`/`rasdial`. Only Windows-compatible profiles exposed by these APIs are supported here.

## Verification

Run:

```text
node --test tests/vpn.test.cjs
```

These are explicitly **adapter unit tests with an injected process runner**. They verify fixed discovery arguments, opaque ID selection, argument isolation, empty/error states, split-tunnel warnings, timestamps, connect/disconnect state checks, and command failures. They never connect, disconnect, configure or inspect actual VPN credentials.

Read-only local discovery may be performed separately by calling `new Vpn({emit(){}}).refresh()`. A successful empty discovery proves only that Windows reported no configured profiles. Successful live tunneling, routing coverage, DNS behavior and external IP changes require a real configured VPN and the user's explicit connection action; they are not established by fixture tests.
