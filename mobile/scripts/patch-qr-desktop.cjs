const fs = require('fs');
const p = 'src/ui/app.js';
let s = fs.readFileSync(p, 'utf8');
if (s.includes("case'qrCurrent'")) { console.log('already wired'); process.exit(0); }
const anchor = "case'capturePage':case'newTab':";
if (!s.includes(anchor)) throw Error('anchor missing');
const addition = [
  "case'qrCurrent':{const t=active();if(!t||!/^https?:/.test(t.url||'')){toast('Open a website first',true);break;}",
  "const r=await call('qrGenerate',{url:t.url});",
  "if(r&&r.dataUrl){modal('QR code',`<div style=\\\"text-align:center\\\"><img src=\\\"${r.dataUrl}\\\" width=\\\"256\\\" height=\\\"256\\\" alt=\\\"QR code\\\"><p class=\\\"field-description\\\">${esc(t.url)}</p></div>`,async()=>true);}",
  "break;}",
  "case'qrSaveCurrent':{const t=active();if(!t||!/^https?:/.test(t.url||'')){toast('Open a website first',true);break;}",
  "const saved=await call('qrSave',{url:t.url});if(saved&&saved.saved)toast('QR code saved');break;}"
].join('');
s = s.replace(anchor, addition + anchor);
// Menu entry
s = s.replace("${menuItem('capturePage','Capture visible page','copy')}", "${menuItem('capturePage','Capture visible page','copy')}${menuItem('qrCurrent','Show QR code','share')}");
fs.writeFileSync(p, s);
console.log('renderer qr wired:', s.includes("case'qrCurrent'"), s.includes('Show QR code'));
