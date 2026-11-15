# Free VPN provider evaluation — Aster 3.0

Official sources checked during development:
- https://protonvpn.com/free-vpn — Proton advertises a free account, one device, no ads, unlimited use.
- https://protonvpn.com/download-chrome-extension — official extension describes **browser-only** protection, free or Plus accounts, and installation from Chrome Web Store.
- https://protonvpn.com/download-windows — official Windows client download path.

## Selected practical path
Use Proton's official Windows client, obtained from its official website and authenticated directly with Proton. Aster does not request, store or proxy Proton credentials. The Windows client can protect Aster traffic under its actual routing policy without depending on Electron's limited extension APIs. Free account/server availability and connection selection are governed by Proton; Aster must not invent free servers, countries or connection times.

The official extension is not bundled: its proxy/extension API compatibility in Electron has not been established, and Chrome Web Store support cannot be assumed. No private provider API or subscription restriction is bypassed.

## What is and is not verified
Provider free-plan and browser-only distinction are supported by the official pages above. Aster's existing Windows VPN adapter has tests and read-only discovery, but Proton's own app may not appear as a Windows built-in VPN connection. A running client or installed executable is **not proof of a tunnel**. Aster does not claim Proton is connected, and no provider connection/routing/IP/DNS-leak test was performed because no account authorization was supplied.

Owner steps: install the official Windows app, create/sign in to a free account there, connect through that app, then verify traffic and DNS using the provider's own diagnostics before relying on protection. Keep Aster usable when disconnected. If you want automated provider control, supply an officially documented supported automation method; do not substitute private reverse-engineered APIs.

This is a documented supported companion-client path, not a completed automatic free-provider integration. The limitation remains visible in release notes.
