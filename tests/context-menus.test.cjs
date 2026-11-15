'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Pure-logic checks for the context menu item builder. Electron Menu is
// exercised in the packaged app; here we stub it and verify the menu rules.
const Module = require('node:module');
const originalLoad = Module._load;
const captured = [];
Module._load = function (request, ...args) {
  if (request === 'electron') {
    return {
      MenuItem: class { constructor(o) { captured.push(o); } },
      Menu: { buildFromTemplate: (t) => ({ items: t, popup: () => {} }) },
      clipboard: { writeText: () => {} },
      Notification: class {},
    };
  }
  return originalLoad.call(this, request, ...args);
};
const { ContextMenus } = require('../src/main/context-menus.cjs');

function fakeApp() {
  return {
    win: { isDestroyed: () => false, webContents: { send: () => {} } },
    store: { data: { settings: { searchEngine: 'duckduckgo' } } },
    tabs: { create: async () => {} },
    command: async () => {},
  };
}
function fakeTab(url = 'https://example.com/page') {
  const canBack = { canGoBack: () => true, canGoForward: () => false };
  return {
    id: 't1', url, title: 'Example', pinned: false,
    view: { webContents: { navigationHistory: canBack, inspectElement: () => {}, reload: () => {}, goBack: () => {}, goForward: () => {}, downloadURL: () => {}, savePage: async () => {}, print: async () => {}, executeJavaScript: async () => {}, openDevTools: () => {}, isDestroyed: () => false } },
  };
}

test('page background menu contains navigation, page, and tab actions', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'none', x: 5, y: 5, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const labels = items.filter(i => i.label).map(i => i.label);
  for (const expected of ['Back', 'Forward', 'Reload', 'Save page as…', 'Bookmark this page…', 'Copy page address', 'Print…', 'View page source', 'Inspect element', 'Duplicate tab', 'Pin tab', 'Reopen closed tab', 'Close tab']) {
    assert.ok(labels.includes(expected), `missing: ${expected}`);
  }
});

test('link menu offers open/copy but not image saves', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'none', linkURL: 'https://other.example/x', x: 0, y: 0, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const labels = items.filter(i => i.label).map(i => i.label);
  assert.ok(labels.includes('Open link in new tab'));
  assert.ok(labels.includes('Open link in new private tab'));
  assert.ok(labels.includes('Copy link address'));
  assert.ok(!labels.includes('Save image as…'));
  // Tab block must not appear for a link target.
  assert.ok(!labels.includes('Duplicate tab'));
});

test('image menu adds save/copy actions', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'image', srcURL: 'https://example.com/pic.png', hasImageContents: true, x: 0, y: 0, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const labels = items.filter(i => i.label).map(i => i.label);
  assert.ok(labels.includes('Save image as…'));
  assert.ok(labels.includes('Copy image address'));
  assert.ok(labels.includes('Open image in new tab'));
});

test('editable field menu uses role-based edit actions with flags', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'none', isEditable: true, editFlags: { canCut: true, canCopy: true, canPaste: false, canSelectAll: true }, x: 0, y: 0 }, { clipboard: { writeText: () => {} } });
  const paste = items.find(i => i.label === 'Paste');
  assert.equal(paste.enabled, false);
  const copy = items.find(i => i.label === 'Copy');
  assert.equal(copy.enabled, true);
  assert.ok(items.some(i => i.role === 'undo'));
});

test('selection menu includes search with configured engine', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'none', selectionText: 'curl documentation', x: 0, y: 0, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const labels = items.filter(i => i.label).map(i => i.label);
  assert.ok(labels.some(l => l.startsWith('Search the web for “curl documentation”')));
});

test('internal pages get no page-only actions that require web context', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab('aster://settings'), { mediaType: 'none', x: 0, y: 0, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const labels = items.filter(i => i.label).map(i => i.label);
  // Tab actions still offered; web page actions are not.
  assert.ok(labels.includes('Duplicate tab'));
  assert.ok(!labels.includes('View page source'));
  assert.ok(!labels.includes('Save page as…'));
});

test('clipped labels are sanitized and bounded', () => {
  const cm = new ContextMenus(fakeApp());
  const items = cm.buildItems(fakeTab(), { mediaType: 'none', selectionText: 'x'.repeat(500) + '\u0007', x: 0, y: 0, editFlags: {} }, { clipboard: { writeText: () => {} } });
  const label = items.find(i => i.label?.startsWith('Search the web for')).label;
  assert.ok(label.length < 100);
  assert.ok(!label.includes('\u0007'));
});
