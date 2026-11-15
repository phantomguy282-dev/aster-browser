(function(root){'use strict';
const source=typeof module==='object'&&module.exports?require('./locales/catalogs.js'):root.AsterLocaleCatalogs;
if(!source)throw Error('Load locales/catalogs.js before i18n.js');
const {catalogs,languages}=source;let language='en';const originalText=new WeakMap(),originalAttrs=new WeakMap();
const excluded='script,style,textarea,code,pre,time,.tab-title,.row-title,.row-meta,.site-letter,.shortcut,.bookmark-chip,.date-label,.x-avatar,.x-profile h3,.x-profile p,.x-vpn-row strong,.x-vpn-row p,.x-library-item h3,.x-library-item strong,.x-library-item p,.x-notes,.x-alert,.x-table-wrap tbody,.x-theme strong,#bookmark-results .card h2,select[name=profileId] option,#home-time,#home-date,[data-i18n-ignore]';
const reverse=new Map();for(const locale of languages)for(const [key,value] of Object.entries(catalogs[locale]))if(!reverse.has(value))reverse.set(value,key);
function original(value){const trimmed=value.trim();if(Object.hasOwn(catalogs.en,trimmed))return value;return reverse.has(trimmed)?value.replace(trimmed,reverse.get(trimmed)):value;}
function setLanguage(value){language=languages.includes(value)?value:'en';return language;}
function t(key,params={}){const value=Object.hasOwn(catalogs[language],key)?catalogs[language][key]:String(key);return value.replace(/\{([a-zA-Z][\w]*)\}/g,(all,k)=>Object.hasOwn(params,k)?String(params[k]):all);}
function translateSource(text){if(Object.hasOwn(catalogs.en,text))return t(text);const shortcut=text.match(/^(.*?) (\((?:Ctrl|Alt|Shift|F\d)[^)]*\))$/);return shortcut&&Object.hasOwn(catalogs.en,shortcut[1])?t(shortcut[1])+' '+shortcut[2]:text;}
function apply(value=language,scope=root.document){setLanguage(value);if(!scope)return;const doc=scope.ownerDocument||scope;if(doc.documentElement)doc.documentElement.lang=language;
 const elements=[];if(scope.nodeType===1)elements.push(scope);if(scope.querySelectorAll)elements.push(...scope.querySelectorAll('*'));
 for(const element of elements){if(element.closest(excluded))continue;
  if(element.hasAttribute('data-i18n'))element.textContent=t(element.getAttribute('data-i18n'));
  let attrs=originalAttrs.get(element);if(!attrs){attrs={};originalAttrs.set(element,attrs);}
  for(const attr of ['title','aria-label','placeholder']){if(!element.hasAttribute(attr))continue;const current=element.getAttribute(attr);const cached=attrs[attr];if(!cached||current!==cached.rendered)attrs[attr]={source:original(current),rendered:current};const record=attrs[attr],translated=translateSource(record.source);if(translated!==current)element.setAttribute(attr,translated);record.rendered=translated;}
  for(const node of element.childNodes){if(node.nodeType!==3||!node.nodeValue.trim())continue;const current=node.nodeValue,cached=originalText.get(node);if(!cached||current!==cached.rendered)originalText.set(node,{source:original(current),rendered:current});const record=originalText.get(node),leading=record.source.match(/^\s*/)[0],trailing=record.source.match(/\s*$/)[0],text=record.source.trim();const translated=leading+translateSource(text)+trailing;if(translated!==current)node.nodeValue=translated;record.rendered=translated;}
 }
 return language;
}
const api={t,apply,setLanguage,get language(){return language;},languages:[...languages],catalogs};if(typeof module==='object'&&module.exports)module.exports=api;else root.AsterI18n=api;
})(typeof globalThis==='object'?globalThis:this);


