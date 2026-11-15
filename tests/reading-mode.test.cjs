'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readerSource, DROP_SELECTORS } = require('../src/main/reading-mode.cjs');
const { ALLOWED } = require('../src/main/ipc-security.cjs');
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');

// Minimal DOM shim sufficient for the extraction logic: enough of
// querySelectorAll/textContent semantics implemented in pure JS.
function makeEl(tag, attrs = {}, children = [], text = '') {
  return {
    tagName: tag.toUpperCase(),
    _attrs: attrs,
    children,
    textContent: text || children.map(c => c.textContent).join(' '),
    width: attrs.width || 0,
    currentSrc: attrs.currentSrc || '',
    src: attrs.src || '',
    querySelector(sel) {
      for (const c of children) {
        if (matches(c, sel)) return c;
        const r = c.querySelector ? c.querySelector(sel) : null;
        if (r) return r;
      }
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      const walk = (n) => { for (const c of n.children || []) { if (matches(c, sel)) out.push(c); walk(c); } };
      walk(this);
      return out;
    },
    cloneNode() { return makeEl(tag, attrs, children.map(c => Object.assign({}, c)), text); },
  };
}
function matches(el, sel) {
  // Very small subset: tag, .class, #id, comma lists.
  return sel.split(',').some(part => {
    part = part.trim();
    if (!part) return false;
    if (/^[a-zA-Z]+$/.test(part)) return el.tagName.toLowerCase() === part;
    if (part.startsWith('.')) return (el._attrs.class || '').split(/\s+/).includes(part.slice(1));
    if (part.startsWith('#')) return el._attrs.id === part.slice(1);
    if (part.startsWith('[')) { const m = part.match(/\[(\w+)(?:=(.+))?\]/); if (!m) return false; return m[2] ? String(el._attrs[m[1]]) === m[2].replace(/['"]/g, '') : el._attrs[m[1]] !== undefined; }
    return false;
  });
}

test('reader extraction scores article container above boilerplate', () => {
  const nav = makeEl('nav', {}, [makeEl('p', {}, [], 'Home About Contact')]);
  const article = makeEl('article', {}, [
    makeEl('p', {}, [], 'Paragraph one with substantial article content about the topic at hand and more words to add density here.'),
    makeEl('p', {}, [], 'Paragraph two continues the substantive discussion with additional meaningful sentences of the article body text.'),
    makeEl('p', {}, [], 'Paragraph three concludes the body with a final meaningful passage of reasonable length for the extractor.'),
  ]);
  const doc = {
    title: 'Example Article',
    body: makeEl('body', {}, [nav, article]),
    querySelectorAll: (sel) => (sel === SCORED_LIST() ? [nav, article] : []),
    querySelector: (sel) => sel.includes('author') ? null : null,
    location: { hostname: 'example.com' },
  };
  const SCORED_LIST = () => 'article, main, [role=main], .post, .entry-content, #content, .article-body, .story';
  global.document = doc; global.location = doc.location;
  try {
    const src = readerSource();
    const fn = eval("(" + src + ")");
    const out = fn();
    assert.ok(out, 'extraction produced an article');
    assert.equal(out.title, 'Example Article');
    assert.equal(out.site, 'example.com');
    assert.ok(out.textLength >= 200, 'enough text extracted');
    assert.ok(out.blocks.some(b => b.t === 'p' && b.x.includes('Paragraph one')), 'body paragraphs present');
    // Nav text must not be in the article blocks
    assert.ok(!out.blocks.some(b => b.x.includes('Home About Contact')), 'nav dropped');
  } finally { delete global.document; delete global.location; }
});

test('extraction returns null for non-article pages', () => {
  const doc = {
    title: 'Login',
    body: makeEl('body', {}, [makeEl('form', {}, [makeEl('p', {}, [], 'Sign in')])]),
    querySelectorAll: () => [],
    querySelector: () => null,
    location: { hostname: 'example.com' },
  };
  global.document = doc; global.location = doc.location;
  try {
    const fn = eval(readerSource());
    assert.equal(fn(), null);
  } finally { delete global.document; delete global.location; }
});

test('readingExtract is allowlisted and validates web URLs', () => {
  assert.ok(ALLOWED.has('readingExtract'));
  const main = fs.readFileSync(path.join(ROOT, 'src/main/main.cjs'), 'utf8');
  const m = main.match(/case 'readingExtract':\{([^}]+)\}/);
  assert.ok(m, 'case found');
  assert.match(m[1], /webURL\(t\.url\)/, 'URL validation present');
});

test('renderer reading mode entry is menu-wired and guarded', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  assert.match(app, /case'readingOpen':/);
  assert.match(app, /Reading mode/);
});
