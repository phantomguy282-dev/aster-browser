# Migration and backup

## Import from another browser
1. Close the source browser so its database is consistent.
2. Open Aster menu → Import browser data.
3. Click Detect profiles (directory metadata only), or choose a compatible Chromium/Firefox profile directory with the native picker.
4. Select bookmarks, history and supported search preference categories. Check explicit consent and the source-closed acknowledgement.
5. Import and review counts, duplicates, skipped categories and warnings.

Chrome, Edge, Brave, Opera, Opera GX and Firefox standard Windows profile locations are detected. Other compatible Chromium profiles can be chosen manually. Folder paths are preserved. Existing destination bookmarks/history are not deleted. Source files are never written. SQLite snapshots are read-only, bounded and rejected if active WAL/journal data or file changes make them unsafe. Locked/inaccessible categories are reported rather than bypassed. Bookmark HTML exports are parsed as inert text, not executed.

Passwords, autofill and cookies are not imported: protected credential extraction is intentionally unsupported. You must sign into websites again yourself. Tests used generated Chromium/Firefox/HTML fixtures, not your browser profiles.

## Configuration backup and restore
Customization Studio → Export configuration writes validated JSON containing supported appearance/preferences, shortcuts and bookmarks. It excludes cookies, account tokens, credentials and update trust keys. Keep exports private because bookmarks reveal interests.

Import configuration opens a native file picker and confirmation. A timestamped local backup of the existing profile JSON is created first; existing bookmarks and shortcuts are retained and duplicates skipped. Imported matching preferences/customization replace their counterparts. Invalid packages are rejected without importing executable theme code.

Theme and CSS export/import are separate controls. Theme JSON is `{format:"aster-theme",version:1,theme:{...}}`; CSS uses supported selectors/properties only. Wallpapers are embedded validated PNG/JPEG/WebP data, max 5 MiB.

For a complete manual profile backup, close Aster and copy its entire user-data directory to secure storage. OS-encrypted account tokens may not decrypt on another Windows account/device. Do not restore a profile while the browser is running. Automated configuration import is intentionally not a full cookie/credential/profile clone.
