'use strict';
// Browser migration never reads source content before an explicit, consented import.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { webURL } = require('./security.cjs');
const LIMITS = Object.freeze({ jsonBytes: 32 * 1024 * 1024, dbBytes: 256 * 1024 * 1024, htmlBytes: 8 * 1024 * 1024, records: 50000, history: 10000, depth: 64, profiles: 200 });
const UNSUPPORTED = ['passwords', 'autofill', 'cookies'];
const text = (v, n = 300) => String(v ?? '').slice(0, n);
const folderName = v => text(v, 100).replaceAll('/', '∕').replace(/[\x00-\x1f]/g, '');
function safeURL(value) { if (typeof value !== 'string' || value.length > 8192 || !webURL(value)) return null; return new URL(value).href; }
function fileInProfile(profile, name) {
 const candidate = path.join(profile.path, name);
 const info = fs.lstatSync(candidate);
 if (!info.isFile() || info.isSymbolicLink()) throw Error('Source must be a regular file, not a symbolic link');
 if (path.dirname(fs.realpathSync(candidate)) !== profile.path) throw Error('Source file escaped the selected profile');
 return { file: candidate, info };
}
function boundedJSON(profile, name) {
 const { file, info } = fileInProfile(profile, name);
 if (info.size > LIMITS.jsonBytes) throw Error('Source JSON exceeds 32 MiB safety limit');
 const raw = fs.readFileSync(file, 'utf8');
 if (Buffer.byteLength(raw) > LIMITS.jsonBytes) throw Error('Source JSON grew beyond safety limit');
 const after = fs.statSync(file);
 if (after.size !== info.size || after.mtimeMs !== info.mtimeMs) throw Error('Source changed while reading; close the source browser and retry');
 return JSON.parse(raw);
}
function noPendingWrites(file) {
 for (const suffix of ['-wal', '-journal']) {
  try { if (fs.statSync(file + suffix).size > 0) throw Error('Source has pending WAL/journal data; close the source browser cleanly and retry'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
 }
}
function snapshotDB(profile, name, read) {
 const { file, info } = fileInProfile(profile, name);
 if (info.size > LIMITS.dbBytes) throw Error('Source database exceeds 256 MiB safety limit');
 noPendingWrites(file);
 let DatabaseSync;
 try { ({ DatabaseSync } = require('node:sqlite')); } catch { throw Error('This runtime does not support SQLite imports'); }
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aster-migration-'));
 const target = path.join(dir, 'snapshot.sqlite'); let db;
 try {
  fs.copyFileSync(file, target, fs.constants.COPYFILE_EXCL);
  const after = fs.statSync(file); noPendingWrites(file);
  if (after.size !== info.size || after.mtimeMs !== info.mtimeMs || after.ino !== info.ino) throw Error('Source changed during snapshot; close the source browser and retry');
  db = new DatabaseSync(target, { readOnly: true, enableExtensions: false });
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
  return read(db);
 } finally { if (db) db.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}
function engineFromTemplate(template) {
 if (typeof template !== 'string') return null;
 try { const host = new URL(template.replace(/\{[^}]+\}/g, 'query')).hostname.toLowerCase();
  if (/^(www\.)?google\.[a-z.]+$/.test(host)) return 'google';
  if (host === 'bing.com' || host === 'www.bing.com') return 'bing';
  if (host === 'duckduckgo.com' || host === 'www.duckduckgo.com') return 'duckduckgo';
 } catch {} return null;
}
function chromiumBookmarks(json, report) {
 const items = [], stack = Object.values(json.roots || {}).reverse().map(node => ({ node, folders: [], depth: 0 })); let examined = 0;
 while (stack.length && examined++ < LIMITS.records) {
  const { node, folders, depth } = stack.pop();
  if (!node || typeof node !== 'object') { report.skipped++; continue; }
  if (node.type === 'url') items.push({ url: node.url, title: node.name, folder: folders.join('/') });
  else if (Array.isArray(node.children)) {
   if (depth >= LIMITS.depth) { report.skipped += node.children.length; report.warnings.push('Bookmark nesting safety limit reached'); continue; }
   const next = node.name ? [...folders, folderName(node.name)] : folders;
   for (let i = node.children.length - 1; i >= 0; i--) stack.push({ node: node.children[i], folders: next, depth: depth + 1 });
  } else report.skipped++;
 }
 if (stack.length) { report.truncated = true; report.warnings.push('Bookmark traversal limited to 50,000 nodes'); }
 return items;
}
function firefoxBookmarks(db, report) {
 const rows = db.prepare('SELECT b.id,b.parent,b.type,b.title,p.url FROM moz_bookmarks b LEFT JOIN moz_places p ON p.id=b.fk ORDER BY b.id LIMIT ?').all(LIMITS.records + 1);
 if (rows.length > LIMITS.records) { rows.pop(); report.truncated = true; report.warnings.push('Firefox bookmarks limited to 50,000 rows'); }
 const folders = new Map(rows.filter(r => r.type === 2).map(r => [r.id, r]));
 return rows.filter(r => r.type === 1).map(r => {
  const parts = []; const seen = new Set(); let parent = r.parent;
  while (folders.has(parent) && !seen.has(parent) && parts.length < LIMITS.depth) { seen.add(parent); const f = folders.get(parent); if (f.title) parts.unshift(folderName(f.title)); parent = f.parent; }
  return { url: r.url, title: r.title, folder: parts.join('/') };
 });
}
function decodeHTML(s) {
 return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, v) => {
  if (v[0] === '#') { const n = v[1].toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : parseInt(v.slice(1), 10); return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : ''; }
  return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[v.toLowerCase()];
 });
}
// Reads Netscape Bookmark export text only. No DOM, scripts, URL fetches or HTML execution.
function parseBookmarkHTML(source, report) {
 const items = [], stack = []; let pending = null; let count = 0;
 const re = /<h3\b[^>]*>([\s\S]*?)<\/h3\s*>|<dl\b[^>]*>|<\/dl\s*>|<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi; let m;
 while ((m = re.exec(source)) && count++ < LIMITS.records) {
  if (m[1] !== undefined) pending = folderName(decodeHTML(m[1].replace(/<[^>]*>/g, '')));
  else if (/^<dl/i.test(m[0])) { if (stack.length >= LIMITS.depth) throw Error('Bookmark HTML nesting safety limit exceeded'); stack.push(pending); pending = null; }
  else if (/^<\/dl/i.test(m[0])) stack.pop();
  else { const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[2]);
   if (!href) { report.skipped++; continue; }
   items.push({ url: decodeHTML(href[1] ?? href[2] ?? href[3]), title: decodeHTML(m[3].replace(/<[^>]*>/g, '')), folder: stack.filter(Boolean).join('/') });
  }
 }
 if (m) { report.truncated = true; report.warnings.push('HTML bookmark import limited to 50,000 tokens'); } return items;
}
class Migration {
 constructor(browser, options = {}) { this.browser = browser; this.env = options.env || process.env; this.profiles = new Map(); this.busy = false; this.progress = { phase: 'idle' }; }
 status() { return structuredClone(this.progress); }
 publish(phase, details = {}) { this.progress = { phase, ...details }; try { this.browser.emit?.(); } catch {} }
 registerDirectory(directory, kind = 'chromium', browserName = 'Compatible Chromium browser') {
  // Call ONLY after a main-process native folder chooser, never with renderer-supplied paths.
  if (!['chromium', 'firefox'].includes(kind)) throw Error('Unsupported profile format');
  if (this.profiles.size >= LIMITS.profiles) throw Error('Profile discovery limit reached');
  const real = fs.realpathSync(directory); if (!fs.statSync(real).isDirectory()) throw Error('Select a browser profile directory');
  const prior = [...this.profiles.values()].find(p => p.path === real && p.kind === kind); if (prior) return this.metadata(prior);
  const profile = { id: randomUUID(), kind, browser: text(browserName, 100), name: path.basename(real), path: real };
  this.profiles.set(profile.id, profile); return this.metadata(profile);
 }
 metadata(p) { return { id: p.id, browser: p.browser, name: p.name, path: p.path, supported: { bookmarks: true, history: true, searchEngine: p.kind === 'chromium', passwords: false, autofill: false, cookies: false } }; }
 detect() {
  // Metadata-only directory enumeration. Does NOT open Bookmarks, History, Preferences or places.sqlite.
  const local = this.env.LOCALAPPDATA, roaming = this.env.APPDATA;
  const roots = [];
  if (local) roots.push(['Google Chrome', path.join(local, 'Google/Chrome/User Data')], ['Microsoft Edge', path.join(local, 'Microsoft/Edge/User Data')], ['Brave', path.join(local, 'BraveSoftware/Brave-Browser/User Data')]);
  if (roaming) roots.push(['Opera', path.join(roaming, 'Opera Software/Opera Stable'), 'direct'], ['Opera GX', path.join(roaming, 'Opera Software/Opera GX Stable'), 'direct'], ['Mozilla Firefox', path.join(roaming, 'Mozilla/Firefox/Profiles'), 'firefox']);
  const found = [];
  for (const [label, root, mode] of roots) {
   try {
    if (mode === 'direct' && fs.statSync(root).isDirectory()) found.push(this.registerDirectory(root, 'chromium', label));
    for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
     if (!dir.isDirectory() || dir.isSymbolicLink() || !(mode === 'firefox' || /^(Default|Profile \d+)$/.test(dir.name))) continue;
     found.push(this.registerDirectory(path.join(root, dir.name), mode === 'firefox' ? 'firefox' : 'chromium', label));
     if (found.length >= LIMITS.profiles) break;
    }
   } catch { /* absent or inaccessible browser roots are not read */ }
  }
  return found;
 }
 async import(options = {}) {
  if (options.consent !== true) throw Error('Explicit consent is required before reading browser data');
  if (options.sourceClosed !== true) throw Error('Close the source browser, then confirm it is closed before importing');
  if (this.busy) throw Error('An import is already in progress');
  const profile = this.profiles.get(options.profileId); if (!profile) throw Error('Unknown profile; detect or select the profile again');
  if (UNSUPPORTED.some(key => options[key])) throw Error('Passwords, autofill and cookies are not supported and will never be extracted');
  if (![options.bookmarks, options.history, options.searchEngine].some(x => x === true)) throw Error('Select at least one supported data category');
  this.busy = true;
  const report = { profileId: profile.id, imported: { bookmarks: 0, history: 0, searchEngine: 0 }, duplicates: 0, skipped: 0, truncated: false, warnings: [], categories: {} };
  const staged = { bookmarks: [], history: [], engine: null };
  try {
   const read = async (category, fn) => { this.publish('reading', { category, report }); await new Promise(resolve => setImmediate(resolve)); try { fn(); report.categories[category] = 'read'; } catch (e) { report.categories[category] = 'skipped'; report.warnings.push(`${category}: ${text(e.message, 400)}`); } };
   if (options.bookmarks === true) await read('bookmarks', () => { staged.bookmarks = profile.kind === 'firefox' ? snapshotDB(profile, 'places.sqlite', db => firefoxBookmarks(db, report)) : chromiumBookmarks(boundedJSON(profile, 'Bookmarks'), report); });
   if (options.history === true) await read('history', () => {
    staged.history = snapshotDB(profile, profile.kind === 'firefox' ? 'places.sqlite' : 'History', db => {
     const sql = profile.kind === 'firefox' ? 'SELECT url,title,last_visit_date AS stamp FROM moz_places WHERE last_visit_date IS NOT NULL ORDER BY last_visit_date DESC LIMIT ?' : 'SELECT url,title,last_visit_time AS stamp FROM urls WHERE last_visit_time>0 ORDER BY last_visit_time DESC LIMIT ?';
     const statement = db.prepare(sql); statement.setReadBigInts(true); const rows = statement.all(LIMITS.history + 1); if (rows.length > LIMITS.history) { rows.pop(); report.truncated = true; report.warnings.push('Only the newest 10,000 history URLs were considered'); }
     return rows.map(r => ({ url: r.url, title: r.title, time: Number(r.stamp) / 1000 - (profile.kind === 'firefox' ? 0 : 11644473600000) }));
    });
   });
   if (options.searchEngine === true) await read('searchEngine', () => {
    if (profile.kind === 'firefox') throw Error('Firefox search configuration import is not supported');
    const prefs = boundedJSON(profile, 'Preferences'); const provider = prefs.default_search_provider_data?.template_url_data || prefs.default_search_provider;
    staged.engine = engineFromTemplate(provider?.url || provider?.search_url);
    if (!staged.engine) throw Error('Search engine is absent or not one of Aster’s supported engines');
   });
   this.commit(staged, report); this.publish('complete', { report }); return report;
  } catch (e) { this.publish('failed', { error: text(e.message, 400), report }); throw e; } finally { this.busy = false; }
 }
 commit(staged, report) {
  const store = this.browser.store, data = store.data;
  const bookmarks = data.bookmarks.slice(), history = data.history.slice();
  const known = new Set(bookmarks.map(b => `${b.url}\0${b.folder || ''}`));
  for (const item of staged.bookmarks) {
   const url = safeURL(item.url); if (!url) { report.skipped++; continue; }
   const folder = text(item.folder, 6400), key = `${url}\0${folder}`;
   if (known.has(key)) { report.duplicates++; continue; }
   if (bookmarks.length >= LIMITS.records) { report.skipped++; report.truncated = true; continue; }
   known.add(key); bookmarks.push({ id: randomUUID(), url, title: text(item.title || url), folder }); report.imported.bookmarks++;
  }
  const seenHistory = new Set(history.map(h => `${h.url}\0${h.time}`));
  for (const item of staged.history) {
   const url = safeURL(item.url), time = Math.floor(item.time);
   if (!url || !Number.isFinite(time) || time <= 0 || time > Date.now() + 86400000) { report.skipped++; continue; }
   const key = `${url}\0${time}`; if (seenHistory.has(key)) { report.duplicates++; continue; }
   if (history.length >= LIMITS.history) { report.skipped++; report.truncated = true; continue; }
   seenHistory.add(key); history.push({ id: randomUUID(), url, title: text(item.title || url), time }); report.imported.history++;
  }
  history.sort((a, b) => b.time - a.time);
  const previous = { bookmarks: data.bookmarks, history: data.history, settings: data.settings };
  data.bookmarks = bookmarks; data.history = history; data.settings = { ...data.settings };
  if (staged.engine) { data.settings.searchEngine = staged.engine; report.imported.searchEngine = 1; }
  try { this.publish('saving', { report }); store.save(); } catch (e) { Object.assign(data, previous); throw e; }
 }
 async importHTML({ filePath, consent } = {}) {
  // filePath must come from main-process native open dialog, not arbitrary IPC payload.
  if (consent !== true) throw Error('Explicit consent is required to import a bookmark file');
  if (this.busy) throw Error('An import is already in progress'); this.busy = true;
  const report = { imported: { bookmarks: 0, history: 0, searchEngine: 0 }, duplicates: 0, skipped: 0, truncated: false, warnings: [], categories: { bookmarks: 'read' } };
  try { const stat = fs.lstatSync(filePath); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMITS.htmlBytes) throw Error('Select a regular bookmark HTML file no larger than 8 MiB');
   this.publish('reading', { category: 'bookmarks', report }); await new Promise(resolve => setImmediate(resolve));
   const source = fs.readFileSync(filePath, 'utf8'); if (Buffer.byteLength(source) > LIMITS.htmlBytes) throw Error('Bookmark file exceeds safety limit');
   this.commit({ bookmarks: parseBookmarkHTML(source, report), history: [], engine: null }, report); this.publish('complete', { report }); return report;
  } catch (e) { this.publish('failed', { error: text(e.message, 400), report }); throw e; } finally { this.busy = false; }
 }
}
module.exports = { Migration, LIMITS };

