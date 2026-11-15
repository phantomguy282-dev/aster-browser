const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),pkg=require(path.join(root,'package.json')),site=path.join(root,'website');
const input=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'dist',`Aster-Setup-${pkg.version}.exe`);
if(!fs.existsSync(input))throw Error(`Installer does not exist: ${input}. Build first; no release manifest was fabricated.`);
if(path.basename(input)!==`Aster-Setup-${pkg.version}.exe`)throw Error('Installer filename must match the current package version; do not label an older binary as a new release.');
const stat=fs.statSync(input);if(!stat.isFile()||stat.size<1024)throw Error('Installer is not a regular executable');const data=fs.readFileSync(input);if(data.toString('ascii',0,2)!=='MZ')throw Error('Artifact is not a Windows executable');
const dir=path.join(site,'downloads');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,path.basename(input));fs.copyFileSync(input,dest);
const manifest={schema:1,product:'Aster',version:pkg.version,channel:'preview',platform:'Windows 10/11 x64',artifactDate:stat.mtime.toISOString(),file:`downloads/${path.basename(dest)}`,size:stat.size,sha256:crypto.createHash('sha256').update(data).digest('hex'),signed:false,notes:'Expansion preview. Review release notes and integration setup requirements before use.'};
fs.writeFileSync(path.join(site,'release.json'),JSON.stringify(manifest,null,2)+'\n');console.log(`Prepared ${manifest.file}: ${manifest.size} bytes, SHA-256 ${manifest.sha256}`);
