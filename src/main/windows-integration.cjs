'use strict';
const path=require('node:path');
const {execFile}=require('node:child_process');
const {normalize}=require('./security.cjs');
const PROG_ID='AsterHTML';
const SETTINGS_URI='ms-settings:defaultapps';
const CAPABILITIES='Software\\Clients\\StartMenuInternet\\AsterBrowser\\Capabilities';
const CHOICE_ROOT='HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations';
function runRegistry(file,args){return new Promise((resolve,reject)=>{execFile(file,args,{shell:false,windowsHide:true,encoding:'utf8',timeout:10000,maxBuffer:256*1024},(error,stdout)=>{if(error&&error.code!==1){reject(Error('Windows association status could not be read'));return;}resolve({code:error?1:0,stdout:stdout||''});});});}
function registryValue(text,name){if(typeof text!=='string'||text.length>256*1024)return null;const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp('^\\s*'+escaped+'\\s+REG_(?:SZ|EXPAND_SZ)\\s+(.+?)\\s*$','im');const match=text.match(pattern);return match?match[1]:null;}
// OS activation accepts only explicit web URLs. No searches, switches-as-URLs,
// credentials, file paths, custom protocols or implicit scheme normalization.
function launchURLs(argv){if(!Array.isArray(argv))return [];const out=[];for(const argument of argv.slice(0,128)){if(typeof argument!=='string'||argument.length>8192||!/^https?:\/\//i.test(argument)||/[\u0000-\u0020\u007f\\]/.test(argument))continue;try{const url=normalize(argument);if(!out.includes(url))out.push(url);}catch{}if(out.length===16)break;}return out;}
class WindowsIntegration{
 constructor(browser,options={}){this.browser=browser;this.runner=options.runner||runRegistry;this.platform=options.platform||process.platform;this.reg=options.regPath||path.join(process.env.SystemRoot||'C:\\Windows','System32','reg.exe');this.openExternal=options.openExternal||((url)=>require('electron').shell.openExternal(url));}
 async status(){if(this.platform!=='win32')return {supported:false,registered:false,isDefault:false,http:'unsupported',https:'unsupported',error:'Windows default-app integration is available on Windows only.'};
 const result={supported:true,registered:false,isDefault:false,http:'unknown',https:'unknown',error:'',progId:PROG_ID,requiresUserConfirmation:true};
 const read=async(key,name)=>{const r=await this.runner(this.reg,['query',key,'/v',name]);if(r.code!==0)return null;return registryValue(r.stdout,name);};
 try{const [http,https,registration]=await Promise.all([read(CHOICE_ROOT+'\\http\\UserChoice','ProgId'),read(CHOICE_ROOT+'\\https\\UserChoice','ProgId'),read('HKCU\\Software\\RegisteredApplications','AsterBrowser')]);result.http=http===null?'unknown':http.toLowerCase()===PROG_ID.toLowerCase()?'aster':'other';result.https=https===null?'unknown':https.toLowerCase()===PROG_ID.toLowerCase()?'aster':'other';result.registered=registration?.toLowerCase()===CAPABILITIES.toLowerCase();result.isDefault=result.http==='aster'&&result.https==='aster';if(result.http==='unknown'||result.https==='unknown')result.error='Windows did not expose an explicit HTTP/HTTPS UserChoice. Default status is not confirmed.';}catch{result.error='Windows association status could not be read. Check in Windows Settings.';}return result;
 }
 async openSettings(){if(this.platform!=='win32')throw Error('Default-app settings are supported on Windows only');await this.openExternal(SETTINGS_URI);return {opened:true,requiresUserConfirmation:true,message:'Select Aster in Windows Settings and assign HTTP and HTTPS, then refresh status in Aster.'};}
}
module.exports={WindowsIntegration,launchURLs,registryValue,PROG_ID,SETTINGS_URI,CAPABILITIES,CHOICE_ROOT};
