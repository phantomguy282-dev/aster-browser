const fs = require('fs');
const p = 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt';
let s = fs.readFileSync(p, 'utf8');
// Recently-closed stack + tab search
s = s.replace('private val tabs = mutableListOf<Tab>()', 'private val tabs = mutableListOf<Tab>()\n    private val closedTabs = mutableListOf<String>()');
s = s.replace('private fun closeCurrent() {\n        val tab = current ?: return; tabs.removeAt(active); surface.removeAllViews(); tab.web.stopLoading(); tab.web.destroy()',
  'private fun closeCurrent() {\n        val tab = current ?: return; if (NavigationPolicy.isWebAddress(tab.address)) { closedTabs.add(0, tab.address); if (closedTabs.size > 12) closedTabs.removeAt(closedTabs.lastIndex) }; tabs.removeAt(active); surface.removeAllViews(); tab.web.stopLoading(); tab.web.destroy()');
// Menu entries
s = s.replace('val actions = arrayOf("Bookmark this page", "Bookmarks", "History", "Downloads / Download Guard", "Password Manager", "Capture page screenshot", "Settings / Mobile Shield", "Private browsing availability", "About Aster")',
  'val actions = arrayOf("Bookmark this page", "Bookmarks", "History", "Downloads / Download Guard", "Password Manager", "Capture page screenshot", "Tab manager", "Settings / Mobile Shield", "Private browsing availability", "About Aster")');
s = s.replace('0 -> bookmarkCurrent(); 1 -> showEntries(false); 2 -> showEntries(true); 3 -> downloadDashboard(); 4 -> passwordManager(); 5 -> capturePage(); 6 -> settings()',
  '0 -> bookmarkCurrent(); 1 -> showEntries(false); 2 -> showEntries(true); 3 -> downloadDashboard(); 4 -> passwordManager(); 5 -> capturePage(); 6 -> tabManager(); 7 -> settings()');
s = s.replace('            7 -> notice("Private browsing",', '            8 -> notice("Private browsing",');
// tabManager method before closeCurrent
const anchor = '    private fun closeCurrent() {';
const tabManager = [
  '    private fun tabManager() {',
  '        val labels = tabs.mapIndexed { i, t -> (if (i == active) "[active] " else "") + (t.title.ifBlank { t.address.ifBlank { "New tab" } }) }',
  '        val actions = labels + listOf("Reopen closed tab", "Close other tabs")',
  '        AlertDialog.Builder(this).setTitle("Tabs (${tabs.size}/12)").setItems(actions.toTypedArray()) { _, which -> attempt {',
  '            if (which < tabs.size) { active = which; showTab(tabs[which]) }',
  '            else if (which == tabs.size) {',
  '                val url = closedTabs.removeFirstOrNull() ?: throw IllegalStateException("No recently closed tab")',
  '                newTab(url)',
  '            }',
  '            else { val keep = current ?: return@attempt; closeOthers(keep) }',
  '        } }.show()',
  '    }',
  ''
].join('\n');
if (!s.includes(anchor)) throw Error('anchor missing');
s = s.replace(anchor, tabManager + anchor);
fs.writeFileSync(p, s);
console.log('tabManager added:', s.includes('private fun tabManager()'), 'closedTabs:', s.includes('closedTabs'));
