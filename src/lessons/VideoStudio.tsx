import {filmCase,filmSectionHeight} from './filmCases.ts';
import {filmLabelPose,type FilmLabel} from './filmLabels.ts';
import * as T from 'three';
import {directedPose,ease,type FilmMotion,type Shot} from './filmDirector.ts';
import {stationAt} from '../analysis/beam.ts';
import {diameterAt} from '../domain/model.ts';
import {useEffect,useMemo,useRef,useState} from 'react';
import PoleScene,{arrowLength} from '../scene/PoleScene.tsx';
import SectionView from '../ui/SectionView.tsx';
import DetectSection from '../ui/DetectSection.tsx';
import {defaultCase,newRegion,type ViewMode} from '../domain/model.ts';
import {solvePole} from '../analysis/beam.ts';
import {utilisationColour} from '../scene/materials.ts';
import './studio.css';
interface Chapter{shots:Shot[];labels:FilmLabel[];label?:FilmLabel;cues:{start:number;end:number;text:string}[];title:string;text:string;view:ViewMode|'Detect';camera:string;motion:FilmMotion;callout:string;duration:number;audio:string}
interface Film{id:string;title:string;subtitle:string;chapters:Chapter[];duration:number}
const noop=()=>{};
export default function VideoStudio(){
 const [films,setFilms]=useState<Film[]>([]),[film,setFilm]=useState(0),[chapter,setChapter]=useState(0),[phase,setPhase]=useState(0),[status,setStatus]=useState('Loading narration…'),[busy,setBusy]=useState(false);
 const uiFrames=useRef<Record<string,HTMLImageElement[]>>({}),uiMeta=useRef<Record<string,{rect:{x:number;y:number;width:number;height:number}|null;frames:{file:string;capturedAt:number}[]}>>({});
 const referenceSection=useRef<HTMLDivElement>(null),main=useRef<HTMLDivElement>(null),section=useRef<HTMLDivElement>(null),output=useRef<HTMLCanvasElement>(null),abort=useRef(false),frame=useRef(0);
 const p=useMemo(()=>filmCase(film,chapter),[film,chapter]),result=useMemo(()=>solvePole(p),[p]),ch=films[film]?.chapters[chapter],z=filmSectionHeight(film,chapter,result.timberZ);
 const soundPole=useMemo(()=>({...p,regions:[]}),[p]),soundResult=useMemo(()=>solvePole(soundPole),[soundPole]);
 const chapterRef=useRef({film,chapter,ch,p,result,z,soundResult});chapterRef.current={film,chapter,ch,p,result,z,soundResult};
 const pose=useMemo(()=>{const q=stationAt(result,z);return directedPose(ch?.shots,phase*(ch?.duration??0),z,[q.ux,-q.uy]);},[ch,phase,z,result]);
 const poseRef=useRef(pose);poseRef.current=pose;
 const cameraCommand=useMemo(()=>({mode:ch?.camera??'whole',seq:chapter}),[ch,chapter]);
 useEffect(()=>{fetch(import.meta.env.BASE_URL+'videos/manifest.json').then(r=>r.json()).then(v=>{setFilms(v);setStatus('Ready to prepare videos');}).catch(()=>setStatus('Narration manifest unavailable'));return()=>{abort.current=true;cancelAnimationFrame(frame.current);};},[]);
 useEffect(()=>{fetch('/video-ui/evidence.json').then(r=>r.json()).then(async data=>{uiMeta.current=data;for(const [key,value] of Object.entries(data) as [string,{frames:{file:string}[]}][]){uiFrames.current[key]=await Promise.all(value.frames.map(f=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Missing UI capture '+f.file));image.src='/video-ui/'+f.file;})));}}).catch(e=>setStatus(String(e)));},[]);
 function paint(t=0){
  const c=output.current?.getContext('2d');if(!c)return;const {ch,p,z,result,film,chapter,soundResult}=chapterRef.current;if(!ch)return;
  const fraction=Math.min(1,t/ch.duration),q=ease(fraction),a=main.current?.querySelector<HTMLCanvasElement>('canvas[aria-label^="Interactive 3D"]'),b=section.current?.querySelector<HTMLCanvasElement>(ch.view==='Detect'?'.wave-field':'.section-canvas-wrap canvas');
  c.fillStyle='#fff';c.fillRect(0,0,1280,720);
  // A calm editorial frame, with a continuous chapter strip and a wide image area.
  c.fillStyle='#164e70';c.font='600 13px system-ui';c.fillText('INNERVIEW INSIGHTS  /  POLE LABORATORY',28,27);
  c.fillStyle='#14334a';c.font='600 29px system-ui';c.fillText(ch.title,28,68);
  c.fillStyle='#5a7180';c.font='14px system-ui';c.textAlign='right';c.fillText(`${chapter+1} / ${films[film]?.chapters.length}   ·   ${ch.view==='Innerview'?'Defects':ch.view}`,1250,28);c.textAlign='left';
  const count=films[film]?.chapters.length??4,gap=1236/count;for(let k=0;k<count;k++){c.fillStyle=k<chapter?'#206382':'#e4edf2';c.fillRect(28+k*gap,88,gap-9,3);if(k===chapter){c.fillStyle='#206382';c.fillRect(28+k*gap,88,(gap-9)*fraction,3);}}
  c.save();c.beginPath();c.rect(0,110,744,480);c.clip();c.fillStyle='#fcfdfe';c.fillRect(0,110,744,480);c.strokeStyle='#edf1f4';c.lineWidth=1;
  for(let x=0;x<744;x+=32){c.beginPath();c.moveTo(x,110);c.lineTo(x,590);c.stroke();}for(let y=110;y<590;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(744,y);c.stroke();}if(a)c.drawImage(a,0,110,744,480);if(film===4&&(chapter===3||chapter===4)){const chart=main.current?.querySelector<HTMLCanvasElement>('.height-chart');if(chart)c.drawImage(chart,0,110,744,480);}c.restore();
  c.strokeStyle='#dde6eb';c.beginPath();c.moveTo(746,112);c.lineTo(746,608);c.stroke();
  c.fillStyle='#627c8c';c.font='600 12px system-ui';c.fillText('INSPECTION PLANE',780,118);c.font='14px system-ui';c.textAlign='right';c.fillText(`${z.toFixed(2)} m  ·  Ø ${Math.round(diameterAt(p,z)*1000)} mm`,1244,118);c.textAlign='left';
  if(b){if(ch.view==='Detect'){const ratio=Math.min(502/b.width,350/b.height),w=b.width*ratio,h=b.height*ratio;c.drawImage(b,765+(502-w)/2,146+(350-h)/2,w,h);}else {const side=444;c.drawImage(b,1008-side/2,357-side/2,side,side);}}
  // A leader anchored to an actual deformed point, projected with the same camera as the shot.
  for(const label of ch.labels??[]){
  const badge=filmLabelPose(label.text==='Timber bending estimate'?{...label,y:260}:label,t,ch.duration);const callout=label.text??ch.callout;
  const loadAnchor=['Tip load','Load direction','Applied load'].includes(callout),targetZ=loadAnchor?p.length-p.embedment:callout==='Groundline restraint'?0:z,at=stationAt(result,targetZ),camera=new T.PerspectiveCamera(32,744/480,.01,200),cp=poseRef.current;
  camera.position.fromArray(cp.position);camera.lookAt(new T.Vector3().fromArray(cp.target));camera.updateMatrixWorld();
  const bearing=p.bearing*Math.PI/180,anchor=new T.Vector3(at.ux+(loadAnchor?Math.sin(bearing)*arrowLength(p.loadKN):0),targetZ,-at.uy-(loadAnchor?Math.cos(bearing)*arrowLength(p.loadKN):0)).project(camera),ax=callout==='Received signal'?840:callout==='Sound reference'?1155:callout==='Timber bending estimate'?140:(anchor.x+1)*372,ay=callout==='Received signal'||callout==='Sound reference'?509:callout==='Timber bending estimate'?190:110+(1-anchor.y)*240;
  if(badge.alpha>0){
   c.save();c.globalAlpha=badge.alpha;const lx=badge.x,ly=badge.y;c.font='600 16px system-ui';const width=Math.min(230,c.measureText(callout).width+32),join=badge.side==='left'?lx+width:lx;
   c.strokeStyle='rgba(42,87,115,.72)';c.lineWidth=1.15;c.beginPath();c.moveTo(ax,ay);c.lineTo(join+(badge.side==='left'?24:-24),ly+20);c.lineTo(join,ly+20);c.stroke();
   c.fillStyle='#fff';c.beginPath();c.arc(ax,ay,3.5,0,Math.PI*2);c.fill();c.stroke();
   c.shadowColor='rgba(16,49,73,.12)';c.shadowBlur=12;c.shadowOffsetY=3;c.fillStyle='rgba(255,255,255,.97)';c.beginPath();c.roundRect(lx,ly,width,40,10);c.fill();c.shadowColor='transparent';c.strokeStyle='#d7e3ea';c.stroke();
   c.fillStyle='#205d7a';c.fillRect(lx+1,ly+12,2,16);c.fillStyle='#173e56';c.fillText(callout,lx+16,ly+26);c.restore();
  }
  }
  c.fillStyle='#435f70';c.font='14px system-ui';c.fillText(`${p.loadKN.toFixed(1)} kN towards ${p.bearing}°`,28,603);c.fillStyle='#718593';c.font='12px system-ui';c.fillText(film===4?'Example inputs · fixed cantilever':'Illustrative model · ideal groundline restraint',280,603);
  if(ch.view==='Stresses'){for(let x=0;x<280;x++){const v=utilisationColour(x/280*1.5);c.fillStyle=`rgb(${v.join(',')})`;c.fillRect(862+x,586,1.2,6);}c.fillStyle='#476677';c.font='12px system-ui';c.fillText('Beam utilisation',778,580);c.fillText('0%',862,610);c.fillText('100%',1034,610);c.fillText('150%',1113,610);}
  else if(ch.view!=='Detect'){c.fillStyle='#476677';c.font='13px system-ui';c.fillText(!p.regions.length?'Sound timber':p.regions.some(r=>r.kind==='void')?'Cavity · remaining timber shell':'Prescribed decay · remaining timber',782,608);}
  if(ch.view==='Detect'){const trace=section.current?.querySelector<HTMLCanvasElement>('.wave-trace');if(trace)c.drawImage(trace,799,526,416,76);c.fillStyle='#365d76';c.font='12px system-ui';c.fillText('RECEIVED SIGNAL',800,516);c.fillStyle='#286c9b';c.fillText('Section',1065,516);c.fillStyle='#7a8994';c.fillText('Sound reference',1120,516);}
  if(film===2&&chapter===3){c.fillStyle='rgba(255,255,255,.96)';c.fillRect(24,134,260,89);c.fillStyle='#5a7485';c.font='13px system-ui';c.fillText('ESTIMATED POLE-TOP CAPACITY',36,157);c.fillStyle='#194e70';c.font='600 29px system-ui';c.fillText(`${result.timberLimitKN.toFixed(2)} kN`,36,192);c.fillStyle='#5a7485';c.font='12px system-ui';c.fillText('Timber bending model · specified direction',36,213);}
  if(film>=4){
   const shot=[...ch.shots].reverse().find(s=>t>=s.start)??ch.shots[0],key=shot.id,images=uiFrames.current[key],meta=uiMeta.current[key];
   c.fillStyle='#f3f6f8';c.fillRect(0,96,1280,538);
   if(images?.length){const elapsed=Math.max(0,t-shot.start),frame=meta.frames.findIndex(f=>(f.capturedAt-meta.frames[0].capturedAt)/1000>elapsed),im=images[frame<0?images.length-1:Math.max(0,frame-1)];const scale=Math.min(1280/im.width,538/im.height),w=im.width*scale,h=im.height*scale,ox=(1280-w)/2,oy=96+(538-h)/2;c.drawImage(im,ox,oy,w,h);
    const active=ch.labels.find(l=>t>=l.start&&t<l.end),rect=meta.rect;
    // Two views of the same captured pixels: readable detail and contextual full screen.
    const phone=key.startsWith('safe')||key.startsWith('analyser');
    c.fillStyle=phone?'#202321':'#f3f6f8';c.fillRect(0,96,1280,538);
    let cx=0,cy=0,cw=1280,chh=720,dx=400,dy=108,dw=868,dh=488;
    if(phone){
     c.drawImage(im,468,0,344,720,954,100,251,526);
     cx=492;cy=({safeHome:385,safeChecks:330,safeLean:100,safeMovement:185,safeUB:350,safeScan:180,safeIssues:155,safeRecords:235,analyserHome:185,analyserScan:290,analyserResult:430,analyserDetail:360,analyserRecords:295} as Record<string,number>)[key]??130;cw=298;chh=250;dx=58;dy=140;dw=775;dh=650;
     // A constant crop holds the control/detail view; no artificial scrolling or camera drift.
     chh=180;dh=468;c.drawImage(im,cx,cy,cw,chh,dx,dy,dw,dh);
    }else{
     c.drawImage(im,dx,dy,dw,dh);
     cx=rect&&rect.x>700?Math.max(700,Math.min(1030,rect.x-70)):0;cy=Math.max(0,Math.min(350,(rect?.y??140)-150));cw=250;chh=370;dx=18;dy=105;dw=350;dh=518;
     c.drawImage(im,cx,cy,cw,chh,dx,dy,dw,dh);
     if(rect&&t<Math.max(shot.cueTime+4,...ch.labels.filter(l=>l.start>=shot.start).map(l=>l.end))){c.save();c.strokeStyle='#d78119';c.lineWidth=3;c.beginPath();c.roundRect(dx+(rect.x-cx-4)*dw/cw,dy+(rect.y-cy-4)*dh/chh,(rect.width+8)*dw/cw,(rect.height+8)*dh/chh,5);c.stroke();c.restore();}
    }
    if(active){const badge=filmLabelPose(active,t,ch.duration);c.save();c.globalAlpha=badge.alpha;c.fillStyle='#164e70';c.font='600 15px system-ui';const text=active.text??'',ww=c.measureText(text).width+28;c.fillRect(14,98,ww,30);c.fillStyle='#fff';c.fillText(text,28,119);c.restore();}
   }else{c.fillStyle='#b00020';c.fillText('Missing recorded UI: '+key,30,140);}
  }
  // Captions stay in a dedicated band; the model is never obscured by narration text.
  c.fillStyle='#eef4f8';c.fillRect(0,634,1280,86);c.fillStyle='#18384d';c.font='22px system-ui';const cue=ch.cues?.find(v=>t>=v.start&&t<=v.end+.16),words=(cue?.text??'').split(' ');let line='',lines:string[]=[];
  for(const word of words){if(c.measureText(line+' '+word).width>1200){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);lines.forEach((l,i)=>c.fillText(l,32,lines.length>1?663+i*29:680));
 }

 useEffect(()=>{let stop=false;function tick(){if(stop)return;paint(phase*(ch?.duration??0));frame.current=requestAnimationFrame(tick);}if(!busy)tick();return()=>{stop=true;cancelAnimationFrame(frame.current);};},[busy,ch,phase]);
 const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
 async function ready(f:number,k:number){const start=performance.now();while(performance.now()-start<90000){if(abort.current)throw Error('Recording stopped');const current=chapterRef.current;if(current.film===f&&current.chapter===k){if(f>=4&&current.ch?.shots.every(s=>uiFrames.current[s.id]?.length)){await wait(100);return;}const detect=current.ch?.view==='Detect',canvas=section.current?.querySelector<HTMLCanvasElement>(detect?'.wave-field':'.section-canvas-wrap canvas'),ok=detect?section.current?.textContent?.includes('simulated response'):canvas?.dataset.sectionReady==='true',sceneReady=!main.current?.textContent?.includes('Preparing stress surfaces');if(f<4&&ok&&(f!==4||k!==5||referenceSection.current?.querySelector<HTMLCanvasElement>('.section-canvas-wrap canvas')?.dataset.sectionReady==='true')&&sceneReady&&main.current?.querySelector('canvas[aria-label^="Interactive 3D"]')){await wait(1000);return;}}await wait(150);}throw Error('Scene did not become ready; recording withheld');}
 async function recordAll(wavesOnly=false,onlyFilm:number|number[]|null=null){if(busy)return;abort.current=false;setBusy(true);try{for(let f=0;f<films.length;f++)for(let k=0;k<films[f].chapters.length;k++){if(onlyFilm!==null&&!(Array.isArray(onlyFilm)?onlyFilm.includes(f):f===onlyFilm)||wavesOnly&&films[f].chapters[k].view!=='Detect')continue;setFilm(f);setChapter(k);setPhase(0);setStatus(`Preparing ${f+1}/${films.length} · chapter ${k+1}/${films[f].chapters.length}`);await ready(f,k);const spec=films[f].chapters[k],stream=output.current!.captureStream(30),chunks:BlobPart[]=[],type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('Browser video recorder unavailable');const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:7500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise<void>((resolve,reject)=>{recorder.onstop=()=>resolve();recorder.onerror=()=>reject(Error('Recorder failed'));});setStatus(`Recording ${f+1}/${films.length} · chapter ${k+1}/${films[f].chapters.length}`);paint(0);recorder.start();const start=performance.now();while(performance.now()-start<spec.duration*1000){if(abort.current){recorder.stop();await done;stream.getTracks().forEach(track=>track.stop());throw Error('Recording stopped');}const t=(performance.now()-start)/1000;setPhase(t/spec.duration);paint(t);await wait(1000/30);}recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const response=await fetch(`/__record/${films[f].id}-${k}.webm`,{method:'POST',body:new Blob(chunks,{type})});if(!response.ok)throw Error('Local video save failed');}setStatus('Requested chapters recorded. Ready for final encoding.');}catch(e){setStatus(String(e));}finally{setBusy(false);}}
 return <main className="film-studio"><header><strong>Video authoring studio</strong><button disabled={busy||!films.length} onClick={()=>void recordAll()}>Record all films</button><button disabled={busy||!films.length} onClick={()=>void recordAll(false,[0,1,2,3,5,6])}>Record revised models and introductions</button><button disabled={busy||!films.length} onClick={()=>void recordAll(true)}>Re-record wave chapters</button><button disabled={!busy} onClick={()=>{abort.current=true;}}>Stop recording</button><span role="status">{status}</span></header><div className="studio-shot-controls"><label>Film <select aria-label="Preview film" disabled={busy} value={film} onChange={e=>{setFilm(Number(e.target.value));setChapter(0);setPhase(0);}}>{films.map((f,i)=><option key={f.id} value={i}>{f.title}</option>)}</select></label><label>Chapter <select aria-label="Preview chapter" disabled={busy} value={chapter} onChange={e=>{setChapter(Number(e.target.value));setPhase(0);}}>{films[film]?.chapters.map((c,i)=><option key={c.title} value={i}>{c.title}</option>)}</select></label><label>Time <input aria-label="Preview time" disabled={busy} type="range" min="0" max="1" step=".01" value={phase} onChange={e=>setPhase(Number(e.target.value))}/></label><button disabled={busy||!films.length} onClick={()=>void recordAll(false,film)}>Record selected film</button></div><canvas ref={output} width={1280} height={720} aria-label="Film output preview"/><div className="film-sources"><div ref={main} className="film-main">{ch&&<PoleScene key={`${film}-${chapter}`} capture pole={p} result={result} view={ch.view==='Detect'?'Setup':ch.view} testBearing={film===2||film===3?90:undefined} section={z} stressDisplay="utilisation" soil scale={1} cameraCommand={cameraCommand} linkedPose={pose} chartMetric={film===4?'capacityApplied':'usageApplied'} onDefectSelect={noop} onDefectMove={noop} onProfile={noop} onSection={noop} onForce={noop}/>}</div><div ref={section} className="film-section">{ch&&(ch.view==='Detect'?<DetectSection capture result={result} key={`${film}-${chapter}`} pole={p} z={z} bearing={90} onBearing={noop} onHeight={noop}/>:<SectionView key={`${film}-${chapter}`} pole={p} result={result} view={ch.view} z={z} stressDisplay="utilisation" onHeight={noop} selected={null} onAdd={noop} onEdit={noop} onSelect={noop} onMessage={noop}/>)}</div><div ref={referenceSection} className="film-section">{film===4&&chapter===5&&<SectionView pole={soundPole} result={soundResult} view="Stresses" z={z} stressDisplay="utilisation" onHeight={noop} selected={null} onAdd={noop} onEdit={noop} onSelect={noop} onMessage={noop}/>}</div></div></main>;
}


