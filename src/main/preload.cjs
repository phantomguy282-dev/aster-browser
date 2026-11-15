'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('aster',{
 invoke:(action,payload={})=>ipcRenderer.invoke('aster:command',action,payload),
 onState:fn=>{const h=(_,s)=>fn(s);ipcRenderer.on('aster:state',h);return()=>ipcRenderer.removeListener('aster:state',h);},
 onFocusAddress:fn=>ipcRenderer.on('aster:focus-address',()=>fn()),
 onFind:fn=>ipcRenderer.on('aster:find',()=>fn()),
 onBookmarkEditor:fn=>ipcRenderer.on('aster:open-bookmark-editor',(_,p)=>fn(p))
});
