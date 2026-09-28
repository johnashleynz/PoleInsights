// Playback bridge only: no acoustic inference, strength calculation or climb decision.
const params=new URLSearchParams(location.search);
const token=params.get('labSession'),kind=params.get('labApp');
export const labContext=(()=>{try{return JSON.parse(params.get('pole')||'null');}catch{return null;}})();
let running=false,run=0,height=null;
const documentId=crypto.randomUUID();
function send(){
 const host=window.parent!==window?window.parent:window.opener;
 if(!token||!host)return;
 host.postMessage({type:'pole-lab-acquisition-v1',token,kind,running,runId:`${documentId}:${run}`,heightMM:height},location.origin);
}
export function publishScan(active,scanHeight){
 if(active&&!running){run++;height=Number.isFinite(scanHeight)?scanHeight:null;}
 running=!!active;send();
}
export function connectLab(){
 if(!token)return;
 send();const timer=setInterval(send,750);
 window.addEventListener('pagehide',()=>{running=false;send();clearInterval(timer);});
}
