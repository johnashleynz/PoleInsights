// The phone owns one child app and relays only that session's acquisition state.
// Pole Lab independently validates the wrapper window, origin, token and payload.
export function connectPhone(){
 const frame=document.querySelector('iframe');
 if(!frame)return;
 const params=new URLSearchParams(location.search),token=params.get('labSession'),kind=params.get('labApp');
 const host=window.parent!==window?window.parent:window.opener;
 let last=null;
 const send=data=>host?.postMessage(data,location.origin);
 window.addEventListener('message',event=>{
  if(!token||!host||event.origin!==location.origin||event.source!==frame.contentWindow)return;
  const m=event.data;
  if(!m||typeof m!=='object'||m.type!=='pole-lab-acquisition-v1'||m.token!==token||m.kind!==kind||
   !['axonic','safe2climb'].includes(kind)||typeof m.running!=='boolean'||typeof m.runId!=='string'||m.runId.length>=100||
   !(m.heightMM===null||typeof m.heightMM==='number'&&Number.isFinite(m.heightMM)))return;
  last={type:m.type,token,kind,running:m.running,runId:m.runId,heightMM:m.heightMM};
  send(last);
 });
 window.addEventListener('pagehide',()=>{if(last)send({...last,running:false});});
 // Set src once, after the relay is listening, to avoid an unseeded first load.
 const url=new URL('./index.html',location.href);
 for(const key of ['labSession','labApp','pole'])if(params.has(key))url.searchParams.set(key,params.get(key));
 url.hash=kind==='axonic'?'analyser/summary':'capture';
 frame.src=url.href;
}
