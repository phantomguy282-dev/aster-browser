const fs = require('fs');
const p = 'src/ui/app.js';
let s = fs.readFileSync(p, 'utf8');
if (s.includes("case'readingOpen'")) { console.log('already wired'); process.exit(0); }
const anchor = "case'qrCurrent':{";
if (!s.includes(anchor)) throw Error('qr anchor missing');
const addition = [
  "case'readingOpen':{const t=active();if(!t||!/^https?:/.test(t.url||'')){toast('Open a website first',true);break;}",
  "try{const a=await call('readingExtract');",
  "const html=a.blocks.map(b=>b.t==='p'?`<p>${esc(b.x)}</p>`:b.t==='li'?`<li>${esc(b.x)}</li>`:b.t==='blockquote'?`<blockquote>${esc(b.x)}</blockquote>`:b.t==='pre'?`<pre>${esc(b.x)}</pre>`:`<${b.t}>${esc(b.x)}</${b.t}>`).join('');",
  "const images=(a.images||[]).map(u=>`<img src=\\\"${esc(u)}\\\" alt=\\\"\\\" loading=\\\"lazy\\\">`).join('');",
  "modal('Reading mode',`<article class=\\\"reader\\\" style=\\\"max-width:680px;line-height:1.7\\\"><h1 style=\\\"margin:0 0 4px\\\">${esc(a.title)}</h1><p class=\\\"field-description\\\">${esc(a.site)}${a.byline?' · '+esc(a.byline):''}</p><div style=\\\"font-size:1.05em\\\">${images}${html}</div></article>`,async()=>true);",
  "}catch(err){toast(String(err.message||err),true);}break;}"
].join('');
s = s.replace(anchor, addition + anchor);
s = s.replace("${menuItem('qrCurrent','Show QR code','share')}", "${menuItem('qrCurrent','Show QR code','share')}${menuItem('readingOpen','Reading mode','book')}");
fs.writeFileSync(p, s);
console.log('reading wired:', s.includes("case'readingOpen'"), s.includes('Reading mode'));
