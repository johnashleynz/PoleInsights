// Copy alongside production index.html for a dependency-free local preview.
import http from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {dirname,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.vtt':'text/vtt; charset=utf-8'};
const server=http.createServer((req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!path.startsWith(root+sep)||!statSync(path).isFile()){res.writeHead(404);res.end('Not found');return;}
  const size=statSync(path).size;let start=0,end=size-1,status=200;res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
  if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2]))throw Error('Invalid range');if(match[1]){start=Number(match[1]);end=match[2]?Math.min(size-1,Number(match[2])):size-1;}else start=Math.max(0,size-Number(match[2]));if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
  res.setHeader('Content-Length',Math.max(0,end-start+1));res.writeHead(status);if(req.method==='HEAD'||size===0){res.end();return;}createReadStream(path,{start,end}).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(5192,'127.0.0.1',()=>console.log('InnerView Pole Lab review: http://127.0.0.1:5192/ (Ctrl+C to stop)'));
