import {defineConfig,loadEnv,type Plugin} from 'vite';
import {gridManagerMiddleware} from './server/gridManager.ts';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const root=fileURLToPath(new URL('.',import.meta.url));
// Authoring only: same-origin local recording sink. Absent from production builds.
function recordingSink():Plugin{return {name:'local-film-recording',apply:'serve',configureServer(server){server.middlewares.use('/__record',async(req,res)=>{const origin=req.headers.origin,host=req.headers.host,name=req.url?.slice(1);if(req.method!=='POST'||origin!==`http://${host}`||!host?.startsWith('127.0.0.1:')||!name||! /^((where-poles-break|decay-and-strength|ultrasonic-detection|before-climbing)-[0-3]|predict-pole-test-[0-5]|(ub1000-analyser|safe2climb)-[0-3])\.webm$/.test(name)){res.statusCode=403;res.end();return;}try{const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>40*1024*1024)throw Error('Recording too large');chunks.push(chunk);}await mkdir(root+'.media-p26',{recursive:true});await writeFile(root+'.media-p26/'+name,Buffer.concat(chunks));res.end('Saved '+name);}catch{res.statusCode=500;res.end('Recording could not be saved');}});}};}
export default defineConfig(({mode})=>({root,cacheDir:root+'.vite-p26',base:'./',plugins:[react(),recordingSink(),{name:'grid-manager-local',configureServer(server){server.middlewares.use(gridManagerMiddleware({...loadEnv(mode,root,''),...process.env} as Record<string,string>));}}],server:{host:'127.0.0.1',port:5190,strictPort:true},build:{outDir:'dist',emptyOutDir:true},worker:{format:'es'}}));

