'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// captureCopy was added as a hardened command. Verify allowlist + main wiring
// without launching Electron (the command body itself needs a real capturePage).
const { ALLOWED } = require('../src/main/ipc-security.cjs');
const main = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/main/main.cjs'), 'utf8');

test('captureCopy is allowlisted and wired in main', () => {
  assert.ok(ALLOWED.has('captureCopy'), 'captureCopy missing from IPC allowlist');
  assert.ok(main.includes("case 'captureCopy'"), 'captureCopy case missing in main.cjs');
  assert.match(main, /captureCopy'\s*:\s*\{[^}]*clipboard\.writeImage/, 'captureCopy must write to clipboard');
});

test('captureCopy rejects non-web pages like capturePage does', () => {
  const m = main.match(/case 'captureCopy':\{([^}]+)\}/);
  assert.ok(m, 'case body found');
  assert.match(m[1], /webURL\(t\.url\)/, 'must validate web URL before capture');
});
