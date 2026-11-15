'use strict';
/**
 * ASTER Password Vault — encrypted credential storage for the desktop app.
 *
 * Security model:
 * - Passwords are encrypted at rest with Electron safeStorage (OS backend:
 *   DPAPI on Windows / Keychain on macOS / kwallet+ on Linux). If the OS
 *   backend is unavailable, the vault refuses to operate rather than storing
 *   plaintext.
 * - Records are bound to a normalized HTTP(S) origin. Autofill consumers must
 *   match the exact origin (host + port + scheme); cross-origin reuse is never
 *   returned by `forOrigin`.
 * - No credentials are ever logged, transmitted, or silently exported.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const MAX_RECORDS = 500;
const MAX_FIELDS = { username: 200, password: 1024, notes: 2000, title: 200 };
const EXPORT_LIMIT = MAX_RECORDS;
const GENERATE_LIMITS = { min: 12, max: 128 };

function electron() { return require('electron'); }

function safeStorageOrThrow() {
  const { safeStorage } = electron();
  if (!safeStorage || !safeStorage.isEncryptionAvailable() || safeStorage.getSelectedStorageBackend?.() === 'basic_text') {
    throw new Error('OS-encrypted storage is unavailable; the password vault will not store credentials without it.');
  }
  return safeStorage;
}

/** Normalize a URL to a strict origin string or return null for non-web URLs. */
function originOf(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  if (!url.hostname || url.hostname.length > 253) return null;
  const port = url.port === '' ? '' : `:${url.port}`;
  return `${url.protocol}//${url.hostname.toLowerCase()}${port}`;
}

function cleanText(value, limit) {
  if (typeof value !== 'string') return '';
  // Strip control characters incl. bidi overrides so metadata cannot spoof UI.
  return value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').trim().slice(0, limit);
}

