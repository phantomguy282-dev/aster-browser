'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Android remote-debugging toggle + iOS inspectable plan (source-level checks).
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');

test('Android WebView remote debugging is enabled for debug builds', () => {
  const src = fs.readFileSync(path.join(ROOT, 'mobile/android/app/src/main/java/app/aster/mobile/MainActivity.kt'), 'utf8');
  assert.match(src, /WebView\.setWebContentsDebuggingEnabled\(BuildConfig\.DEBUG\)/, 'remote debugging call missing');
  // Guard against duplicate enable calls.
  const occurrences = (src.match(/setWebContentsDebuggingEnabled/g) || []).length;
  assert.equal(occurrences, 1, 'debugging toggle should appear exactly once');
});

test('DevTools phase documentation exists and is honest', () => {
  const doc = fs.readFileSync(path.join(ROOT, 'AI_CONTEXT/PHASE3-DEVTOOLS.md'), 'utf8');
  assert.match(doc, /chrome:\/\/inspect/, 'Android remote debugging path documented');
  assert.match(doc, /isInspectable/, 'iOS inspectable plan documented');
  assert.match(doc, /No in-app custom DevTools panels/, 'no fake panels claim');
});

test('desktop context menu keeps real engine entry points', () => {
  const { ALLOWED } = require('../src/main/ipc-security.cjs');
  assert.ok(ALLOWED.has('openDevTools'));
  const src = fs.readFileSync(path.join(ROOT, 'src/main/context-menus.cjs'), 'utf8');
  assert.match(src, /inspectElement/);
  assert.match(src, /view-source:/);
});
