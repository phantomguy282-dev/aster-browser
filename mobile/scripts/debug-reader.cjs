// Debug harness for reading-mode extraction (run: node mobile/scripts/debug-reader.cjs)
function matches(el, sel) {
  return sel.split(',').some(part => {
    part = part.trim();
    if (!part) return false;
    if (/^[a-zA-Z]+$/.test(part)) return el.tagName.toLowerCase() === part;
    if (part.startsWith('.')) return (el._attrs.class || '').split(/\s+/).includes(part.slice(1));
    if (part.startsWith('#')) return el._attrs.id === part.slice(1);
    if (part.startsWith('[')) {
      const m = part.match(/\[(\w+)(?:=(.+))?\]/);
      if (!m) return false;
      return m[2] ? String(el._attrs[m[1]]) === m[2].replace(/['"]/g, '') : el._attrs[m[1]] !== undefined;
    }
    return false;
  });
}
function makeEl(tag, attrs = {}, children = [], text = '') {
  const el = {
    tagName: tag.toUpperCase(), _attrs: attrs, children,
    textContent: text || children.map(c => c.textContent).join(' '),
    width: 0, currentSrc: '', src: '',
    querySelector(sel) {
      for (const c of children) { if (matches(c, sel)) return c; const r = c.querySelector ? c.querySelector(sel) : null; if (r) return r; }
      return null;
    },
    querySelectorAll(sel) { const out = []; const walk = n => { for (const c of n.children || []) { if (matches(c, sel)) out.push(c); walk(c); } }; walk(el); return out; },
    cloneNode() { return makeEl(tag, attrs, children.map(c => Object.assign({}, c)), text); },
  };
  return el;
}
const nav = makeEl('nav', {}, [makeEl('p', {}, [], 'Home About Contact')]);
const article = makeEl('article', {}, [
  makeEl('p', {}, [], 'Paragraph one with substantial article content about the topic at hand and more words to add density here.'),
  makeEl('p', {}, [], 'Paragraph two continues the substantive discussion with additional meaningful sentences of the article body text.'),
  makeEl('p', {}, [], 'Paragraph three concludes the body with a final meaningful passage of reasonable length for the extractor.'),
]);
global.document = {
  title: 'Example Article',
  body: makeEl('body', {}, [nav, article]),
  querySelectorAll: (sel) => (sel.startsWith('article, main') ? [nav, article] : []),
  querySelector: () => null,
};
global.location = { hostname: 'example.com' };
const { readerSource } = require('../../src/main/reading-mode.cjs');
const fn = eval('(' + readerSource() + ')');
const out = fn();
console.log(JSON.stringify(out && { title: out.title, blocks: out.blocks.length, text: out.textLength, first: out.blocks[0] }, null, 1));
