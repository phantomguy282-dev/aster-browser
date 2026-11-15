'use strict';
const {WebContentsView,session}=require('electron');const {randomUUID}=require('node:crypto');const {normalize,webURL}=require('./security.cjs');
class Tabs{
 constructor(app){this.app=app;this.tabs=[];this.closed=[];this.activeId=null;this.privateSession=null;}
 active(){return this.tabs.find(t=>t.id===this.activeId);}
 async create(url='aster://newtab',isPrivate=false,pinned=false,groupId=null){
  url=normalize(url,this.app.store.data.settings.searchEngine);
  if(isPrivate&&!this.privateSession){this.privateSession=session.fromPartition('private-'+randomUUID());this.app.configureSession(this.privateSession,true);}
  const ses=isPrivate?this.privateSession:this.app.webSession;
  const view=new WebContentsView({webPreferences:{session:ses,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,plugins:false}});
  const t={id:randomUUID(),groupId:this.app.tabGroups?.resolve(groupId,isPrivate)?.id||null,url,title:'New tab',favicon:'',loading:false,private:isPrivate,pinned:pinned===true,view,canGoBack:false,canGoForward:false,error:''};this.tabs.push(t);this.app.protection?.applyToTab(t);
  const wc=view.webContents;wc.on('did-finish-load',()=>{if(!wc.isDestroyed()){this.app.siteControl?.apply(t);this.app.siteZoom?.apply(t);}});wc.on('did-start-navigation',(_e,_url,_inPlace,main)=>{if(main)this.app.siteControl?.onNavigation(t);});wc.setWindowOpenHandler(({url})=>{if(webURL(url)&&(!this.app.siteControl||this.app.siteControl.decision(new URL(wc.getURL()).origin,'popups',isPrivate)==='allow')&&!this.app.adblock?.popup(url,wc.getURL()))this.create(url,isPrivate).catch(()=>{});return {action:'deny'};});
  wc.on('will-navigate',(e,url)=>{if(!webURL(url))e.preventDefault();});wc.on('will-redirect',(e,url)=>{if(!webURL(url))e.preventDefault();});wc.on('will-attach-webview',e=>e.preventDefault());
  wc.on('page-title-updated',(_e,title)=>{if(!t.url.startsWith('aster://')){t.title=title;this.app.emit();}});
  wc.on('page-favicon-updated',(_e,icons)=>{if(!t.url.startsWith('aster://')){t.favicon=icons.find(webURL)||'';this.app.emit();}});
  wc.on('did-start-loading',()=>{if(!t.url.startsWith('aster://')){t.loading=true;t.error='';this.app.emit();}});wc.on('did-stop-loading',()=>{t.loading=false;this.update(t);});
  const visited=()=>{const url=wc.getURL();if(!webURL(url))return;t.url=url;t.title=wc.getTitle()||url;this.app.siteZoom?.apply(t);if(t.id===this.activeId)this.layout();this.update(t);if(!isPrivate){this.persist(false);this.app.store.visit(url,t.title);}this.app.emit();};
  wc.on('did-navigate',visited);wc.on('did-navigate-in-page',(_e,_url,main)=>{if(main)visited();});
  wc.on('did-fail-load',(_e,code,desc,url,main)=>{if(main&&code!==-3&&url===t.url){t.loading=false;t.error=`Could not load ${url}: ${desc}`;this.app.emit();}});
  wc.on('render-process-gone',(_e,d)=>{t.error=`Page process stopped (${d.reason}). Reload to recover.`;this.app.emit();});
  wc.on('before-input-event',(e,input)=>this.app.key(e,input));this.app.contextMenus?.attach(t);
  this.activate(t.id);await this.navigate(url);return t.id;
 }
 update(t){if(t.view.webContents.isDestroyed())return;const h=t.view.webContents.navigationHistory;t.canGoBack=h.canGoBack();t.canGoForward=h.canGoForward();this.app.emit();}
 activate(id){const t=this.tabs.find(t=>t.id===id);if(!t)return;const prev=this.active();if(prev){this.app.siteControl?.onNavigation(prev);try{this.app.win.contentView.removeChildView(prev.view);}catch{}}this.activeId=id;this.layout();this.app.emit();}
 layout(){const t=this.active();if(!t||!this.app.win)return;try{this.app.win.contentView.removeChildView(t.view);}catch{}if(t.url.startsWith('aster://')||this.app.overlay||this.app.siteControl?.requests.size)return;this.app.win.contentView.addChildView(t.view);const [w,h]=this.app.win.getContentSize();const left=this.app.store.data.settings.verticalTabs===true?(w<900?180:220):0;t.view.setBounds({x:left,y:this.app.chromeHeight,width:Math.max(0,w-left),height:Math.max(0,h-this.app.chromeHeight)});}
 async navigate(input){const t=this.active();if(!t)return;const url=normalize(input,this.app.store.data.settings.searchEngine);const navigationToken=(t.navigationToken||0)+1;t.navigationToken=navigationToken;let sameOrigin=false;try{sameOrigin=new URL(t.url).origin===new URL(url).origin;}catch{}t.url=url;t.error='';if(!sameOrigin)t.favicon='';if(url.startsWith('aster://')){t.title=url==='aster://newtab'?'New tab':url.slice(8).replace(/^./,s=>s.toUpperCase());t.loading=false;t.view.webContents.stop();this.layout();this.persist();this.app.emit();if(t.view.webContents.getURL()&&t.view.webContents.getURL()!=='about:blank'){try{await t.view.webContents.loadURL('about:blank');}catch{}}return;}this.layout();this.persist();this.app.emit();try{await t.view.webContents.loadURL(url);}catch(e){if(e.code!=='ERR_ABORTED'&&t.navigationToken===navigationToken&&this.tabs.includes(t)){t.error=e.message;this.app.emit();}}}
 async close(id){const i=this.tabs.findIndex(t=>t.id===id);if(i<0)return;const t=this.tabs[i];this.app.siteControl?.onClose(t);if(!t.private)this.closed.unshift({url:t.url,pinned:!!t.pinned,groupId:t.groupId||null});this.closed=this.closed.slice(0,30);try{this.app.win.contentView.removeChildView(t.view);}catch{}t.view.webContents.close({waitForBeforeUnload:false});this.tabs.splice(i,1);if(!this.tabs.some(t=>t.private)&&this.privateSession){const old=this.privateSession;this.privateSession=null;this.app.downloads.clearPrivate();this.app.siteZoom?.clearPrivate();this.app.tabGroups?.clearPrivate();await old.clearStorageData();await old.clearCache();await old.closeAllConnections();}if(this.activeId===id){this.activeId=null;if(this.tabs.length)this.activate(this.tabs[Math.min(i,this.tabs.length-1)].id);else await this.create();}this.persist();this.app.emit();}
 persist(save=true){this.app.store.data.session=this.tabs.filter(t=>!t.private).map(t=>({url:t.url,pinned:!!t.pinned,groupId:t.groupId||null}));if(save)this.app.store.save();}
 list(){return this.tabs.map(({view,...rest})=>rest);}
 pin(id){const t=this.tabs.find(x=>x.id===id);if(!t)throw Error('Tab not found');t.pinned=!t.pinned;this.tabs.sort((a,b)=>Number(b.pinned)-Number(a.pinned));this.persist();this.app.emit();}
 move(id,beforeId){const from=this.tabs.findIndex(t=>t.id===id),to=this.tabs.findIndex(t=>t.id===beforeId);if(from<0||to<0||from===to)return;const t=this.tabs[from];if(t.pinned!==this.tabs[to].pinned)throw Error('Move tabs within the same pinned group');this.tabs.splice(from,1);this.tabs.splice(this.tabs.findIndex(x=>x.id===beforeId),0,t);this.persist();this.app.emit();}
 destroy(){for(const t of this.tabs)if(!t.view.webContents.isDestroyed())t.view.webContents.close({waitForBeforeUnload:false});}
}
module.exports={Tabs};
