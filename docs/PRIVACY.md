# Privacy and security disclosure — Aster 0.2 preview

Aster contains no analytics/telemetry collector and no browsing-history upload or synchronization service. Browsing history, bookmarks, settings and normal tab URLs are stored locally; history is bounded to 10,000 records. Chromium stores normal website cookies, cache and site storage in a persistent partition. Use Settings/Privacy to delete selected data.

Private tabs share a separate in-memory session cleared after the final private tab closes. They are not recorded in normal history/session restoration. Saved bookmarks and downloaded files survive. Private mode does not hide traffic from websites, VPN providers, employers or network operators. Crashes/OS artifacts are outside guarantees.

## External traffic
- Visited websites and their resources receive normal browser requests and may collect data under their own policies.
- Search input submitted as a query is sent to the selected search provider; there are no remote live search suggestions.
- Clicking filter-list update sends HTTPS requests to the configured list sources. The server sees connection information; no browsing-history list is sent. Custom list publishers see those list requests.
- Google account sign-in opens official Google authorization in your system browser. Aster requests only openid/email/profile and stores granted tokens using OS encryption. See GOOGLE-AUTH.md. Website Google sessions are separate.
- VPN connect/disconnect uses your configured Windows VPN and saved credentials; your provider may see traffic. Aster supplies no anonymizing servers, kill switch, IP probe service or leak guarantee.
- Update checks, if configured, request the publisher's feed; only standard request/network information is sent. Auto-check is off by default. A pinned key and valid signed metadata are mandatory before download/install.
- Extensions may access matching web pages according to declared permissions. Only install trusted reviewed code; Electron supports a limited extension API subset.

## Security boundaries
Web pages have sandbox/context isolation and no Node/preload bridge. Only the local shell can invoke authenticated main-process commands. Custom CSS applies to trusted browser UI only and is parsed/restricted; themes cannot execute scripts or alter page security. TLS validation is never disabled; no insecure retry is offered for certificate errors. Native confirmation precedes insecure HTTP retry, configuration merge, extension installation and update installation.

The release and installer are unsigned. No reputation/antiphishing maturity or comprehensive security audit is claimed. Supported browser APIs can still contain defects. Do not treat a prototype-era release as equivalent to established security-maintained browsers for sensitive workloads.

## Website
The supplied static site includes no analytics, remote fonts or tracking scripts. Once deployed, the hosting provider may record access logs. A production operator/contact, actual hosting policies and jurisdiction-specific legal review must be supplied before public launch; none is invented in this project.
