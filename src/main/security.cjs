'use strict';
const {isIP}=require('node:net');
const SEARCH={google:'https://www.google.com/search?q=',bing:'https://www.bing.com/search?q=',duckduckgo:'https://duckduckgo.com/?q='};
const INTERNAL=new Set(['newtab','history','downloads','bookmarks','settings','account','import','protection','studio','extensions','tasks','privacy','updates','vpn','security','site-settings','setup','default-browser','privacy-controls','profiles','workspaces']);
function validWeb(input){
 let u;try{u=new URL(input);}catch{throw Error('Malformed web address. Check the domain, port and brackets.');}
 if(!['http:','https:'].includes(u.protocol))throw Error('Only HTTP and HTTPS web addresses are allowed');
 if(u.username||u.password)throw Error('Addresses containing credentials are not allowed');
 if(!u.hostname)throw Error('A web address needs a hostname');
 const host=u.hostname.replace(/\.$/,'');
 if(!host.startsWith('[')&&!isIP(host)&&(!host.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))||host.length>253))throw Error('Invalid domain name');
 return u.href;
}
function normalize(input,engine='google'){
 if(typeof input!=='string'||input.length>8192)throw Error('Invalid address');const s=input.trim();if(!s)return 'aster://newtab';
 if(/[\u0000-\u001f\u007f\\]/.test(s))throw Error('The address contains invalid characters');
 if(/^aster:\/\//i.test(s)){const page=s.slice(8).toLowerCase();if(INTERNAL.has(page))return 'aster://'+page;throw Error('Unknown browser page');}
 const authority=s.split(/[/?#]/,1)[0];
 const hostPort=/^(?:localhost|[^\s/:]+\.[^\s/:]+|\[[0-9a-f:]+\]):\d+(?:[/?#]|$)/i.test(s);
 if(/^[a-z][a-z\d+.-]*:/i.test(s)&&!hostPort)return validWeb(s);
 if(s.startsWith('//'))return validWeb('https:'+s);
 if(!/\s/.test(s)&&(/\./.test(authority)||/^localhost(?::\d+)?$/i.test(authority)||/^\[[0-9a-f:]+\](?::\d+)?$/i.test(authority))){
  const host=authority.replace(/:\d+$/,'');const loopback=/^localhost$/i.test(host)||/^127\./.test(host)||host==='[::1]';
  return validWeb((loopback?'http://':'https://')+s);
 }
 return (SEARCH[engine]||SEARCH.google)+encodeURIComponent(s);
}
function webURL(s){try{validWeb(s);return true;}catch{return false;}}
function httpRetry(url,error){if(!/^https:\/\//.test(url)||!/ERR_(CONNECTION_REFUSED|CONNECTION_RESET|CONNECTION_CLOSED|CONNECTION_TIMED_OUT|TIMED_OUT|ADDRESS_UNREACHABLE)/.test(String(error))||/CERT|SSL/.test(String(error)))return null;const u=new URL(url);u.protocol='http:';return u.href;}
module.exports={normalize,webURL,SEARCH,INTERNAL,httpRetry};
