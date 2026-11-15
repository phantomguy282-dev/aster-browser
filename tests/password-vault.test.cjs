'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PasswordVault, originOf, generatePassword, cleanText } = require('../src/main/password-vault.cjs');

// Stub Electron safeStorage with real authenticated encryption semantics:
// AES-256-GCM so the tests exercise actual encrypt/decrypt round trips.
let calls = 0;
const seal = (plain) => {
  calls++;
  const key = crypto.key();
  const iv = require('node:crypto').randomBytes(12);
  const cipher = require('node:crypto').createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]); // Buffer, like real safeStorage
};
const unseal = (blob) => {
  const raw = Buffer.from(blob, 'base64');
  const decipher = require('node:crypto').createDecipheriv('aes-256-gcm', crypto.key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
};
const crypto = { key: () => require('node:crypto').createHash('sha256').update('test-vault-key').digest() };
require.cache[require.resolve('../src/main/password-vault.cjs')].exports.electronSafe = null;

// Patch the module's electron() through Module._load is fragile; instead the
// module reads require('electron') — we inject a stub via a temp harness.
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'electron') {
    return { safeStorage: { isEncryptionAvailable: () => true, getSelectedStorageBackend: () => 'argon', encryptString: seal, decryptString: unseal } };
  }
  return originalLoad.call(this, request, ...args);
};
const { PasswordVault: PatchedVault } = (() => {
  delete require.cache[require.resolve('../src/main/password-vault.cjs')];
  return require('../src/main/password-vault.cjs');
})();

function makeVault(dir) {
  const fake = { store: { file: require('node:path').join(dir, 'profile.json') } };
  return new PatchedVault(fake);
}

test('origin normalization accepts web origins and rejects everything else', () => {
  assert.equal(originOf('https://Example.com/path?q=1'), 'https://example.com');
  assert.equal(originOf('http://localhost:8080/x'), 'http://localhost:8080');
  assert.equal(originOf('https://user:pass@evil.com/'), null);
  assert.equal(originOf('file:///etc/passwd'), null);
  assert.equal(originOf('javascript:alert(1)'), null);
  assert.equal(originOf('data:text/html,hi'), null);
  assert.equal(originOf('not a url'), null);
  assert.equal(originOf('https://example.com.'), 'https://example.com.'); // trailing dot kept — exact-match only
});

test('vault round-trips credentials through real encryption without plaintext on disk', () => {
  const dir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-'));
  const vault = makeVault(dir);
  const rec = vault.add({ origin: 'https://example.com/login', username: 'alice', password: 's3cret-示例-🔧', title: 'Example', notes: 'work' });
  assert.equal(rec.origin, 'https://example.com');
  assert.ok(!('password' in rec));
  assert.equal(vault.reveal(rec.id).password, 's3cret-示例-🔧');
  // The sealed blob on disk must not contain the plaintext.
  const raw = require('node:fs').readFileSync(vault.file, 'utf8');
  assert.ok(!raw.includes('s3cret-示例-🔧'));
  // Reload from disk and confirm decryption still works.
  const vault2 = makeVault(dir);
  assert.equal(vault2.reveal(rec.id).password, 's3cret-示例-🔧');
});

test('multiple accounts per origin and strict origin-bound retrieval', () => {
  const dir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-'));
  const vault = makeVault(dir);
  const a = vault.add({ origin: 'https://example.com', username: 'a@x.com', password: 'pw-a' });
  vault.add({ origin: 'https://example.com', username: 'b@x.com', password: 'pw-b' });
  const got = vault.forOrigin('https://example.com/anything?query');
  assert.equal(got.length, 2);
  assert.deepEqual(got.map((g) => g.username).sort(), ['a@x.com', 'b@x.com']);
  // Wrong origin (different port) returns nothing.
  assert.deepEqual(vault.forOrigin('https://example.com:8443/'), []);
  assert.deepEqual(vault.forOrigin('http://example.com/'), []);
});

test('search, update, and delete behave', () => {
  const dir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-'));
  const vault = makeVault(dir);
  const r = vault.add({ origin: 'https://shop.example.com', username: 'carol', password: 'old', title: 'Shop' });
  assert.equal(vault.search('shop').length, 1);
  vault.update(r.id, { password: 'new', username: 'carol2' });
  assert.equal(vault.reveal(r.id).password, 'new');
  assert.equal(vault.reveal(r.id).username, 'carol2');
  vault.remove(r.id);
  assert.throws(() => vault.reveal(r.id), /not found/i);
});

test('CSV export requires confirmation and CSV import is validated', () => {
  const dir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-'));
  const vault = makeVault(dir);
  vault.add({ origin: 'https://mail.example.com', username: 'dan', password: 'pass,"quoted"', title: 'Mail' });
  assert.throws(() => vault.exportCSV({}), /explicit user confirmation/i);
  const csv = vault.exportCSV({ confirmed: true });
  assert.match(csv, /"pass,""quoted"""/);
  const other = makeVault(require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-')));
  assert.throws(() => other.importCSV(csv, {}), /explicit user confirmation/i);
  const res = other.importCSV(csv, { confirmed: true });
  assert.equal(res.added, 1);
  assert.equal(other.reveal(other.list()[0].id).password, 'pass,"quoted"');
  const bad = other.importCSV('name,url,username,password\r\nBad,javascript:alert(1),x,secret\r\n', { confirmed: true });
  assert.equal(bad.added, 0);
  assert.equal(bad.skipped, 1);
});

test('password generator meets length bounds and class guarantees', () => {
  assert.throws(() => generatePassword(8), /12–128/);
  assert.throws(() => generatePassword(200), /12–128/);
  const pw = generatePassword(20);
  assert.equal(pw.length, 20);
  assert.match(pw, /[a-z]/);
  assert.match(pw, /[A-Z]/);
  assert.match(pw, /[2-9]/);
  const noSymbols = generatePassword(16, { symbols: false });
  assert.ok(!/[!@#]/.test(noSymbols));
  assert.notEqual(generatePassword(20), generatePassword(20));
});

test('vault refuses to operate without OS encryption and enforces limits', () => {
  // Fresh module copy under a stub where OS encryption is NOT available.
  const unavailableLoad = (request, ...args) => {
    if (request === 'electron') {
      return { safeStorage: { isEncryptionAvailable: () => false, getSelectedStorageBackend: () => 'basic_text' } };
    }
    return originalLoad.call(this, request, ...args);
  };
  const vaultPath = require.resolve('../src/main/password-vault.cjs');
  Module._load = unavailableLoad;
  delete require.cache[vaultPath];
  try {
    const { PasswordVault: UnavailableVault } = require(vaultPath);
    const dir = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'aster-vault-'));
    const fake = { store: { file: require('node:path').join(dir, 'profile.json') } };
    const vault = new UnavailableVault(fake);
    assert.equal(vault.status().storage, 'unavailable');
    assert.throws(() => vault.add({ origin: 'https://x.com', username: 'u', password: 'p' }), /OS-encrypted/);
  } finally {
    Module._load = (request, ...args) => request === 'electron' ? { safeStorage: { isEncryptionAvailable: () => true, getSelectedStorageBackend: () => 'argon', encryptString: seal, decryptString: unseal } } : originalLoad.call(this, request, ...args);
    delete require.cache[vaultPath];
  }
  // Field-length limits
  const long = 'x'.repeat(2000);
  assert.equal(cleanText(long, 200).length, 200);
});
