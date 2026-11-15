'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {validate}=require('../scripts/public-release-client.js');
function manifest(p={}){return {schema:1,version:'3.0.0',channel:'preview',signed:false,file:'https://github.com/owner/aster/releases/download/v3.0.0/Aster-Setup-3.0.0.exe',size:4096,sha256:'a'.repeat(64),...p};}
test('public client binds version, release tag and installer filename',()=>{
 assert.equal(validate(manifest()).version,'3.0.0');
 for(const p of [{version:'2.0.0'},{file:'https://github.com/owner/aster/releases/download/v2.0.0/Aster-Setup-3.0.0.exe'},{file:'https://github.com/owner/aster/releases/download/v3.0.0/Aster-Setup-2.0.0.exe'},{file:'https://user:pass@github.com/owner/aster/releases/download/v3.0.0/Aster-Setup-3.0.0.exe'},{file:'https://github.com:8443/owner/aster/releases/download/v3.0.0/Aster-Setup-3.0.0.exe'},{size:-1},{size:513*1024*1024},{channel:'stable'},{signed:true},{sha256:'not-a-checksum'}])assert.throws(()=>validate(manifest(p)),JSON.stringify(p));
});
test('browser client exposes only valid public links and hides malformed metadata',async()=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [body,valid]of [[JSON.stringify(manifest()),true],[JSON.stringify(manifest({version:'2.0.0'})),false],[JSON.stringify(manifest({file:'javascript:alert(1)'})),false],['invalid json',false],['x'.repeat(17000),false]]){
   await page.setContent('<main><p id="release-status"></p><a id="download-link" hidden>Download</a><span data-value="version"></span><code data-value="sha256"></code></main>');
   await page.evaluate(text=>{window.fetch=async()=>new Response(text,{status:200});},body);
   await page.addScriptTag({path:path.join(__dirname,'../scripts/public-release-client.js')});
   await page.waitForFunction(()=>document.querySelector('#release-status').textContent.length>0);
   assert.equal(await page.locator('#download-link').isVisible(),valid);
   if(valid){assert.equal(await page.locator('#download-link').getAttribute('href'),manifest().file);assert.equal(await page.locator('[data-value=version]').textContent(),'3.0.0');assert.equal(await page.locator('[data-value=sha256]').textContent(),'a'.repeat(64));}
   else assert.equal(await page.locator('#download-link').getAttribute('href'),null);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
