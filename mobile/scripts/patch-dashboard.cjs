const fs = require('fs');
const p = 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('private fun securityDashboard()')) { console.log('already present'); process.exit(0); }
// Add Security Center sheet to settings menu
s = s.replace(
  'val options=arrayOf("Theme","Search engine","Homepage URL","HTTPS-first","Third-party cookies","Mobile Shield","Clear browsing data")',
  'val options=arrayOf("Theme","Search engine","Homepage URL","HTTPS-first","Third-party cookies","Mobile Shield","Security Center","Clear browsing data")'
);
s = s.replace(
  '5->shieldSettings();6->AlertDialog.Builder(this).setTitle("Clear browsing data?")',
  '5->shieldSettings();6->securityDashboard();7->AlertDialog.Builder(this).setTitle("Clear browsing data?")'
);
const anchor = '    private fun shieldSettings()';
const sheet = [
  '    private fun securityDashboard() {',
  '        val tab = current',
  '        val origin = tab?.let { runCatching { NavigationPolicy.origin(it.address) }.getOrNull() } ?: "none"',
  '        val secure = tab != null && tab.address.startsWith("https:") && !tab.failed',
  '        val message = buildString {',
  '            append("HTTPS status: ${if (secure) "Verified secure transport (Chromium certificate validation)" else "Not currently on a verified HTTPS page"}\\n")',
  '            append("Safe Browsing: initialized=$safeBrowsingReady (depends on installed WebView provider; no detection guarantee)\\n")',
  '            append("Mobile Shield: mode=${store.shieldMode}, threat=${store.threatProtection}, tracker=${store.trackerProtection}, adult=${store.adultFiltering}\\n")',
  '            append("  Imported rules — threats: ${shield.count(MobileShield.Category.THREAT)}, trackers: ${shield.count(MobileShield.Category.TRACKER)}, content: ${shield.count(MobileShield.Category.ADULT)}. No bundled threat intelligence.\\n")',
  '            append("Third-party cookies: ${if (store.thirdPartyCookies) "allowed" else "blocked"}\\n")',
  '            append("Downloads: Download Guard active — consent required, HTTPS only, 100 MiB max, local checks only (not antivirus)\\n")',
  '            append("Permissions: camera, microphone and location are denied in this preview\\n")',
  '            append("Passwords: ${passwords.records.size} saved, encrypted with Android Keystore (AES-256-GCM); nothing transmitted\\n")',
  '            append("Current origin: $origin\\n")',
  '            append("\\nThis dashboard reports configured protections. It does not guarantee anonymity or complete protection against every attack.")',
  '        }',
  '        notice("ASTER SECURITY CENTER", message)',
  '    }',
  ''
].join('\n');
if (!s.includes(anchor)) throw Error('anchor missing');
s = s.replace(anchor, sheet + anchor);
fs.writeFileSync(p, s);
console.log('securityDashboard added');
