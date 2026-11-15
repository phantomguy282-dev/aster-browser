'use strict';
window.AsterPasswords=(()=>{
 let state={},bound=false,clipboardTimer=null;
 const E=v=>window.UI.esc(v),T=v=>window.AsterI18n?.t(v)||v,H=v=>E(T(v));
 const fmtDate=t=>t?new Date(t).toLocaleString():'';
 async function data(){const [status,list]=await Promise.all([window.UI.call('passwordStatus'),window.UI.call('passwordList')]);return {status,list:list||[]};}
 function render(kind,s,t){
  state.__tab=t;
  return data().then(({status,list})=>{
   if(!status) return `<section class="sc-center"><h1>${H('Password Manager')}</h1><p>${H('Vault unavailable.')}</p></section>`;
   if(status.storage!=='os-encrypted'){
    return `<section class="sc-center"><header class="sc-center-head"><span class="sc-kicker">ASTER / ${H('PASSWORDS')}</span><h1>${H('Password Manager')}</h1></header><div class="sc-warning"><p>${H('OS-encrypted storage is unavailable, so Aster will not store passwords. The vault refuses to operate rather than save credentials in plaintext.')}</p><p class="sc-note">${E(status.error||'')}</p></div></section>`;
   }
   const rows=list.map(r=>`<article class="card password-row" data-id="${E(r.id)}">
    <div class="password-main"><strong>${E(r.title||r.origin)}</strong><span class="sc-note">${E(r.origin)} · ${E(r.username||'—')} · ${H('Updated')} ${E(fmtDate(r.dateUpdated))}</span></div>
    <div class="sc-nav">
     <button class="button" type="button" data-pw-action="reveal" data-id="${E(r.id)}">${H('Show password')}</button>
     <button class="button" type="button" data-pw-action="copy" data-id="${E(r.id)}">${H('Copy password')}</button>
     <button class="button" type="button" data-pw-action="edit" data-id="${E(r.id)}">${H('Edit')}</button>
     <button class="button" type="button" data-pw-action="remove" data-id="${E(r.id)}">${H('Delete')}</button>
    </div></article>`).join('');
   return `<section class="sc-center"><header class="sc-center-head"><div><span class="sc-kicker">ASTER / ${H('PASSWORDS')}</span><h1>${H('Password Manager')}</h1>
    <p>${H('Credentials are encrypted with your operating system\'s protected storage and never leave this device. Autofill is restricted to the exact saved website origin. Local checks are not a breach monitor.')}</p></div></header>
   <p class="sc-note">${H('Saved credentials')}: ${status.count} / ${status.limit}</p>
   <div class="password-toolbar card">
    <form id="password-add"><h3>${H('Add credential')}</h3>
     <label>${H('Website (https://…)')} <input name="origin" required placeholder="https://example.com" autocomplete="off"></label>
     <label>${H('Username')} <input name="username" maxlength="200" autocomplete="off"></label>
     <label>${H('Password')} <input name="password" type="text" required maxlength="1024" autocomplete="off"></label>
     <label>${H('Title (optional)')} <input name="title" maxlength="200" autocomplete="off"></label>
     <div class="sc-nav"><button class="button primary" type="submit">${H('Save')}</button>
     <button class="button" type="button" data-pw-action="generate">${H('Generate password')}</button></div>
    </form>
   </div>
   <form id="password-search" class="card"><label>${H('Search')} <input name="query" maxlength="200" placeholder="${H('origin, username or title')}"></label></form>
   <div>${rows||`<p class="sc-note">${H('No saved credentials yet.')}</p>`}</div>
   <div class="sc-nav export-row">
    <button class="button" type="button" data-pw-action="export">${H('Export CSV…')}</button>
    <button class="button" type="button" data-pw-action="import">${H('Import CSV…')}</button>
   </div>
   <p id="password-feedback" role="status" class="sc-note"></p></section>`;
  });
 }
 function feedback(msg){const el=document.getElementById('password-feedback');if(el)el.textContent=msg;else window.UI.toast(msg);}
 function clearClipboardLater(){if(clipboardTimer)clearTimeout(clipboardTimer);clipboardTimer=setTimeout(async()=>{try{await navigator.clipboard.writeText(' ');}catch{}},45000);}
 async function refresh(){const s=await window.UI.call('state');if(s){window.UI.renderPage(true);}}
 function afterRender(){
  if(bound)return;bound=true;
  document.addEventListener('submit',async e=>{
   const f=e.target;
   if(f.id==='password-add'){
    e.preventDefault();
    const d=new FormData(f);
    try{
     await window.UI.call('passwordAdd',{origin:d.get('origin'),username:d.get('username')||'',password:d.get('password'),title:d.get('title')||''});
     f.reset();feedback(T('Credential saved'));await refresh();
    }catch(err){feedback(String(err.message||err));}
   }else if(f.id==='password-search'){
    e.preventDefault();
    const q=new FormData(f).get('query')||'';
    const list=await window.UI.call('passwordSearch',{query:q});
    feedback(list&&list.length?list.map(r=>`${r.title||r.origin} — ${r.username||''}`).join('\n'):T('No matches.'));
   }
  });
  document.addEventListener('click',async e=>{
   const el=e.target.closest('[data-pw-action]');if(!el)return;
   e.preventDefault();
   const id=el.dataset.id;
   try{
    switch(el.dataset.pwAction){
     case 'generate':{
      const {password}=await window.UI.call('passwordGenerate',{length:20,symbols:true});
      const input=document.querySelector('#password-add input[name="password"]');
      if(input){input.value=password;input.focus();}
      feedback(T('Generated password placed in the form — save it.'));
      break;}
     case 'reveal':{
      const r=await window.UI.call('passwordReveal',{id});
      feedback(`${r.title||r.origin} — ${T('password')}: ${r.password}`);
      break;}
     case 'copy':{
      const r=await window.UI.call('passwordReveal',{id});
      await navigator.clipboard.writeText(r.password);
      clearClipboardLater();
      feedback(T('Password copied. The clipboard is cleared in 45 seconds when possible.'));
      break;}
     case 'edit':{
      const r=await window.UI.call('passwordReveal',{id});
      window.UI.modal('Edit credential',`
       <label class="modal-field">Website<input name="origin" required value="${E(r.origin)}"></label>
       <label class="modal-field">Username<input name="username" maxlength="200" value="${E(r.username||'')}"></label>
       <label class="modal-field">Password<input name="password" type="text" maxlength="1024" value="${E(r.password)}"></label>
       <label class="modal-field">Title<input name="title" maxlength="200" value="${E(r.title||'')}"></label>`,
       async data=>{
        await window.UI.call('passwordUpdate',{id,origin:data.get('origin'),username:data.get('username'),password:data.get('password'),title:data.get('title')});
        window.UI.toast('Credential updated');await refresh();return true;
       });
      break;}
     case 'remove':{
      if(!confirm(T('Delete this saved credential?')))return;
      await window.UI.call('passwordRemove',{id});await refresh();
      break;}
     case 'export':{
      if(!confirm(T('Export passwords as an UNENCRYPTED CSV file? Anyone with access to this computer or the file can read every password.')))return;
      const res=await window.UI.call('passwordExport',{confirmed:true});
      if(res&&res.saved)feedback(`${T('Exported to')} ${res.saved}`);
      break;}
     case 'import':{
      if(!confirm(T('Import passwords from a CSV file? Rows are merged; import requires a plain CSV (name,url,username,password,note).')))return;
      const res=await window.UI.call('passwordImport',{confirmed:true});
      if(res)feedback(`${T('Imported')} ${res.added}, ${T('skipped')} ${res.skipped}`);
      await refresh();
      break;}
    }
   }catch(err){feedback(String(err.message||err));}
  });
 }
 return {render,afterRender,kinds:['passwords']};
})();
