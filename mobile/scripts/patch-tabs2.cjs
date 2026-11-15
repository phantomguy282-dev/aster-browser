const fs = require('fs');
const p = 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt';
let s = fs.readFileSync(p, 'utf8');
// Remove MY duplicate tabManager (labels + listOf("Reopen closed tab", "Close other tabs") version)
const dup = [
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
if (!s.includes(dup)) throw Error('duplicate block not found');
s = s.replace(dup, '');
// Extend the ORIGINAL tabManager with reopen + close others
const orig = '    private fun tabManager() {\n        val labels = tabs.mapIndexed { i, t -> "${if (i == active) "● " else ""}${t.title.take(60)}" }.toTypedArray()\n        AlertDialog.Builder(this).setTitle("Tabs (${tabs.size}/12)").setItems(labels) { _, index -> active = index; if (current!!.address.isBlank()) showHome() else showTab(current!!) }\n            .setNeutralButton("Close current") { _, _ -> closeCurrent() }.setPositiveButton("New tab") { _, _ -> newTab() }.setNegativeButton("Cancel", null).show()\n    }';
const neu = '    private fun tabManager() {\n        val labels = tabs.mapIndexed { i, t -> "${if (i == active) "● " else ""}${t.title.take(60)}" }.toTypedArray()\n        val actions = labels + listOf("Reopen closed tab", "Close other tabs")\n        AlertDialog.Builder(this).setTitle("Tabs (${tabs.size}/12)").setItems(actions.toTypedArray()) { _, which -> attempt {\n            if (which < tabs.size) { active = which; if (current!!.address.isBlank()) showHome() else showTab(current!!) }\n            else if (which == tabs.size) {\n                val url = closedTabs.removeFirstOrNull() ?: throw IllegalStateException("No recently closed tab to reopen")\n                newTab(url)\n            }\n            else { val keep = current ?: return@attempt; closeOthers(keep) }\n        } }.show()\n            .setPositiveButton("New tab") { _, _ -> newTab() }.setNegativeButton("Cancel", null)\n    }';
if (!s.includes(orig)) throw Error('original tabManager not found');
s = s.replace(orig, neu);
fs.writeFileSync(p, s);
console.log('dedup done:', (s.match(/private fun tabManager\(\)/g) || []).length === 1);