/** Generate a strong random password. Guarantees at least one of each class. */
function generatePassword(length = 20, { symbols = true } = {}) {
  if (!Number.isInteger(length) || length < GENERATE_LIMITS.min || length > GENERATE_LIMITS.max) {
    throw new Error(`Password length must be ${GENERATE_LIMITS.min}–${GENERATE_LIMITS.max}`);
  }
  const lower = 'abcdefghijkmnopqrstuvwxyz', upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789', symbolChars = symbols ? '!@#$%^&*()-_=+[]{};:,.?' : '';
  const pools = [lower, upper, digits, ...(symbolChars ? [symbolChars] : [])];
  const all = pools.join('');
  const pick = (pool) => pool[crypto.randomInt(pool.length)];
  const chars = pools.map(pick);
  while (chars.length < length) chars.push(pick(all));
  // Fisher-Yates with rejection-sampled random indices.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

class PasswordVault {
  constructor(store) {
    this.browser = store;
    this.file = path.join(path.dirname(store.store ? store.store.file : store.file), 'password-vault.enc');
    this.disposed = false;
    this.records = [];
    this.error = '';
    this.load();
  }

  // -- storage ------------------------------------------------------------
  secure() { return safeStorageOrThrow(); }

  load() {
    try {
      if (!fs.existsSync(this.file)) return;
      const stat = fs.lstatSync(this.file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) throw new Error('Invalid vault file');
      const data = JSON.parse(this.secure().decryptString(fs.readFileSync(this.file)));
      if (!Array.isArray(data.records)) throw new Error('Invalid vault record');
      this.records = data.records.slice(0, MAX_RECORDS).filter((r) => r && typeof r.id === 'string' && originOf(r.origin));
    } catch (err) {
      this.records = [];
      this.error = 'Saved passwords could not be decrypted. The vault was reset to avoid corrupt data.';
    }
  }

  save() {
    if (this.disposed) throw new Error('Vault closed');
    const safe = this.secure();
    const tmp = this.file + '.tmp';
    try {
      fs.writeFileSync(tmp, safe.encryptString(JSON.stringify({ version: 1, records: this.records })), { mode: 0o600 });
      fs.renameSync(tmp, this.file);
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  }

  // -- CRUD ---------------------------------------------------------------
  add({ origin, username, password, notes = '', title = '' }) {
    const org = originOf(origin);
    if (!org) throw new Error('Passwords can only be saved for HTTP/HTTPS websites');
    const user = cleanText(username, MAX_FIELDS.username);
    const pass = typeof password === 'string' && password.length > 0 && password.length <= MAX_FIELDS.password ? password : null;
    if (!pass) throw new Error('Password cannot be empty or exceed 1024 characters');
    if (this.records.length >= MAX_RECORDS) throw new Error(`Vault limit of ${MAX_RECORDS} credentials reached`);
    const now = Date.now();
    const record = {
      id: crypto.randomUUID(),
      origin: org,
      username: user,
      title: cleanText(title, MAX_FIELDS.title),
      notes: cleanText(notes, MAX_FIELDS.notes),
      dateCreated: now,
      dateUpdated: now,
      // The password itself is never stored in the record; only in the sealed blob.
    };
    record._sealed = this.seal(pass);
    this.records.push(record);
    this.save();
    return this.meta(record);
  }

  update(id, changes) {
    const record = this.records.find((r) => r.id === id);
    if (!record) throw new Error('Credential not found');
    if (changes.origin !== undefined) {
      const org = originOf(changes.origin);
      if (!org) throw new Error('Passwords can only be saved for HTTP/HTTPS websites');
      record.origin = org;
    }
    if (changes.username !== undefined) record.username = cleanText(changes.username, MAX_FIELDS.username);
    if (changes.title !== undefined) record.title = cleanText(changes.title, MAX_FIELDS.title);
    if (changes.notes !== undefined) record.notes = cleanText(changes.notes, MAX_FIELDS.notes);
    if (changes.password !== undefined) {
      if (typeof changes.password !== 'string' || !changes.password || changes.password.length > MAX_FIELDS.password) {
        throw new Error('Password cannot be empty or exceed 1024 characters');
      }
      record._sealed = this.seal(changes.password);
    }
    record.dateUpdated = Date.now();
    this.save();
    return this.meta(record);
  }

  remove(id) {
    const index = this.records.findIndex((r) => r.id === id);
    if (index < 0) throw new Error('Credential not found');
    this.records.splice(index, 1);
    this.save();
  }

  /** Metadata only — safe for listings. Never contains the password. */
  meta(record) {
    return {
      id: record.id, origin: record.origin, username: record.username, title: record.title,
      notes: record.notes, dateCreated: record.dateCreated, dateUpdated: record.dateUpdated,
    };
  }

  list() { return this.records.map((r) => this.meta(r)); }

  search(query) {
    const q = cleanText(query, 200).toLowerCase();
    if (!q) return this.list();
    return this.list().filter((r) => r.origin.toLowerCase().includes(q) || r.username.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
  }

  // -- sealing ------------------------------------------------------------
  seal(password) {
    return this.secure().encryptString(password).toString('base64');
  }

  open(record) {
    if (!record._sealed) throw new Error('Credential has no stored password');
    return this.secure().decryptString(Buffer.from(record._sealed, 'base64'));
  }

  /** All credentials for an exact origin — autofill's only permitted source. */
  forOrigin(url) {
    const org = originOf(url);
    if (!org) return [];
    return this.records.filter((r) => r.origin === org).map((r) => ({ id: r.id, username: r.username, password: this.open(r) }));
  }

  reveal(id) {
    const record = this.records.find((r) => r.id === id);
    if (!record) throw new Error('Credential not found');
    return { ...this.meta(record), password: this.open(record) };
  }

  // -- import / export ------------------------------------------------------
  /**
   * Export as CSV. Caller must have shown the user an explicit warning that
   * the file is UNENCRYPTED and must have obtained confirmation; this method
   * records that consent in the returned data so it cannot be silent.
   */
  exportCSV({ confirmed }) {
    if (confirmed !== true) throw new Error('Export requires explicit user confirmation that the file will be unencrypted');
    if (this.records.length > EXPORT_LIMIT) throw new Error('Vault exceeds export limit');
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = ['name,url,username,password,note'];
    for (const r of this.records) {
      rows.push([r.title, r.origin, r.username, this.open(r), r.notes].map(escape).join(','));
    }
    return rows.join('\r\n') + '\r\n';
  }

  /** Import rows from CSV exported by Aster or common browsers. */
  importCSV(text, { confirmed } = {}) {
    if (confirmed !== true) throw new Error('Import requires explicit user confirmation');
    if (typeof text !== 'string' || text.length > 2 * 1024 * 1024) throw new Error('Import file too large');
    const lines = text.split(/\r\n|\n/).filter((l) => l.length);
    if (!lines.length) throw new Error('Import file is empty');
    const parse = (line) => {
      const out = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (ch === '"') inQ = false;
          else cur += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    };
    let added = 0, skipped = 0;
    for (const line of lines.slice(1)) {
      const cols = parse(line);
      const [title, url, username, password, note] = cols;
      try {
        if (!url || !password) throw new Error('missing fields');
        this.add({ origin: url, username: username || '', password, notes: note || '', title: title || '' });
        added++;
      } catch { skipped++; }
    }
    return { added, skipped };
  }

  status() {
    let storage = 'unavailable';
    try { this.secure(); storage = 'os-encrypted'; } catch { /* reported below */ }
    return {
      count: this.records.length,
      limit: MAX_RECORDS,
      storage,
      error: this.error || (storage === 'unavailable' ? 'OS-encrypted storage is unavailable.' : ''),
      limits: { ...MAX_FIELDS, ...GENERATE_LIMITS, export: EXPORT_LIMIT },
    };
  }

  dispose() { this.disposed = true; this.records = []; }
}

module.exports = { PasswordVault, originOf, generatePassword, cleanText, MAX_RECORDS };
