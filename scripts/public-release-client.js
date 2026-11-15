'use strict';
(function(root){
 function validate(m){
  if(!m||m.schema!==1||m.channel!=='preview'||m.signed!==false||typeof m.version!=='string'||!/^\d+\.\d+\.\d+$/.test(m.version)||!Number.isSafeInteger(m.size)||m.size<1024||m.size>512*1024*1024||typeof m.sha256!=='string'||!/^[a-f0-9]{64}$/.test(m.sha256))throw Error('Invalid public release metadata');
  const url=new URL(m.file);if(url.protocol!=='https:'||url.hostname!=='github.com'||url.username||url.password||url.port||url.search||url.hash)throw Error('Invalid public release URL');
  const parts=url.pathname.split('/');if(parts.length!==7||!parts[1]||!parts[2]||![parts[1],parts[2]].every(v=>/^[\w.-]+$/.test(v)&&v!=='.'&&v!=='..')||parts[3]!=='releases'||parts[4]!=='download'||![m.version,'v'+m.version].includes(parts[5])||parts[6]!==`Aster-Setup-${m.version}.exe`)throw Error('Release URL and version do not match');
  return {...m,file:url.href};
 }
 async function render(doc=root.document,fetcher=root.fetch){
  const status=doc.querySelector('#release-status'),link=doc.querySelector('#download-link');if(!status)return;
  try{const r=await fetcher('release.json',{cache:'no-store'});if(!r.ok)throw Error('Metadata unavailable');const text=await r.text();if(text.length>16384)throw Error('Metadata too large');const m=validate(JSON.parse(text));
   const values={version:m.version,channel:'Preview',date:'See public release timestamp',size:(m.size/1048576).toFixed(1)+' MiB',sha256:m.sha256,platform:'Windows 10/11 x64'};for(const [key,value]of Object.entries(values)){const el=doc.querySelector(`[data-value="${key}"]`);if(el)el.textContent=value;}
   if(link){link.href=m.file;link.rel='noopener noreferrer';link.hidden=false;link.textContent=`Download Aster ${m.version} · Windows x64`;}
   status.textContent='Public release bytes verified before deployment. Unsigned preview; compare the downloaded checksum.';
  }catch{if(link){link.hidden=true;link.removeAttribute('href');}status.textContent='No valid public release metadata available.';}
 }
 if(typeof module==='object'&&module.exports)module.exports={validate,render};else render();
})(typeof globalThis==='object'?globalThis:this);
