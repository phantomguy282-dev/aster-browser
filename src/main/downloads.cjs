'use strict';
const {shell}=require('electron');const {safeFilename}=require('./download-safety.cjs');const path=require('node:path');const fs=require('node:fs');const {randomUUID}=require('node:crypto');
class Downloads{
 constructor(app){this.app=app;this.items=new Map();}
 attach(session,isPrivate){session.on('will-download',(_event,item,wc)=>{
 const tab=this.app.tabs?.tabs.find(t=>t.view.webContents===wc);let site;try{site=new URL(wc?.getURL()||item.getURL()).origin;}catch{}if(this.app.siteControl?.decision(site,'downloads',isPrivate)==='block'){_event.preventDefault();return;}
  const name=safeFilename(item.getFilename());const dir=this.app.store.data.settings.downloadDirectory;
  if(dir){const ext=path.extname(name),stem=path.basename(name,ext);let dest=path.join(dir,name),n=1;while(fs.existsSync(dest)||[...this.items.values()].some(d=>d.record.path===dest)){if(n>1000){_event.preventDefault();return;}dest=path.join(dir,`${stem} (${n++})${ext}`);}item.setSavePath(dest);}
  const id=randomUUID();const record={id,name,path:item.getSavePath(),received:0,total:item.getTotalBytes(),speed:0,state:'progressing',paused:false,private:isPrivate};
  this.items.set(id,{item,record,last:Date.now(),bytes:0});
  item.on('updated',()=>{const d=this.items.get(id);if(!d)return;const now=Date.now();const bytes=item.getReceivedBytes();record.speed=Math.max(0,(bytes-d.bytes)*1000/Math.max(1,now-d.last));d.last=now;d.bytes=bytes;Object.assign(record,{path:item.getSavePath(),received:bytes,total:item.getTotalBytes(),state:item.getState(),paused:item.isPaused()});this.app.emit();});
  item.once('done',(_e,state)=>{Object.assign(record,{path:item.getSavePath(),received:item.getReceivedBytes(),state,speed:0,paused:false});this.app.emit();});this.app.emit();
 });}
 async action(id,action){const d=this.items.get(id);if(!d)throw Error('Download not found');const {item,record}=d;
 if(action==='show'){if(record.path)shell.showItemInFolder(record.path);return;}
 if(record.state!=='progressing'&&record.state!=='interrupted')throw Error('Download is no longer active');
 if(action==='pause'){item.pause();record.paused=true;}else if(action==='resume'){if(!item.canResume())throw Error('This server does not support resuming this download');item.resume();record.paused=false;}else if(action==='cancel')item.cancel();else throw Error('Unknown download action');this.app.emit();
 }
 list(){return [...this.items.values()].map(x=>x.record);}
 clearPrivate(){for(const [id,d]of this.items)if(d.record.private){if(d.record.state==='progressing')d.item.cancel();this.items.delete(id);}}
}
module.exports={Downloads};
