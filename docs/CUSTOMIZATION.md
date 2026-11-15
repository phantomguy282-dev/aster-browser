# Customization Studio

Open `aster://studio` from the address bar or browser menu. Presets: Midnight, Aurora, Ocean, Cyberpunk, Minimal, Glass, AMOLED, Light, Dark and Neon. Theme names are product labels, not remote marketplace listings.

Use HEX/color pickers for primary, secondary, accent, background, text, tab, address, toolbar, sidebar and border. Set font, density, tab shape, layout, toolbar order, sidebar visibility, motion and homepage arrangement. Live preview is temporary until Save; saved settings survive restart. Studio colors deliberately override basic light/dark while enabled. Disable customization to reveal the basic theme; Reset restores Aurora.

## CSS
The syntax-highlighted editor previews validated styles. The supported selector list is shown in Studio. CSS is parsed with PostCSS and restricted to listed UI surfaces and styling properties. Imports, URLs, scripts, arbitrary selectors, nested rules, variables and visibility/position hiding properties are rejected. Security/address/private controls receive protected final styling. CSS is inserted only into the local UI WebContents, never the rendered website. This is a deliberately restricted editor, not unrestricted browser chrome injection.

## Images/themes
Native file selection accepts PNG/JPEG/WebP with signature/MIME checks up to 5 MiB. Wallpaper data is embedded in settings; no arbitrary local file URL is exposed. Choose position/blur/opacity or built-in gradients. Theme packages are validated versioned JSON and cannot contain scripts. Import previews before save/install; export shares a local data-only package. Themes can be enabled/disabled and removed from the library. No official hosted theme store exists.

## Configuration
Export/import through the Studio backup controls. Import is a confirmed merge with an on-disk backup and retains existing bookmarks/shortcuts. Credentials, cookies, account tokens and update trust keys are excluded. See MIGRATION.md for complete instructions.

Tests verify schema rejection, CSS restrictions, image signatures, ten preset completeness, real shell-only preview, persistence, merge backup and language/theme controls. Screenshots exist in tests/artifacts; no native-speaker or human aesthetic review is claimed.
