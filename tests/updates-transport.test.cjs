'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {Updates}=require('../src/main/updates.cjs');

// Transport fixtures only. No executable is launched, packaged trust key changed,
// OS certificate installed, or TLS verification disabled.
test('Updates HTTPS transport with test-scoped CA and ephemeral signing trust',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aster-update-transport-'));
 const keyFile=path.join(dir,'tls-key.pem'),certFile=path.join(dir,'tls-cert.pem');
 const openssl='C:\\Program Files\\Git\\usr\\bin\\openssl.exe';
 assert.ok(fs.existsSync(openssl),'OpenSSL fixture generator must be available');
 const generated=spawnSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',keyFile,'-out',certFile,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
 assert.equal(generated.status,0,'TLS fixture certificate generation');
 const pair=crypto.generateKeyPairSync('ed25519');
 const pinned=path.join(dir,'fixture-signing-public.pem');fs.writeFileSync(pinned,pair.publicKey.export({type:'spki',format:'pem'}));
 const bytes=Buffer.alloc(192*1024,0x61);Buffer.from('INERT UPDATE TEST DATA - NOT AN EXECUTABLE').copy(bytes);
 let base,envelope,artifact=bytes,redirectFeed=false,redirectArtifact=false,feedHits=0,fileHits=0;
 const server=https.createServer({key:fs.readFileSync(keyFile),cert:fs.readFileSync(certFile)},(req,res)=>{
  if(req.url==='/feed.json'){feedHits++;if(redirectFeed){res.writeHead(302,{Location:base+'/other-feed.json'});res.end();return;}const body=Buffer.from(JSON.stringify(envelope));res.writeHead(200,{'Content-Type':'application/json','Content-Length':body.length});res.end(body);return;}
  if(req.url==='/fixture.exe'){fileHits++;if(redirectArtifact){res.writeHead(307,{Location:base+'/other.exe'});res.end();return;}res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':artifact.length});let offset=0;const timer=setInterval(()=>{if(offset>=artifact.length){clearInterval(timer);res.end();return;}res.write(artifact.subarray(offset,offset+16384));offset+=16384;},30);res.on('close',()=>clearInterval(timer));return;}
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`https://127.0.0.1:${server.address().port}`;
 const originalAgent=https.globalAgent;const fixtureAgent=new https.Agent({ca:fs.readFileSync(certFile),keepAlive:false,rejectUnauthorized:true});
 const managers=[];let serial=0;
 function signed(version='0.2.0'){
  const metadata={version,publishedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),url:base+'/fixture.exe',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),size:bytes.length,notes:'Local inert transport fixture only'};
  const payload=Buffer.from(JSON.stringify(metadata));return {payload:payload.toString('base64'),signature:crypto.sign(null,payload,pair.privateKey).toString('base64')};
 }
 function manager(){const profile=path.join(dir,'profile-'+(++serial));fs.mkdirSync(profile);const samples=[];let m,confirmations=0;const browser={win:{},store:{file:path.join(profile,'aster-data.json'),data:{settings:{updateUrl:base+'/feed.json'}},save(){fs.writeFileSync(this.file,JSON.stringify(this.data));}},emit(){if(m)samples.push({...m.progress,status:m.phase});}};m=new Updates(browser);m.keyPath=pinned;m.currentVersion=()=> '0.1.0';m.electron=()=>({dialog:{async showMessageBox(_win,options){confirmations++;assert.equal(options.defaultId,0);assert.equal(options.cancelId,0);return {response:0};}},app:{quit(){assert.fail('Cancel must never quit or launch installation');}}});managers.push(m);return {m,samples,get confirmations(){return confirmations;}};}
 try{
  envelope=signed();
  await t.test('ordinary TLS validation rejects untrusted fixture certificate',async()=>{https.globalAgent=originalAgent;const {m}=manager();await assert.rejects(m.check(),/self.signed|certificate/i);assert.equal(m.available,null);assert.equal(feedHits,0);});
  https.globalAgent=fixtureAgent;
  await t.test('valid signed HTTPS feed and streamed inert artifact verify with progress',async()=>{
   const f=manager();const available=await f.m.check();assert.equal(available.status,'available');assert.equal(available.available.version,'0.2.0');assert.equal(f.m.browser.store.data.updateSecurity.version,'0.2.0');
   const downloaded=await f.m.download();assert.equal(downloaded.status,'downloaded');assert.deepEqual(downloaded.progress,{received:bytes.length,total:bytes.length});assert.deepEqual(fs.readFileSync(f.m.file),bytes);
   const progress=f.samples.filter(x=>x.status==='downloading');assert.ok(progress.some(x=>x.received>0&&x.received<bytes.length),'real intermediate transport progress');assert.ok(progress.every((x,i)=>!i||x.received>=progress[i-1].received),'monotonic progress');
   const result=await f.m.install();assert.equal(result.status,'downloaded');assert.equal(f.confirmations,1);assert.ok(fs.existsSync(f.m.file),'Cancel retains the verified stage');
  });
  await t.test('same-length corrupt artifact fails hash and leaves no staged files',async()=>{artifact=Buffer.alloc(bytes.length,0x62);const {m}=manager();await m.check();await assert.rejects(m.download(),/checksum/);assert.equal(m.file,null);assert.equal(m.status().status,'error');assert.deepEqual(fs.readdirSync(m.stage),[]);artifact=bytes;});
  await t.test('HTTPS metadata redirect is rejected without following',async()=>{redirectFeed=true;const {m}=manager();await assert.rejects(m.check(),/HTTP 302; redirects are not followed/);assert.equal(m.available,null);redirectFeed=false;});
  await t.test('HTTPS artifact redirect is rejected and no stage remains',async()=>{redirectArtifact=true;const {m}=manager();await m.check();await assert.rejects(m.download(),/HTTP 307; redirects are not followed/);assert.equal(m.file,null);assert.deepEqual(fs.readdirSync(m.stage),[]);redirectArtifact=false;});
  await t.test('tampered signature and older signed feed rejected over real HTTPS',async()=>{
   const {m}=manager();envelope=signed('0.3.0');await m.check();envelope={...envelope,signature:Buffer.alloc(64).toString('base64')};await assert.rejects(m.check(),/signature/);assert.equal(m.available,null);
   envelope=signed('0.2.0');await assert.rejects(m.check(),/Replayed/);assert.equal(m.available,null);assert.equal(m.browser.store.data.updateSecurity.version,'0.3.0');
  });
  assert.equal(feedHits,7);assert.equal(fileHits,3);
 }finally{
  for(const m of managers)m.dispose();https.globalAgent=originalAgent;fixtureAgent.destroy();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
 assert.equal(https.globalAgent,originalAgent,'original process-global TLS agent restored');
});

