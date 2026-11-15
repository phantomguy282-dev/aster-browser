'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { Store } = require('../src/main/store.cjs');
const { Migration, LIMITS } = require('../src/main/migration.cjs');
function fixture(t) {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aster-migration-test-'));
 t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
 const events = [];
 const browser = { store: new Store(path.join(dir, 'aster')), emit() { events.push(migration.status()); } };
 const migration = new Migration(browser, { env: { LOCALAPPDATA: path.join(dir, 'local'), APPDATA: path.join(dir, 'roaming') } });
 const profile = path.join(dir, 'source'); fs.mkdirSync(profile);
 return { dir, profile, migration, browser, events };
}
function json(file, value) { fs.writeFileSync(file, JSON.stringify(value)); }
function chromium(f) {
 json(path.join(f.profile, 'Bookmarks'), { roots: { bookmark_bar: { type: 'folder', name: 'Bookmarks bar', children: [
  { type: 'folder', name: 'Work', children: [{ type: 'url', name: 'Aster test', url: 'https://example.wtf/path' }, { type: 'url', name: 'Duplicate', url: 'https://example.wtf/path' }] },
  { type: 'url', name: 'Unsafe', url: 'javascript:alert(1)' },
  { type: 'url', name: 'Credential URL', url: 'https://user:password@example.com/' },
  { type: 'folder', name: 'Personal', children: [{ type: 'url', name: 'Same URL distinct folder', url: 'https://example.wtf/path' }] }
 ] } } });
 json(path.join(f.profile, 'Preferences'), { default_search_provider_data: { template_url_data: { url: 'https://www.bing.com/search?q={searchTerms}' } } });
 const db = new DatabaseSync(path.join(f.profile, 'History'));
 db.exec('CREATE TABLE urls (id INTEGER PRIMARY KEY,url TEXT,title TEXT,last_visit_time INTEGER)');
 const stmt = db.prepare('INSERT INTO urls (url,title,last_visit_time) VALUES (?,?,?)');
 stmt.run('https://history.example.ai/', 'History test', (1700000000000 + 11644473600000) * 1000);
 stmt.run('file:///private/secret', 'Forbidden', (1700000000000 + 11644473600000) * 1000);
 db.close();
 return f.migration.registerDirectory(f.profile);
}
test('detect enumerates known profile metadata without opening browsing files', t => {
 const f = fixture(t);
 const entries = [
  ['local/Google/Chrome/User Data/Default', 'Google Chrome'],
  ['local/Google/Chrome/User Data/Profile 2', 'Google Chrome'],
  ['local/Microsoft/Edge/User Data/Default', 'Microsoft Edge'],
  ['local/BraveSoftware/Brave-Browser/User Data/Default', 'Brave'],
  ['roaming/Opera Software/Opera Stable', 'Opera'],
  ['roaming/Opera Software/Opera GX Stable', 'Opera GX'],
  ['roaming/Mozilla/Firefox/Profiles/test.default-release', 'Mozilla Firefox']
 ];
 for (const [rel] of entries) { const d = path.join(f.dir, rel); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'Bookmarks'), 'corrupt and deliberately not parsed'); }
 const original = fs.readFileSync; const reads = [];
 fs.readFileSync = function (file, ...args) { reads.push(String(file)); return original.call(this, file, ...args); };
 let profiles; try { profiles = f.migration.detect(); } finally { fs.readFileSync = original; }
 assert.equal(profiles.length, 7); assert.deepEqual(reads, []);
 for (const label of entries.map(e => e[1])) assert.ok(profiles.some(p => p.browser === label));
 assert.equal(profiles[0].supported.passwords, false);
 assert.deepEqual(f.migration.detect().map(p => p.id), profiles.map(p => p.id));
});
test('rejects missing consent, open source, unknown ids and protected categories before source reads', async t => {
 const f = fixture(t); const p = chromium(f);
 await assert.rejects(f.migration.import({ profileId: p.id, bookmarks: true }), /consent/);
 await assert.rejects(f.migration.import({ profileId: p.id, consent: true, bookmarks: true }), /Close the source browser/);
 await assert.rejects(f.migration.import({ profileId: '../source', consent: true, sourceClosed: true, bookmarks: true }), /Unknown profile/);
 await assert.rejects(f.migration.import({ profileId: p.id, consent: true, sourceClosed: true, bookmarks: true, passwords: true }), /not supported/);
 assert.equal(f.browser.store.data.bookmarks.length, 0);
});
test('Chromium fixtures import bookmark folders, history timestamps and search with dedup and source unchanged', async t => {
 const f = fixture(t); const p = chromium(f);
 const before = Object.fromEntries(['Bookmarks', 'History', 'Preferences'].map(n => [n, fs.readFileSync(path.join(f.profile, n))]));
 const opts = { profileId: p.id, consent: true, sourceClosed: true, bookmarks: true, history: true, searchEngine: true };
 const result = await f.migration.import(opts);
 assert.deepEqual(result.imported, { bookmarks: 2, history: 1, searchEngine: 1 });
 assert.equal(result.duplicates, 1); assert.equal(result.skipped, 3);
 assert.deepEqual(f.browser.store.data.bookmarks.map(b => b.folder), ['Bookmarks bar/Work', 'Bookmarks bar/Personal']);
 assert.equal(f.browser.store.data.history[0].time, 1700000000000); assert.equal(f.browser.store.data.settings.searchEngine, 'bing');
 assert.ok(f.events.some(e => e.phase === 'reading')); assert.equal(f.migration.status().phase, 'complete');
 const again = await f.migration.import(opts); assert.equal(again.imported.bookmarks, 0); assert.equal(again.imported.history, 0);
 for (const [n, bytes] of Object.entries(before)) assert.deepEqual(fs.readFileSync(path.join(f.profile, n)), bytes);
 const reopened = new Store(path.dirname(f.browser.store.file)); assert.equal(reopened.data.bookmarks.length, 2);
});
test('Firefox SQLite fixture preserves nested folder paths and imports last-visited history', async t => {
 const f = fixture(t); const db = new DatabaseSync(path.join(f.profile, 'places.sqlite'));
 db.exec(`CREATE TABLE moz_places (id INTEGER PRIMARY KEY,url TEXT,title TEXT,last_visit_date INTEGER);
 CREATE TABLE moz_bookmarks (id INTEGER PRIMARY KEY,parent INTEGER,type INTEGER,title TEXT,fk INTEGER);
 INSERT INTO moz_places VALUES (1,'https://firefox.example.io/','Firefox history',1700000000000000);
 INSERT INTO moz_bookmarks VALUES (1,0,2,'',NULL),(2,1,2,'Bookmarks Menu',NULL),(3,2,2,'Projects',NULL),(4,3,1,'Firefox bookmark',1);`);
 db.close(); const p = f.migration.registerDirectory(f.profile, 'firefox', 'Firefox');
 const result = await f.migration.import({ profileId: p.id, bookmarks: true, history: true, searchEngine: true, consent: true, sourceClosed: true });
 assert.deepEqual(result.imported, { bookmarks: 1, history: 1, searchEngine: 0 });
 assert.equal(f.browser.store.data.bookmarks[0].folder, 'Bookmarks Menu/Projects');
 assert.equal(f.browser.store.data.history[0].time, 1700000000000);
 assert.equal(result.categories.searchEngine, 'skipped'); assert.match(result.warnings.join(' '), /Firefox search/);
});
test('pending WAL skipped rather than making an inconsistent or writable source snapshot', async t => {
 const f = fixture(t); const p = chromium(f);
 fs.writeFileSync(path.join(f.profile, 'History-wal'), 'uncheckpointed source data');
 const r = await f.migration.import({ profileId: p.id, history: true, consent: true, sourceClosed: true });
 assert.equal(r.imported.history, 0); assert.equal(r.categories.history, 'skipped'); assert.match(r.warnings.join(' '), /WAL/);
 assert.equal(fs.readFileSync(path.join(f.profile, 'History-wal'), 'utf8'), 'uncheckpointed source data');
});
test('malformed and over-limit inputs report skipped categories without altering existing data', async t => {
 const f = fixture(t); const p = chromium(f); fs.writeFileSync(path.join(f.profile, 'Bookmarks'), '{bad json');
 let r = await f.migration.import({ profileId: p.id, bookmarks: true, consent: true, sourceClosed: true });
 assert.equal(r.categories.bookmarks, 'skipped');
 const fd = fs.openSync(path.join(f.profile, 'Bookmarks'), 'w'); fs.ftruncateSync(fd, LIMITS.jsonBytes + 1); fs.closeSync(fd);
 r = await f.migration.import({ profileId: p.id, bookmarks: true, consent: true, sourceClosed: true });
 assert.match(r.warnings[0], /32 MiB/); assert.equal(f.browser.store.data.bookmarks.length, 0);
});
test('HTML export reads folders/entities as inert text and rejects unsafe URLs', async t => {
 const f = fixture(t); const file = path.join(f.dir, 'bookmarks.html');
 fs.writeFileSync(file, `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><DT><H3>Work &amp; projects</H3><DL><DT><A HREF="https://example.dev/?q=one&amp;x=2">A &lt;title&gt;</A><DT><A HREF='javascript:alert(1)'>bad</A></DL></DL><script>global.untrusted = true</script>`);
 await assert.rejects(f.migration.importHTML({ filePath: file }), /consent/);
 const r = await f.migration.importHTML({ filePath: file, consent: true });
 assert.equal(r.imported.bookmarks, 1); assert.equal(r.skipped, 1);
 assert.equal(f.browser.store.data.bookmarks[0].folder, 'Work & projects'); assert.equal(f.browser.store.data.bookmarks[0].title, 'A <title>');
 assert.equal(f.browser.store.data.bookmarks[0].url, 'https://example.dev/?q=one&x=2'); assert.equal(global.untrusted, undefined);
});
test('failed destination save rolls back in-memory changes and reports failed progress', async t => {
 const f = fixture(t); const p = chromium(f); const previous = f.browser.store.data.bookmarks;
 f.browser.store.save = () => { throw Error('test disk failure'); };
 await assert.rejects(f.migration.import({ profileId: p.id, bookmarks: true, consent: true, sourceClosed: true }), /test disk failure/);
 assert.equal(f.browser.store.data.bookmarks, previous); assert.equal(f.migration.status().phase, 'failed');
});
test('history cap preserves existing destination entries instead of deleting them', async t => {
 const f = fixture(t); const p = chromium(f);
 f.browser.store.data.history = Array.from({ length: LIMITS.history }, (_, i) => ({ id: String(i), url: `https://existing.example/${i}`, title: 'Existing', time: 1700000000000 + i }));
 const r = await f.migration.import({ profileId: p.id, history: true, consent: true, sourceClosed: true });
 assert.equal(r.imported.history, 0); assert.equal(r.truncated, true); assert.equal(f.browser.store.data.history.length, LIMITS.history);
 assert.ok(f.browser.store.data.history.every(h => h.url.startsWith('https://existing.example/')));
});
