'use strict';
/**
 * ASTER Reading Mode (desktop) — DOM-based article extraction in the page
 * process. Runs as an isolated function inside web content via
 * executeJavaScript; no privileges, no bridge, read-only analysis of the
 * page's own DOM. Never modifies the site; renders the extracted article in
 * an internal aster://reading page.
 */
const ARTICLE_SELECTORS = 'article, main, [role=main], .post, .entry-content, #content, .article-body, .story';
const DROP_SELECTORS = 'script, style, nav, header, footer, aside, form, iframe, noscript, svg, button, [aria-hidden=true], .ad, .ads, .advert, .social-share, .related, .comments, .sidebar, .nav, .menu, .breadcrumb, .newsletter, .paywall, .cookie';

function readerSource(maxChars = 200000) {
  // Returns a stringified IIFE to pass to webContents.executeJavaScript.
  return `(() => {
    const MAX = ${maxChars};
    const DROP = ${JSON.stringify(DROP_SELECTORS)};
    const SCORED = ${JSON.stringify(ARTICLE_SELECTORS)};
    const clean = (t) => String(t || '').replace(/[\\u0000-\\u001f\\u007f]/g, ' ').replace(/\\s+/g, ' ').trim();
    // Choose the densest candidate container by paragraph text length.
    let best = null, bestScore = 0;
    for (const el of document.querySelectorAll(SCORED)) {
      const paras = el.querySelectorAll('p');
      let score = 0;
      for (const p of paras) score += clean(p.textContent).length;
      // Prefer containers whose paragraphs dominate their own content.
      const total = clean(el.textContent).length;
      const density = total > 0 ? score / total : 0;
      const finalScore = score * (0.5 + density / 2);
      if (finalScore > bestScore) { bestScore = finalScore; best = el; }
    }
    if (!best) {
      const paras = [...document.querySelectorAll('p')];
      const total = paras.reduce((n, p) => n + clean(p.textContent).length, 0);
      if (total < 200) return null;
      best = document.body;
    }
    const clone = best.cloneNode(true);
    for (const node of clone.querySelectorAll(DROP)) node.remove();
    const title = clean(document.title).slice(0, 300);
    const bylineMeta = document.querySelector('meta[name="author"], meta[property="article:author"]');
    const byline = clean(bylineMeta?.content || '').slice(0, 200);
    const out = { title, byline, site: location.hostname, blocks: [] };
    const pushText = (tag, text) => { const c = clean(text); if (c) out.blocks.push({ t: tag, x: c.slice(0, 4000) }); };
    for (const el of clone.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre,figcaption')) {
      if (out.blocks.reduce((n, b) => n + b.x.length, 0) > MAX) break;
      if (el.querySelector('p')) continue; // container duplicates children
      const text = el.textContent;
      if (el.tagName === 'P' && clean(text).length < 25) continue; // skip stub paragraphs
      pushText(el.tagName.toLowerCase(), text);
    }
    const images = [];
    for (const img of clone.querySelectorAll('img')) {
      const src = img.currentSrc || img.src || '';
      if (/^https?:/i.test(src) && img.width >= 200 && images.length < 12) images.push(src);
    }
    out.images = images;
    out.textLength = out.blocks.reduce((n, b) => n + b.x.length, 0);
    return out.blocks.length >= 3 && out.textLength >= 200 ? out : null;
  })`;
}

module.exports = { readerSource, ARTICLE_SELECTORS, DROP_SELECTORS };
