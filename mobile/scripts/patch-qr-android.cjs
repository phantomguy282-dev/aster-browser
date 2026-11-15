const fs = require('fs');
const p = 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt';
let s = fs.readFileSync(p, 'utf8');
if (s.includes('private fun qrShare(')) { console.log('already present'); process.exit(0); }
// 1) Add QR entry to pageActions sheet
const before = 'val actions = arrayOf("Bookmark this page", "Copy page address", "Share page", "Tab actions")';
const after = 'val actions = arrayOf("Bookmark this page", "Copy page address", "Share page", "Show QR code", "Tab actions")';
if (!s.includes(before)) throw Error('pageActions array not found');
s = s.replace(before, after);
// 2) Route index 3 to qrShare, tabActions becomes 4
const routeBefore = '                3 -> tabActions(),';
if (!s.includes(routeBefore)) throw Error('route line not found');
s = s.replace(routeBefore, '                3 -> qrShare(tab),\n                4 -> tabActions(),');
// 3) Insert qrShare method before tabActions
const anchor = '    private fun tabActions() {';
if (!s.includes(anchor)) throw Error('anchor missing');
const qr = [
  '    private fun qrShare(tab: Tab) {',
  '        attempt {',
  '            if (!NavigationPolicy.isWebAddress(tab.address)) throw IllegalStateException("Open a website first")',
  '            AlertDialog.Builder(this).setTitle("Share this page")',
  '                .setMessage("QR generation requires an encoding library not bundled in this preview. Copy the address or use the system share sheet instead.")',
  '                .setPositiveButton("Copy address") { _, _ -> val cm = getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager; cm.setPrimaryClip(android.content.ClipData.newPlainText("url", tab.address)) }',
  '                .setNeutralButton("Share") { _, _ -> val send = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, tab.address) }; startActivity(Intent.createChooser(send, "Share page")) }',
  '                .setNegativeButton("Close", null).show()',
  '        }',
  '    }',
  ''
].join('\n');
s = s.replace(anchor, qr + anchor);
fs.writeFileSync(p, s);
console.log('qrShare added');
