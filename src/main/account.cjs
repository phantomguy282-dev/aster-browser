'use strict';
const crypto=require('node:crypto'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const AUTH='https://accounts.google.com/o/oauth2/v2/auth',TOKEN='https://oauth2.googleapis.com/token',REVOKE='https://oauth2.googleapis.com/revoke';
function pkce(){const verifier=crypto.randomBytes(48).toString('base64url');return {verifier,challenge:crypto.createHash('sha256').update(verifier).digest('base64url')};}
function clientId(value){if(typeof value!=='string'||value.length>300||!/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(value))throw Error('Enter a registered Google Desktop OAuth client ID');return value;}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function callbackResponse(req,port,state){
 if(req.method!=='GET'||req.headers.host!==`127.0.0.1:${port}`||typeof req.url!=='string'||req.url.length>8192||!req.url.startsWith('/'))return {status:404};
 let u;try{u=new URL(req.url,`http://127.0.0.1:${port}`);}catch{return {status:400};}
 if(u.origin!==`http://127.0.0.1:${port}`||u.pathname!=='/oauth/callback')return {status:404};
 if(u.searchParams.getAll('state').length!==1||!equal(u.searchParams.get('state'),state))return {status:400};
 if(u.searchParams.has('error'))return {status:200,error:'Google sign-in was declined'};
 const code=u.searchParams.get('code');if(u.searchParams.getAll('code').length!==1||!code||code.length>4096)return {status:400,error:'Invalid authorization response'};
 return {status:200,code};
}
async function boundedJSON(response){const reader=response.body?.getReader();if(!reader)throw Error('Empty authentication response');let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>131072)throw Error('Authentication response too large');chunks.push(Buffer.from(value));}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}finally{await reader.cancel().catch(()=>{});}}
class Account{
 constructor(browser){this.browser=browser;this.file=path.join(path.dirname(browser.store.file),'google-account.enc');this.profile=null;this.tokens=null;this.pending=null;this.error='';this.disposed=false;this.load();}
 electron(){return require('electron');}
 secure(){const {safeStorage}=this.electron();if(!safeStorage.isEncryptionAvailable()||safeStorage.getSelectedStorageBackend?.()==='basic_text')throw Error('OS-encrypted credential storage is unavailable');return safeStorage;}
 load(){try{if(!fs.existsSync(this.file))return;const stat=fs.lstatSync(this.file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>262144)throw Error('Invalid encrypted account file');const d=JSON.parse(this.secure().decryptString(fs.readFileSync(this.file)));if(!d.tokens||typeof d.tokens.access_token!=='string'||!d.profile||typeof d.profile.id!=='string')throw Error('Invalid account record');this.tokens=d.tokens;this.profile={id:d.profile.id,name:String(d.profile.name||''),email:String(d.profile.email||''),emailVerified:d.profile.emailVerified===true};}catch{this.error='Saved account could not be decrypted. Reconnect your account.';}}
 save(tokens,profile){const tmp=this.file+'.tmp';try{fs.writeFileSync(tmp,this.secure().encryptString(JSON.stringify({tokens,profile})),{mode:0o600});fs.renameSync(tmp,this.file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
 status(){let configured=false;try{clientId(this.browser.store.data.settings.googleClientId||process.env.ASTER_GOOGLE_CLIENT_ID);configured=true;}catch{}return {configured,connected:!!this.tokens,expired:!!this.tokens&&(!Number.isFinite(this.tokens.expires_at)||this.tokens.expires_at<=Date.now()),canRefresh:!!this.tokens?.refresh_token,profile:this.profile?{...this.profile}:null,pending:!!this.pending,error:this.error,syncSupported:false};}
 configure(p){if(this.tokens||this.pending)throw Error('Disconnect or cancel sign-in before changing the OAuth client');const id=clientId(p.clientId);this.browser.store.data.settings.googleClientId=id;this.browser.store.save();return this.status();}
 async signIn(){
 if(this.disposed)throw Error('Account manager closed');if(this.pending)throw Error('A sign-in is already in progress');if(this.tokens)throw Error('Disconnect before reconnecting your account');this.secure();
 const id=clientId(this.browser.store.data.settings.googleClientId||process.env.ASTER_GOOGLE_CLIENT_ID),{verifier,challenge}=pkce(),state=crypto.randomBytes(32).toString('base64url'),nonce=crypto.randomBytes(32).toString('base64url');
 const controller=new AbortController();let timer,settled=false,resolveCode,rejectCode;const codePromise=new Promise((resolve,reject)=>{resolveCode=resolve;rejectCode=reject;});codePromise.catch(()=>{});
 const close=()=>{server.close();server.closeAllConnections();};
 const finish=(err,code)=>{if(settled)return;settled=true;close();err?rejectCode(err):resolveCode(code);};
 const attempt={cancel:()=>{controller.abort();finish(Error('Sign-in cancelled'));}};this.pending=attempt;this.error='';
 const server=http.createServer({maxHeaderSize:16384},(req,res)=>{const result=callbackResponse(req,server.address()?.port,state);res.writeHead(result.status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'",'Connection':'close'});res.end(result.status===200?'Return to Aster to finish sign-in.':'Invalid sign-in callback.');if(result.code||result.error){res.once('finish',()=>finish(result.error?Error(result.error):null,result.code));}});
 server.requestTimeout=10000;server.headersTimeout=10000;server.maxConnections=8;
 timer=setTimeout(()=>{controller.abort();finish(Error('Sign-in timed out'));},300000);
 const assertActive=()=>{if(controller.signal.aborted||this.disposed||this.pending!==attempt)throw Error('Sign-in cancelled or timed out');};
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});assertActive();
  const redirect=`http://127.0.0.1:${server.address().port}/oauth/callback`,url=new URL(AUTH);url.search=new URLSearchParams({client_id:id,redirect_uri:redirect,response_type:'code',scope:'openid email profile',code_challenge:challenge,code_challenge_method:'S256',state,nonce,access_type:'offline',prompt:'select_account'}).toString();
  this.browser.emit();await this.electron().shell.openExternal(url.href);assertActive();const code=await codePromise;assertActive();
  const response=await fetch(TOKEN,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:id,code,code_verifier:verifier,redirect_uri:redirect,grant_type:'authorization_code',...(process.env.ASTER_GOOGLE_CLIENT_SECRET?{client_secret:process.env.ASTER_GOOGLE_CLIENT_SECRET}:{})}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
  const tokens=await boundedJSON(response);assertActive();if(!response.ok||typeof tokens.id_token!=='string'||typeof tokens.access_token!=='string'||tokens.token_type?.toLowerCase()!=='bearer')throw Error('Google token exchange failed; check registered desktop client configuration');
  const {jwtVerify,createRemoteJWKSet}=await import('jose');const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:10000});
  const {payload}=await jwtVerify(tokens.id_token,keys,{issuer:['https://accounts.google.com','accounts.google.com'],audience:id,algorithms:['RS256'],maxTokenAge:'10m',requiredClaims:['exp','iat','sub','nonce']});assertActive();
  if(!equal(payload.nonce,nonce)||typeof payload.sub!=='string'||!payload.sub||(payload.azp&&payload.azp!==id))throw Error('Google identity validation failed');
  const profile={id:payload.sub,name:String(payload.name||'').slice(0,300),email:String(payload.email||'').slice(0,320),emailVerified:payload.email_verified===true};const saved={access_token:tokens.access_token,refresh_token:typeof tokens.refresh_token==='string'?tokens.refresh_token:undefined,expires_at:Date.now()+Math.min(86400,Math.max(0,Number(tokens.expires_in)||3600))*1000};
  this.save(saved,profile);this.tokens=saved;this.profile=profile;this.error='';
 }catch(e){this.error=controller.signal.aborted?'Sign-in cancelled or timed out':e.message;throw Error(this.error);}finally{clearTimeout(timer);controller.abort();finish(Error('Sign-in ended'));close();if(this.pending===attempt)this.pending=null;if(!this.disposed)this.browser.emit();}
 return this.status();
 }
 async refresh(){
 if(this.disposed||this.pending)throw Error('Account is unavailable or busy');this.secure();const previous=this.tokens;if(!previous?.refresh_token)throw Error('Reconnect your Google account to obtain refresh permission');const id=clientId(this.browser.store.data.settings.googleClientId||process.env.ASTER_GOOGLE_CLIENT_ID);const controller=new AbortController();const attempt={cancel:()=>controller.abort()};this.pending=attempt;this.browser.emit();
 try{const response=await fetch(TOKEN,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:id,refresh_token:previous.refresh_token,grant_type:'refresh_token',...(process.env.ASTER_GOOGLE_CLIENT_SECRET?{client_secret:process.env.ASTER_GOOGLE_CLIENT_SECRET}:{})}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});const tokens=await boundedJSON(response);if(controller.signal.aborted||this.disposed||this.tokens!==previous)throw Error('Account refresh cancelled');if(!response.ok||typeof tokens.access_token!=='string'||!tokens.access_token||tokens.token_type?.toLowerCase()!=='bearer'||!Number.isFinite(Number(tokens.expires_in))||Number(tokens.expires_in)<=0)throw Error('Google could not refresh this account. Reconnect if access was revoked.');const saved={access_token:tokens.access_token,refresh_token:typeof tokens.refresh_token==='string'&&tokens.refresh_token?tokens.refresh_token:previous.refresh_token,expires_at:Date.now()+Math.min(86400,Number(tokens.expires_in))*1000};this.save(saved,this.profile);this.tokens=saved;this.error='';
 }catch(e){this.error=controller.signal.aborted?'Account refresh cancelled':e.message;throw Error(this.error);}finally{controller.abort();if(this.pending===attempt)this.pending=null;if(!this.disposed)this.browser.emit();}return this.status();
 }
 async signOut(){
 this.pending?.cancel();const tokens=this.tokens;this.tokens=null;this.profile=null;let cleanupError='';try{if(fs.existsSync(this.file))fs.unlinkSync(this.file);}catch{cleanupError='Could not remove encrypted account file. Check profile permissions.';}this.error=cleanupError;this.browser.emit();
 let revoked=true;try{if(tokens){const r=await fetch(REVOKE,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:tokens.refresh_token||tokens.access_token}),signal:AbortSignal.timeout(15000)});revoked=r.ok;await r.body?.cancel();}}catch{revoked=false;}
 this.error=cleanupError|| (revoked?'':'Local account removed; online revocation failed. Revoke Aster in your Google account permissions.');if(!this.disposed)this.browser.emit();return this.status();
 }
 dispose(){this.disposed=true;this.pending?.cancel();}
}
module.exports={Account,pkce,clientId,equal,callbackResponse,boundedJSON};
