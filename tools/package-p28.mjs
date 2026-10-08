import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnv} from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const additions=['deployment.md','src/domain/build.ts','src/domain/ansiDimensions.ts','src/integrations/readingGroups.ts','src/integrations/estimatedProfile.ts','src/integrations/poleTag.ts','src/integrations/speciesMatch.ts','src/integrations/deconditioning.ts','src/integrations/gridRecordWindow.ts','tools/package-p28.mjs'];
for(const name of readdirSync(path.join(root,'docs')))if(name.startsWith('P28-'))additions.push(`docs/${name}`);
const candidates=[...new Set([...tracked,...additions])].sort();
const excluded=f=>/(^|\/)(?:\.git|node_modules|dist|handoff|\.wrangler|\.media-work|\.media-deps)(\/|$)/.test(f)||/(^|\/)\.env(?:\.|$)/.test(f)&&f!=='.env.example'||/(^|\/)\.dev\.vars(?:\.|$)/.test(f)||/\.(?:mp4|mov|webm|wav|mp3|m4a|ogg|avi)$/i.test(f);
const env=loadEnv('development',root,'');
const secrets=['GRID_MANAGER_CLIENT_ID','GRID_MANAGER_CLIENT_SECRET','GRID_MANAGER_BEARER_TOKEN'].map(k=>env[k]).filter(Boolean);
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const out=path.join(root,'handoff',`P28-${stamp}`), source=path.join(out,'source');
mkdirSync(source,{recursive:true});
const files=[],omitted=[];
for(const relative of candidates){
 if(excluded(relative)){omitted.push(relative);continue;}
 const original=path.resolve(root,relative);
 if(!original.startsWith(root+path.sep))throw Error('Invalid package path');
 if(!statSync(original).isFile())continue;
 const bytes=readFileSync(original);
 if(secrets.some(secret=>bytes.includes(Buffer.from(secret))))throw Error('Configured credentials found in package input; packaging stopped.');
 const destination=path.join(source,relative);mkdirSync(path.dirname(destination),{recursive:true});copyFileSync(original,destination);
 files.push({path:relative,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const manifest={release:'P28',baseline:'5c273fe',parentCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),workingSnapshot:true,generatedUtc:new Date().toISOString(),files,omitted};
writeFileSync(path.join(source,'HANDOFF-MANIFEST.json'),JSON.stringify(manifest,null,2));
const archive=path.join(out,'Pole-Insights-P28-source-no-media.zip');
if(process.platform==='win32')execFileSync('tar.exe',['-a','-c','-f',archive,'-C',source,'.']);
else execFileSync('zip',['-qr',archive,'.'],{cwd:source});
console.log(JSON.stringify({archive,files:files.length,omitted:omitted.length,bytes:statSync(archive).size,credentialsIncluded:false},null,2));
