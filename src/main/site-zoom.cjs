'use strict';
// Zoom is a browser preference, never a site permission. Private values stay in memory.
function siteKey(url){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return null;return u.hostname;}catch{return null;}}
function level(value){if(typeof value!=='number'||!Number.isFinite(value)||value< -5||value>5)throw Error('Zoom level must be between -5 and 5');return Math.round(value*100)/100;}
class SiteZoom{
 constructor(browser){this.browser=browser;this.normal=new Map();this.private=new Map();const rows=browser.store.data.siteZoom;if(Array.isArray(rows))for(const row of rows.slice(0,500)){try{if(typeof row.host!=='string'||siteKey('https://'+row.host)!==row.host)continue;this.normal.set(row.host,level(row.level));}catch{}}}
 context(tab){const wc=tab?.view?.webContents;if(!wc||wc.isDestroyed())return null;const host=siteKey(wc.getURL());if(!host||host!==siteKey(tab.url))return null;return {host,wc,map:tab.private?this.private:this.normal};}
 info(tab){const c=this.context(tab);if(!c)return null;return {host:c.host,level:c.map.get(c.host)||0,percent:Math.round(100*Math.pow(1.2,c.map.get(c.host)||0)),private:!!tab.private,scope:'hostname'};}
 apply(tab){const c=this.context(tab);if(c)c.wc.setZoomLevel(c.map.get(c.host)||0);}
 change(tab,delta){const c=this.context(tab);if(!c)throw Error('Open a loaded HTTP or HTTPS website to change zoom');if(typeof delta!=='number'||!Number.isFinite(delta)||Math.abs(delta)>5)throw Error('Invalid zoom adjustment');const next=delta===0?0:level(Math.max(-5,Math.min(5,(c.map.get(c.host)||0)+delta)));if(!c.map.has(c.host)&&next!==0&&c.map.size>=500)throw Error('Saved zoom limit reached; reset an existing website first');const previous=c.map.get(c.host);if(next===0)c.map.delete(c.host);else c.map.set(c.host,next);if(!tab.private){const old=this.browser.store.data.siteZoom;this.browser.store.data.siteZoom=[...this.normal].map(([host,level])=>({host,level}));try{this.browser.store.save();}catch(e){if(previous===undefined)c.map.delete(c.host);else c.map.set(c.host,previous);this.browser.store.data.siteZoom=old;throw e;}}
 for(const other of this.browser.tabs.tabs)if(other.private===tab.private&&siteKey(other.url)===c.host)this.apply(other);this.browser.emit();return this.info(tab);}
 clearPrivate(){this.private.clear();}
}
module.exports={SiteZoom,siteKey,level};
