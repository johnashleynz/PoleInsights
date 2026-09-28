import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {directedPose,framingPose} from '../src/lessons/filmDirector.ts';
import {filmLabelPose} from '../src/lessons/filmLabels.ts';
import {filmCase,filmSectionHeight} from '../src/lessons/filmCases.ts';
import {solvePole,stationAt} from '../src/analysis/beam.ts';
const root=path.resolve(import.meta.dirname,'..');
const films=JSON.parse(fs.readFileSync(path.join(root,'public/videos/manifest.json'),'utf8'));
const ui=JSON.parse(fs.readFileSync(path.join(root,'public/video-ui/evidence.json'),'utf8'));
const checks=[];function check(name,pass,evidence){checks.push({name,pass,evidence});}
for(const [fi,f] of films.entries())for(const [ci,ch] of f.chapters.entries()){
 const id=`${f.id}/${ci+1}`;
 check(id+' chapter speech unit',JSON.parse(fs.readFileSync(path.join(root,'public/videos',ch.audio.replace('.wav','.voice.json')),'utf8')).unit==='one chapter per call',ch.wordCount);
 check(id+' shot count',ch.shots.length>=2&&ch.shots.length<=4,ch.shots.length);
 check(id+' camera holds >=50%',ch.staticPercent>=50,ch.staticPercent);
 check(id+' maximum three labels',ch.labels.length<=3,ch.labels.length);
 for(const l of ch.labels){
  check(id+' label starts before '+l.text,Math.abs(l.start-(l.cueTime-.3))<.0001,{start:l.start,cue:l.cueTime});
  check(id+' label minimum duration '+l.text,l.end-l.start>=3&&l.end>=l.cueTime+2.5,l.end-l.start);
  check(id+' label fade '+l.text,filmLabelPose(l,l.start,ch.duration).alpha===0&&filmLabelPose(l,l.start+.25,ch.duration).alpha>.999&&filmLabelPose(l,l.end,ch.duration).alpha===0,{fadeIn:.25,fadeOut:.4});
 }
 for(const s of ch.shots.slice(1))check(id+' move '+s.id,s.moveDuration===0||(s.moveDuration>=.6&&s.moveDuration<=1.6&&Math.abs(s.arrive-s.cueTime+.3)<.0001),s);
 const words=fs.readFileSync(path.join(root,'public/videos',ch.audio.replace('.wav','.timing.jsonl')),'utf8').split('\n').filter(Boolean).map(JSON.parse);
 for(const m of ch.cueMarks.filter(x=>x.kind==='pause')){
  const w=words[m.wordIndex],prev=words[m.wordIndex-1],lo=prev?(prev.rawOffset+prev.duration)/1e7:0,hi=w.rawOffset/1e7;
  check(id+' pause outside words',m.rawCut>=lo-.00001&&m.rawCut<=hi+.00001,{cut:m.rawCut,previousEnd:lo,nextStart:hi,extra:m.value});
 }
 if(fi>=4){for(const s of ch.shots){const spec=ui[s.id];check(id+' genuine P25 UI '+s.id,!!spec&&spec.build==='P25'&&spec.frames.every(x=>fs.existsSync(path.join(root,'public/video-ui',x.file))),spec?.url);if(spec?.rect)check(id+' visible focus target '+s.id,spec.rect.x>=0&&spec.rect.y>=0&&spec.rect.y<720,spec.rect);}continue;}
 const p=filmCase(fi,ci),r=solvePole(p),z=filmSectionHeight(fi,ci,r.timberZ),q=stationAt(r,z),centre=[q.ux,-q.uy];
 function projection(v,pose){const cam=new THREE.PerspectiveCamera(32,744/480,.01,200);cam.position.fromArray(pose.position);cam.lookAt(new THREE.Vector3().fromArray(pose.target));cam.updateMatrixWorld();const pt=new THREE.Vector3(...v).project(cam);return {x:(pt.x+1)*372,y:(1-pt.y)*240};}
 for(const shot of ch.shots){
  const pose=framingPose(shot.framing,z,centre),top=p.length-p.embedment,a=stationAt(r,top),b=stationAt(r,0),len=.35+.6*Math.sqrt(p.loadKN),rad=p.bearing*Math.PI/180;
  const pts=[[a.ux,top,-a.uy],[b.ux,0,-b.uy],[a.ux+Math.sin(rad)*len,top,-a.uy-Math.cos(rad)*len]].map(v=>projection(v,pose));
  if(shot.framing==='whole')check(id+' whole framing',pts.every(v=>v.x>0&&v.x<744&&v.y>0&&v.y<480)&&(Math.max(...pts.map(x=>x.y))-Math.min(...pts.map(x=>x.y)))/480>=.6,{points:pts,heightFraction:(Math.max(...pts.map(x=>x.y))-Math.min(...pts.map(x=>x.y)))/480});
  if(['detail','section'].includes(shot.framing)){const left=projection([centre[0]-.72,z,centre[1]],pose),right=projection([centre[0]+.72,z,centre[1]],pose);check(id+' inspection ellipse under40%',Math.abs(left.x-right.x)/744<.4,Math.abs(left.x-right.x)/744);}
  if(shot.framing.startsWith('tip'))check(id+' tip and arrow visible',[pts[0],pts[2]].every(v=>v.x>8&&v.x<736&&v.y>8&&v.y<472),pts);
 }
}
fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/p26-checks.json'),JSON.stringify({passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass),checks},null,2));
console.log(JSON.stringify({passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass)},null,2));
if(checks.some(x=>!x.pass))process.exitCode=1;
