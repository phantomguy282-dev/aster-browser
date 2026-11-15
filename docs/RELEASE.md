# Windows release verification — 0.2.0

- Final unsigned x64 NSIS installer: `dist/Aster-Setup-0.2.0.exe`.
- Graphical installer includes language selection (8 languages), welcome, location, shortcut options, optional first-launch import, progress and finish/run pages. Build succeeded without suppressing warnings.
- Upgrade of installed Aster completed with exit code 0.
- Existing user profile JSON hash was identical before and after upgrade; tests used isolated temporary profiles.
- Installed `Aster.exe` passed all 19 expansion checks and real Google address-bar navigation.
- Installed `Uninstall Aster.exe` exists. Uninstallation was not run against the user's application, and the interactive wizard was not fully automated.
- Website installer copy is byte-identical by SHA-256; 121,923,318 bytes.
- Installer SHA-256: `99797dc1491ba790fcd57dd0c2ae2c3e82eef4ab65a801cdc541458cb9789a63`.
- `docs/SHA256SUMS-0.2.txt` records executable and installer hashes.
- No signing certificate was used. No OS security or certificate validation was disabled.

Full feature matrix and explicit limitations: EXPANSION-PROGRESS.md. Release notes: RELEASE-0.2.md.
