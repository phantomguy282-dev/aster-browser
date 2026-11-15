'use strict';
const {app,BrowserWindow,ipcMain,session,dialog,Menu,screen}=require('electron');const path=require('node:path');const fs=require('node:fs');const {Store}=require('./store.cjs');const {Tabs}=require('./tabs.cjs');const {Downloads}=require('./downloads.cjs');const {normalize,webURL,httpRetry}=require('./security.cjs');
if(process.env.ASTER_PROFILE)app.setPath('userData',path.resolve(process.env.ASTER_PROFILE));
const PROFILE_ROOT=app.getPath('userData');const {Profiles}=require('./profiles.cjs');let profileCatalog,currentProfileId='default';
const {Account}=require('./account.cjs');const {Migration}=require('./migration.cjs');const {Adblock}=require('./adblock.cjs');
const {Updates}=require('./updates.cjs');const {Extensions}=require('./extensions.cjs');const {Customization}=require('./customization.cjs');const {Vpn}=require('./vpn.cjs');
const {pathToFileURL}=require('node:url');const {authenticate,validateCommand}=require('./ipc-security.cjs');
const UI_URL=pathToFileURL(path.join(__dirname,'../ui/index.html')).href;
app.enableSandbox();
const {Workspaces}=require('./workspaces.cjs');const {TabGroups}=require('./tab-groups.cjs');const {StatePublisher}=require('./state-publisher.cjs');const {SiteZoom}=require('./site-zoom.cjs');const {SiteControl}=require('./site-control.cjs');const {Protection}=require('./protection.cjs');const {WindowsIntegration,launchURLs}=require('./windows-integration.cjs');
const {PasswordVault,generatePassword}=require('./password-vault.cjs');
const {ContextMenus}=require('./context-menus.cjs');
const {readerSource}=require('./reading-mode.cjs');
const allowedPermissions=new Set(['notifications','media','geolocation','clipboard-read','fullscreen']);
class Browser{
 constructor(){this.profiles=profileCatalog;this.profileId=currentProfileId;this.store=new Store(app.getPath('userData'));this.chromeHeight=126;this.overlay=false;this.cookies=[];this.quitting=false;this.downloads=new Downloads(this);this.tabs=new Tabs(this);this.workspaces=new Workspaces(this);this.tabGroups=new TabGroups(this);this.siteZoom=new SiteZoom(this);this.siteControl=new SiteControl(this);this.account=new Account(this);this.migration=new Migration(this);this.adblock=new Adblock(this);this.protection=new Protection(this);this.windows=new WindowsIntegration(this);this.defaultBrowser={isDefault:false,registered:false};this.studio=new Customization(this);this.vpn=new Vpn(this);this.extensions=new Extensions(this);this.updates=new Updates(this);this.passwords=new PasswordVault(this.store);this.contextMenus=new ContextMenus(this);this.tasks={processes:[],tabs:[],extensions:[]};this.statePublisher=new StatePublisher(()=>{if(!this.quitting&&this.win&&!this.win.isDestroyed())this.win.webContents.send('aster:state',this.state());});}
 async init(){
 const attempt=this.store.data.updateAttempt;if(attempt?.version)attempt.status=attempt.version===app.getVersion()?'completed':'not-completed-review-and-retry';
 this.webSession=session.fromPartition('persist:aster');this.configureSession(this.webSession,false);await this.extensions.init();
 const saved=this.store.data.windowState||{};const area=screen.getPrimaryDisplay().workArea;const width=Math.max(760,Math.min(Number(saved.width)||1400,area.width));const height=Math.max(520,Math.min(Number(saved.height)||920,area.height));
 this.win=new BrowserWindow({width,height,minWidth:760,minHeight:520,title:'Aster',backgroundColor:'#10131c',icon:path.join(__dirname,'../../assets/aster.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 if(saved.maximized===true)this.win.maximize();
 Menu.setApplicationMenu(null);this.win.webContents.setWindowOpenHandler(()=>({action:'deny'}));this.win.webContents.on('will-navigate',e=>e.preventDefault());this.win.webContents.on('before-input-event',(e,i)=>this.key(e,i));
 this.win.on('resize',()=>this.tabs.layout());this.win.on('close',()=>{this.quitting=true;this.statePublisher.dispose();const bounds=this.win.getNormalBounds();this.store.data.windowState={width:bounds.width,height:bounds.height,maximized:this.win.isMaximized()};this.siteControl.dispose();this.account.dispose();this.updates.dispose();this.tabs.persist();this.tabs.destroy();});
 ipcMain.handle('aster:command',async(e,action,p={})=>{authenticate(e,this.win.webContents,UI_URL);validateCommand(action,p);try{return await this.command(action,p);}catch(err){throw Error(err.message);}});
 await this.win.loadFile(path.join(__dirname,'../ui/index.html'));
 if(this.store.data.customization)await this.studio.applySaved();
 const restore=this.store.data.settings.startup==='newtab'?[]:this.store.data.settings.startup==='home'?[{url:this.store.data.settings.homeUrl}]:this.store.data.session.slice(0,30);if(restore.length)for(const t of restore){try{const id=await this.tabs.create(t.url,false,t.pinned,t.groupId);const restored=this.tabs.tabs.find(x=>x.id===id);if(restored)restored.pinned=t.pinned===true;}catch{}}if(!this.tabs.tabs.length)await this.tabs.create();await this.refreshCookies();const importMarker=path.join(path.dirname(app.getPath('exe')),'aster-import-once');if(app.isPackaged&&fs.existsSync(importMarker)){await this.tabs.create('aster://import');try{fs.unlinkSync(importMarker);}catch{}}if(!this.store.data.settings.setupCompleted&&!process.env.ASTER_PROFILE)await this.tabs.create('aster://setup');for(const url of launchURLs(process.argv))await this.tabs.create(url);this.ready=true;this.emit();
 }
 configureSession(ses,isPrivate){
 this.siteControl.attach(ses,isPrivate);
 ses.on('will-download',(_e,item)=>{if(!this.store.data.settings.downloadDirectory)item.setSaveDialogOptions({title:isPrivate?'Save private download â€” downloaded files remain on disk':'Save download'});});
 this.downloads.attach(ses,isPrivate);this.adblock.attach(ses);this.protection.attach(ses,isPrivate);
 }
 async refreshCookies(){this.cookies=(await this.webSession.cookies.get({})).map(({domain,name,path,secure})=>({domain,name,path,secure}));}
 securityChecks(){const tabs=this.tabs.tabs;const prefs=tabs.map(t=>t.view.webContents.getLastWebPreferences());return {checks:[{name:"Web content isolation",status:prefs.every(p=>p.sandbox&&p.contextIsolation&&!p.nodeIntegration&&p.webSecurity)?"verified":"attention",detail:`${tabs.length} live tab preferences inspected: sandbox, context isolation, no Node, web security.`},{name:"Privileged UI boundary",status:"configured",detail:"IPC binds exact local document URL, main frame, sender and allowlisted bounded commands."},{name:"Private session separation",status:this.tabs.privateSession?"active":"configured",detail:"Separate memory-only partition and permission decisions; no normal grants inherited."},{name:"Protection mode",status:this.protection.settings.level,detail:"Header restrictions and WebRTC policies are configurable. They do not guarantee anonymity."},{name:"Trusted updates",status:this.updates.status().configured?"configured":"attention",detail:"Publisher key and HTTPS feed required. No signing key or endpoint is fabricated."},{name:"Filter lists",status:this.adblock.status().ready?"loaded":"attention",detail:"Blocking uses actual loaded rules; an empty cache is not protection."}]};}
 state(){return {workspaces:this.workspaces.status(),tabGroups:this.tabGroups.list(),profiles:this.profiles.status(this.profileId),security:this.securityChecks(),protection:this.protection.status(),defaultBrowser:this.defaultBrowser,setupCompleted:!!this.store.data.settings.setupCompleted,siteControl:this.siteControl.snapshot(),recoveryWarning:this.store.recoveryWarning,updates:this.updates.status(),extensions:this.extensions.status(),studio:this.studio.status(),vpn:this.vpn.status(),tasks:this.tasks,account:this.account.status(),migration:this.migration.status(),adblock:this.adblock.status(),ready:!!this.ready,tabs:this.tabs.list().map(t=>({...t,httpRetryAvailable:!!httpRetry(t.url,t.error)})),activeId:this.tabs.activeId,bookmarks:this.store.data.bookmarks,history:this.store.data.history,settings:this.store.data.settings,downloads:this.downloads.list(),permissions:this.store.data.permissions,cookies:this.cookies,version:app.getVersion()};}
 emit(){if(!this.quitting&&this.win&&!this.win.isDestroyed()){this.tabs.layout();this.statePublisher.request();}}
 key(e,i){if(i.type!=='keyDown')return;const k=i.key.toLowerCase();const ctrl=i.control||i.meta;let action;
 if(ctrl&&i.shift&&k==='n'){e.preventDefault();this.tabs.create('aster://newtab',true);return;}if(ctrl&&['+','=','-','0'].includes(k)){e.preventDefault();this.command('zoom',{delta:k==='0'?0:k==='-'?-.5:.5});return;}if(k==='f11'){e.preventDefault();this.win.setFullScreen(!this.win.isFullScreen());return;}if(k==='f12'){e.preventDefault();this.command('openDevTools',{});return;}
 if(ctrl&&k==='t')action=i.shift?'restoreTab':'newTab';else if(ctrl&&k==='w')action='closeTab';else if(ctrl&&k==='tab')action='nextTab';else if(ctrl&&k==='l'){e.preventDefault();this.win.webContents.focus();this.win.webContents.send('aster:focus-address');return;}else if(ctrl&&k==='f'){e.preventDefault();this.win.webContents.focus();this.win.webContents.send('aster:find');return;}else if(ctrl&&k==='r'||k==='f5')action='reload';else if(ctrl&&k==='h')action='history';else if(ctrl&&k==='j')action='downloads';else if(i.alt&&k==='arrowleft')action='back';else if(i.alt&&k==='arrowright')action='forward';
 if(action){e.preventDefault();this.command(action,{}).catch(()=>{});}
 }
 async command(action,p){const t=this.tabs.active();const wc=t?.view.webContents;const data=this.store.data;
 switch(action){
 case 'workspaceSave':return this.workspaces.save(p);
 case 'workspaceRename':return this.workspaces.rename(p);
 case 'workspaceRemove':{const item=this.workspaces.get(p.id);const r=await dialog.showMessageBox(this.win,{type:'question',title:'Delete saved workspace?',message:'Delete '+item.name+'?',detail:'This removes only the saved snapshot. Open tabs are not closed.',buttons:['Cancel','Delete snapshot'],defaultId:0,cancelId:0});return r.response===1?this.workspaces.remove({id:item.id}):null;}
 case 'workspaceOpen':{const item=this.workspaces.get(p.id);const r=await dialog.showMessageBox(this.win,{type:'question',title:'Open saved workspace?',message:'Open '+item.tabs.length+' normal website tabs from '+item.name+'?',detail:'Existing tabs stay open. These pages use this profile’s normal cookies and record normal browsing history, even if a private tab is currently active.',buttons:['Cancel','Open normal tabs'],defaultId:0,cancelId:0});return r.response===1?this.workspaces.open({id:item.id,confirmed:true}):null;}
 case 'profileCreate':{const created=this.profiles.create(p.name);this.emit();return created;}
 case 'profileRename':this.profiles.rename(p);this.emit();return this.profiles.status(this.profileId);
 case 'profileArchive':this.profiles.archive({id:p.id,currentId:this.profileId});this.emit();return this.profiles.status(this.profileId);
 case 'profileRestore':this.profiles.restore(p.id);this.emit();return this.profiles.status(this.profileId);
 case 'profileSelect':{const target=this.profiles.record(p.id);this.profiles.resolve(target.id);if(target.id===this.profiles.data.activeId)return this.profiles.status(this.profileId);const r=await dialog.showMessageBox(this.win,{type:'question',title:'Switch browser profile?',message:'Use '+target.name+' on the next launch?',detail:'This profile remains open until you restart Aster. Cookies, history, settings, extensions and credentials stay in their separate profile directories. Private tabs are not restored.',buttons:['Cancel','Select for next launch'],defaultId:0,cancelId:0});if(r.response!==1)return null;this.tabs.persist();this.profiles.select(target.id);this.emit();return this.profiles.status(this.profileId);}
 case 'profileRestart':{if(this.profiles.data.activeId===this.profileId)return;const r=await dialog.showMessageBox(this.win,{type:'question',title:'Restart Aster?',message:'Close current tabs and restart in the selected profile?',buttons:['Cancel','Restart'],defaultId:0,cancelId:0});if(r.response!==1)return;this.tabs.persist();app.relaunch({args:app.isPackaged?[]:[app.getAppPath()]});app.quit();return;}
 case 'groupCollapse':return this.tabGroups.collapse(p);
 case 'groupCreate':return this.tabGroups.create(p);
 case 'groupAssign':return this.tabGroups.assign(p);
 case 'groupUpdate':return this.tabGroups.update(p);
 case 'groupRemove':return this.tabGroups.remove(p);
 case 'reorderTab':this.tabs.move(p.id,p.before);return;
 case 'fullscreen':this.win.setFullScreen(!this.win.isFullScreen());return;
 case 'pinTab':this.tabs.pin(p.id||t?.id);return;
 case 'moveTab':this.tabs.move(p.id,p.beforeId);return;
 case 'readingExtract':{if(!t||!webURL(t.url))throw Error('Reading mode needs a web page');const article=await wc.executeJavaScript(readerSource()+"()",true).catch(()=>null);if(!article)throw Error('No readable article found on this page. Reading mode works only on article-like pages.');return article;}
 case 'qrGenerate':{const url=normalize(String(p.url||''));if(!webURL(url))throw Error('QR codes require an HTTP(S) address');const dataUrl=await require('qrcode').toDataURL(url,{width:512,margin:2});return {dataUrl,url};}
 case 'qrSave':{const url=normalize(String(p.url||''));if(!webURL(url))throw Error('QR codes require an HTTP(S) address');const r=await dialog.showSaveDialog(this.win,{defaultPath:'aster-qr.png',filters:[{name:'PNG image',extensions:['png']}]});if(r.canceled||!r.filePath)return null;await require('qrcode').toFile(r.filePath,url,{width:512,margin:2});return {saved:r.filePath};}
 case 'captureCopy':{if(!t||!webURL(t.url))throw Error('Open a web page to capture');const image=await wc.capturePage();require('electron').clipboard.writeImage(image);return {copied:true};}
 case 'capturePage':{if(!t||!webURL(t.url))throw Error('Open a web page to capture');const image=await wc.capturePage();const r=await dialog.showSaveDialog(this.win,{defaultPath:'aster-screenshot.png',filters:[{name:'PNG image',extensions:['png']}]});if(!r.canceled&&r.filePath)await fs.promises.writeFile(r.filePath,image.toPNG());return {saved:!r.canceled};}

 case 'protectionSave':return this.protection.save(p);
 case 'defaultStatus':this.defaultBrowser=await this.windows.status();this.emit();return this.defaultBrowser;
 case 'defaultOpen':return this.windows.openSettings();
 case 'setupFinish':this.store.data.settings.setupCompleted=true;this.store.save();await this.tabs.navigate('aster://newtab');return this.state();
 case 'siteInfo':return this.siteControl.info(p.tabId);
 case 'siteSave':return this.siteControl.save(p);
 case 'siteReset':return this.siteControl.reset(p);
 case 'siteRespond':return this.siteControl.respond(p);
 case 'siteClear':return this.siteControl.clearSite(p);
 case 'updatesConfigure':return this.updates.configure(p);
 case 'updatesCheck':return this.updates.check();
 case 'updatesDownload':return this.updates.download();
 case 'updatesInstall':return this.updates.install();
 case 'extensionChoose':return this.extensions.choose();
 case 'extensionInstall':return this.extensions.install(p);
 case 'extensionEnable':return this.extensions.enable(p);
 case 'extensionRemove':return this.extensions.remove(p);
 case 'studioSave':return this.studio.save(p);
 case 'studioPreview':return this.studio.preview(p);
 case 'studioReset':return this.studio.reset();
 case 'studioImportTheme':return this.studio.importTheme();
 case 'studioInstallTheme':return this.studio.installTheme(p);
 case 'studioRemoveTheme':return this.studio.removeTheme(p.name);
 case 'studioExportTheme':return this.studio.exportTheme();
 case 'studioImportCSS':return this.studio.importCSS();
 case 'studioExportCSS':return this.studio.exportCSS();
 case 'studioWallpaper':return this.studio.chooseWallpaper();
 case 'configExport':return this.studio.exportConfig();
 case 'configImport':return this.studio.importConfig();
 case 'vpnRefresh':return this.vpn.refresh();
 case 'vpnConnect':return this.vpn.connect(p);
 case 'vpnDisconnect':return this.vpn.disconnect(p);
 case 'tasksRefresh':{this.tasks={processes:app.getAppMetrics().map(m=>({pid:m.pid,type:m.type,name:m.name||m.serviceName||m.type,cpu:m.cpu.percentCPUUsage,memory:m.memory.workingSetSize})),tabs:this.tabs.tabs.map(t=>({id:t.id,title:t.title,pid:t.view.webContents.getOSProcessId(),private:t.private})),extensions:this.extensions.status().items};this.emit();return this.tasks;}
 case 'accountConfigure':return this.account.configure(p);
 case 'accountRefresh':return this.account.refresh();
 case 'accountSignIn':return this.account.signIn();
 case 'accountSignOut':return this.account.signOut();
 case 'passwordStatus':return this.passwords.status();
 case 'passwordList':return this.passwords.list();
 case 'passwordSearch':return this.passwords.search(String(p.query||''));
 case 'passwordAdd':return this.passwords.add({origin:String(p.origin||''),username:String(p.username||''),password:String(p.password||''),notes:String(p.notes||''),title:String(p.title||'')});
 case 'passwordUpdate':return this.passwords.update(String(p.id||''),{origin:p.origin===undefined?undefined:String(p.origin),username:p.username===undefined?undefined:String(p.username),title:p.title===undefined?undefined:String(p.title),notes:p.notes===undefined?undefined:String(p.notes),password:p.password===undefined?undefined:String(p.password)});
 case 'passwordRemove':return this.passwords.remove(String(p.id||''));
 case 'passwordReveal':return this.passwords.reveal(String(p.id||''));
 case 'passwordForOrigin':return this.passwords.forOrigin(String(p.url||''));
 case 'passwordGenerate':return {password:generatePassword(Number(p.length)||20,{symbols:p.symbols!==false})};
 case 'passwordExport':{const r=await dialog.showSaveDialog(this.win,{defaultPath:'aster-passwords.csv',filters:[{name:'CSV',extensions:['csv']}]});if(r.canceled)return null;const csv=this.passwords.exportCSV({confirmed:p.confirmed===true});fs.writeFileSync(r.filePath,csv,{mode:0o600});return {saved:r.filePath};}
 case 'passwordImport':{if(p.confirmed!==true)throw Error('Import requires explicit confirmation');const r=await dialog.showOpenDialog(this.win,{properties:['openFile'],filters:[{name:'CSV',extensions:['csv']}]});if(r.canceled)return null;const text=fs.readFileSync(r.filePaths[0],'utf8');return this.passwords.importCSV(text,{confirmed:true});}
 case 'migrationDetect':return this.migration.detect();
 case 'migrationChoose':{const r=await dialog.showOpenDialog(this.win,{properties:['openDirectory'],title:'Select a browser profile (metadata only)'});return r.canceled?null:this.migration.registerDirectory(r.filePaths[0],p.kind==='firefox'?'firefox':'chromium');}
 case 'migrationImport':return this.migration.import(p);
 case 'migrationHTML':{if(p.consent!==true)throw Error('Explicit consent is required');const r=await dialog.showOpenDialog(this.win,{properties:['openFile'],filters:[{name:'Bookmark export',extensions:['html','htm']}]});return r.canceled?null:this.migration.importHTML({filePath:r.filePaths[0],consent:true});}
 case 'adblockSave':return this.adblock.save(p);
 case 'adblockUpdate':return this.adblock.update();
 case 'state':await this.refreshCookies();return this.state();
 case 'chromeSize':this.chromeHeight=Math.max(96,Math.min(240,Number(p.height)||126));this.tabs.layout();return;
 case 'overlay':this.overlay=p.open===true;this.tabs.layout();return;
 case 'navigate':if(p.input==='aster://settings')await this.refreshCookies();return this.tabs.navigate(p.input);
 case 'retryHttp':{const retry=httpRetry(t?.url,t?.error);if(!retry)throw Error('HTTP retry is not available for this failure');const result=await dialog.showMessageBox(this.win,{type:'warning',title:'Retry without encryption?',message:'HTTP does not protect your connection. Do not send passwords or sensitive information.',detail:retry,buttons:['Cancel','Retry using HTTP'],defaultId:0,cancelId:0});if(result.response===1)return this.tabs.navigate(retry);return;}
 case 'newTab':return this.tabs.create(p.url||'aster://newtab',p.private===true);
 case 'closeTab':return this.tabs.close(p.id||t?.id);
 case 'activateTab':this.tabs.activate(p.id);return;
 case 'duplicateTab':{const orig=this.tabs.tabs.find(x=>x.id===(p.id||t?.id));if(orig)return this.tabs.create(orig.url,orig.private,orig.pinned,orig.groupId);return;}
 case 'restoreTab':{const closed=this.tabs.closed.shift();return this.tabs.create(closed?.url||'aster://newtab',false,closed?.pinned,closed?.groupId);}
 case 'nextTab':{const a=this.tabs.tabs;this.tabs.activate(a[(a.findIndex(x=>x.id===t?.id)+1)%a.length]?.id);return;}
 case 'home':return this.tabs.navigate(data.settings.homeUrl);
 case 'history':case 'downloads':return this.tabs.create('aster://'+action);
 case 'back':if(wc.navigationHistory.canGoBack())wc.navigationHistory.goBack();return;
 case 'forward':if(wc.navigationHistory.canGoForward())wc.navigationHistory.goForward();return;
 case 'reload':if(t&&!t.url.startsWith('aster://'))wc.reload();return;
 case 'bookmarkSave':{const url=normalize(p.url);if(!webURL(url))throw Error('Bookmarks require an HTTP(S) address');this.store.bookmark({id:p.id,url,title:String(p.title||url).slice(0,300),folder:String(p.folder||'').slice(0,100)});break;}
 case 'bookmarkDelete':data.bookmarks=data.bookmarks.filter(x=>x.id!==p.id);break;
 case 'historyDelete':data.history=data.history.filter(x=>x.id!==p.id);break;
 case 'historyClear':data.history=[];break;
 case 'settingsSave':{const s=data.settings;if(p.verticalTabs!==undefined){if(typeof p.verticalTabs!=='boolean')throw Error('Vertical tabs must be a boolean');s.verticalTabs=p.verticalTabs;}if(['restore','newtab','home'].includes(p.startup))s.startup=p.startup;if(['en','pt-BR','es','fr','de','ja','zh','it'].includes(p.language))s.language=p.language;if(['dark','light','system'].includes(p.theme))s.theme=p.theme;if(['google','bing','duckduckgo'].includes(p.searchEngine))s.searchEngine=p.searchEngine;if(typeof p.homeUrl==='string')s.homeUrl=normalize(p.homeUrl);if(['aurora','midnight','dawn','plain'].includes(p.background))s.background=p.background;if(typeof p.showBookmarksBar==='boolean')s.showBookmarksBar=p.showBookmarksBar;if(Array.isArray(p.shortcuts))s.shortcuts=p.shortcuts.slice(0,24).map(x=>({title:String(x.title).slice(0,60),url:normalize(x.url)}));break;}
 case 'chooseDownloadDirectory':{const r=await dialog.showOpenDialog(this.win,{properties:['openDirectory','createDirectory']});if(!r.canceled)data.settings.downloadDirectory=r.filePaths[0];break;}
 case 'downloadAction':return this.downloads.action(p.id,p.action);
 case 'clearData':if(p.cookies)await this.webSession.clearStorageData({storages:['cookies','localstorage','indexdb','serviceworkers','cachestorage']});if(p.cache)await this.webSession.clearCache();if(p.history)data.history=[];await this.refreshCookies();break;
 case 'cookieDelete':{const domain=String(p.domain||'').replace(/^\./,'');if(!domain||/[\s/@]/.test(domain))throw Error('Invalid cookie domain');await this.webSession.cookies.remove(`${p.secure?'https':'http'}://${domain}${p.path||'/'}`,String(p.name));await this.refreshCookies();break;}
 case 'permissionSave':{const permissions=p.permission==='media'?['camera','microphone']:[p.permission];for(const permission of permissions)this.siteControl.save({origin:p.origin,permission,decision:p.allow===true?'allow':'block'});break;}
 case 'permissionDelete':{const row=data.permissions.find(x=>x.key===p.key);if(row)this.siteControl.reset({origin:row.origin,permission:row.permission});break;}
 case 'zoom':{if(p.tabId&&p.tabId!==t?.id)throw Error('The selected tab changed');if(p.url&&p.url!==t?.url)throw Error('The website changed');return this.siteZoom.change(t,p.delta);}
 case 'find':if(wc&&p.text)wc.findInPage(String(p.text),{forward:p.forward!==false,findNext:true});return;
 case 'stopFind':wc?.stopFindInPage('clearSelection');return;
 case 'openDevTools':wc?.openDevTools({mode:'detach'});return;
 default:throw Error('Unknown browser command');
 }
 this.store.save();this.emit();return this.state();
 }
}
if(!app.requestSingleInstanceLock()){app.quit();}else{try{profileCatalog=new Profiles(PROFILE_ROOT);currentProfileId=profileCatalog.data.activeId;const selected=profileCatalog.resolve(currentProfileId);app.setPath('userData',selected);app.setPath('sessionData',selected);}catch(e){dialog.showErrorBox('Profile needs attention',e.message);app.exit(1);throw e;}app.on('second-instance',(_event,argv)=>{for(const url of launchURLs(argv))global.asterBrowser?.tabs.create(url).catch(()=>{});const w=BrowserWindow.getAllWindows()[0];if(w){if(w.isMinimized())w.restore();w.focus();}});app.whenReady().then(async()=>{const browser=new Browser();global.asterBrowser=browser;await browser.init();}).catch(e=>{console.error(e);dialog.showErrorBox('Aster could not start',e.message);app.quit();});app.on('window-all-closed',()=>app.quit());}

