'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ALLOWED } = require('../src/main/ipc-security.cjs');
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');

test('QR commands are allowlisted and require HTTP(S) URLs', () => {
  assert.ok(ALLOWED.has('qrGenerate'));
  assert.ok(ALLOWED.has('qrSave'));
  const main = fs.readFileSync(path.join(ROOT, 'src/main/main.cjs'), 'utf8');
  const gen = main.match(/case 'qrGenerate':\{([^}]+)\}/);
  assert.ok(gen, 'qrGenerate case found');
  assert.match(gen[1], /webURL\(url\)/, 'qrGenerate must validate the URL');
  const save = main.match(/case 'qrSave':\{([^}]+)\}/);
  assert.ok(save, 'qrSave case found');
  assert.match(save[1], /webURL\(url\)/, 'qrSave must validate the URL');
});

test('qrcode dependency is declared and functional', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies && pkg.dependencies.qrcode, 'qrcode in dependencies');
  const qrcode = require('qrcode');
  return qrcode.toDataURL('https://aster.test/x').then(d => {
    assert.match(d, /^data:image\/png;base64,/);
  });
});

test('renderer QR menu entry exists with guarded page check', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  assert.match(app, /case'qrCurrent':/, 'renderer qr action');
  assert.match(app, /Show QR code/, 'menu entry');
  assert.match(app, /\^https\?:/, 'guards to web pages only');
});
