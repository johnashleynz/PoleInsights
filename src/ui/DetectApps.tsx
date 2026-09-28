import {useEffect,useRef,useState} from 'react';
import {diameterAt,type PoleCase} from '../domain/model.ts';
import {speciesById} from '../domain/species.ts';
import {acquisitionMessage,type MockupKind,type WaveControl} from '../inspection/mockupProtocol.ts';
import './detectApps.css';
const names={safe2climb:'Safe2Climb',axonic:'Axonic Analyser'};
interface Session {kind:MockupKind;token:string;url:string;popup:Window|null;inline:boolean;lastSeen:number;lastRun:string;connected:boolean}
export default function DetectApps({pole,z,onControl,onHeight}:{pole:PoleCase;z:number;onControl:(v:WaveControl|null)=>void;onHeight:(z:number)=>void}){
 const current=useRef<Session|null>(null),iframe=useRef<HTMLIFrameElement>(null),callbacks=useRef({onControl,onHeight,pole});callbacks.current={onControl,onHeight,pole};
 const [session,setSession]=useState<Session|null>(null),[minimised,setMinimised]=useState(false);
 function close(){current.current?.popup?.close();current.current=null;setSession(null);callbacks.current.onControl(null);}
 function open(kind:MockupKind,inline=false){
  close();setMinimised(false);const token=crypto.randomUUID(),url=new URL(`${import.meta.env.BASE_URL}mockups/${kind}/phone.html`,location.href);
  document.querySelector('.section-panel')?.scrollTo(0,0);
  url.search=new URLSearchParams({labSession:token,labApp:kind,pole:JSON.stringify({id:`Lab-${pole.id}`,species:speciesById(pole.species)?.name??pole.species,length:pole.length,height:pole.length-pole.embedment,circumference:Math.round(diameterAt(pole,z)*1000*Math.PI),scanHeight:Math.round(z*1000)})}).toString();
  url.hash=kind==='axonic'?'analyser/summary':'capture';
  let popup:Window|null=null;if(!inline){try{popup=window.open(url.href,`pole-lab-${token}`,'popup,width=478,height=1000,resizable=yes,scrollbars=yes');}catch{}}
  const next={kind,token,url:url.href,popup,inline:!popup,lastSeen:Date.now(),lastRun:'',connected:false};current.current=next;setSession(next);callbacks.current.onControl({running:false,runId:''});
 }
 useEffect(()=>{
  function receive(event:MessageEvent){const s=current.current;if(!s||event.origin!==location.origin||event.source!==(s.inline?iframe.current?.contentWindow:s.popup))return;const m=acquisitionMessage(event.data,s.token,s.kind);if(!m)return;
   const h=callbacks.current.pole.length-callbacks.current.pole.embedment,withinPole=m.heightMM!==null&&m.heightMM>=0&&m.heightMM<=h*1000;
   s.lastSeen=Date.now();s.connected=true;
   if(m.running&&m.runId!==s.lastRun){s.lastRun=m.runId;if(withinPole)callbacks.current.onHeight(m.heightMM!/1000);}
   callbacks.current.onControl({running:m.running&&withinPole,runId:m.runId});
  }
  window.addEventListener('message',receive);
  const timer=setInterval(()=>{const s=current.current;if(!s)return;if(!s.connected&&!s.inline&&Date.now()-s.lastSeen>3500){s.popup?.close();s.popup=null;s.inline=true;s.lastSeen=Date.now();setSession({...s});return;}if(s.popup?.closed){close();return;}if(Date.now()-s.lastSeen>5000){callbacks.current.onControl({running:false,runId:s.lastRun});}},1000);
  const unload=()=>current.current?.popup?.close();window.addEventListener('pagehide',unload);
  return()=>{clearInterval(timer);window.removeEventListener('message',receive);window.removeEventListener('pagehide',unload);current.current?.popup?.close();current.current=null;callbacks.current.onControl(null);};
 },[]);
 return <section className="detect-apps"><h3>Try the inspection apps</h3><div className="detect-app-launchers">{(['safe2climb','axonic'] as const).map(kind=><button key={kind} aria-label={`Pop out ${names[kind]}`} onClick={()=>open(kind)}>{names[kind]}<small>Pop out</small></button>)}</div>{!session&&<p className="field-note">Scans in either app control the ultrasound animation.</p>}{session?.inline&&<section className={`detect-app-window ${minimised?'minimised':''}`} role="region" aria-label={`${names[session.kind]} mockup`}><header><strong>{names[session.kind]}</strong><div><button onClick={()=>setMinimised(!minimised)}>{minimised?'Restore':'Minimise'}</button><button onClick={close} aria-label="Close inspection app">Close</button></div></header><iframe ref={iframe} key={session.token} src={session.url} title={`${names[session.kind]} workflow mockup`} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"/></section>}</section>;
}
