'use strict';
const path=require('node:path');
function safeFilename(value){let name=path.win32.basename(String(value||'download')).replace(/[<>:"/\\|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'_').replace(/[. ]+$/g,'');if(!name||name==='.'||name==='..')name='download';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='_'+name;const ext=path.win32.extname(name).slice(0,24);return name.length>180?name.slice(0,180-ext.length)+ext:name;}
module.exports={safeFilename};
