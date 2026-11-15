const fs = require('fs');
const p = 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('if (NavigationPolicy.isWebAddress(link)) { linkActions(link); true } else false',
  'val link0 = result.extra; if (NavigationPolicy.isWebAddress(link0)) { linkActions(link0); true } else false');
s = s.replace('if (NavigationPolicy.isWebAddress(image)) { imageActions(image); true } else false',
  'val image0 = result.extra; if (NavigationPolicy.isWebAddress(image0)) { imageActions(image0); true } else false');
s = s.replace('val image = result.extra\n', '');
s = s.replace('val link = result.extra\n', '');
s = s.replace('1 -> newPrivateTab(link)', '1 -> newTab(link)');
s = s.replace('1 -> { val keep = tab; tabs.toList().filter { it !== keep }.forEach { close(it) }; notice("Tabs closed", "Other tabs are closed. Session tab list updated on next save.") }',
  '1 -> closeOthers(tab)');
s = s.replace('2 -> close(tab)', '2 -> closeCurrent()');
const closeFn = '    private fun closeCurrent() {';
const closeOthers = [
  '    private fun closeOthers(keep: Tab) {',
  '        val doomed = tabs.filter { it !== keep }',
  '        for (t in doomed) { t.web.stopLoading(); t.web.destroy() }',
  '        tabs.removeAll { it !== keep }',
  '        active = tabs.indexOf(keep).coerceAtLeast(0)',
  '        showTab(keep)',
  '        persistSession()',
  '        if (doomed.isNotEmpty()) notice("Tabs closed", "${doomed.size} other tab(s) closed.")',
  '    }',
  ''
].join('\n');
if (!s.includes(closeFn)) throw Error('closeCurrent anchor missing');
if (!s.includes('closeOthers(tab)')) throw Error('closeOthers call missing');
s = s.replace(closeFn, closeOthers + closeFn);
fs.writeFileSync(p, s);
console.log('patched ok');
