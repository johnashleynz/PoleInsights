import {writeFileSync} from 'node:fs';
import {defaultCase,newRegion} from '../src/domain/model.ts';
import {solvePole} from '../src/analysis/beam.ts';
import {inspectionCapacity} from '../src/inspection/capacity.ts';
import {filmPose} from '../src/lessons/filmDirector.ts';
const checks=[];function check(name,pass,data){checks.push({name,pass,data});if(!pass)throw Error(name);}
const p=defaultCase('A');p.regions=[];p.soil='Fixed';p.loadKN=1;
const sound=solvePole(p),a=inspectionCapacity(sound,p.bearing);
check('A current valid result supplies a positive whole-pole timber estimate',a.capacityKN>0&&a.capacityKN===sound.timberLimitKN,a);
check('Soil first limit does not cap the inspection timber estimate',inspectionCapacity({...sound,limitKN:.01,soilLimitKN:.01},p.bearing).capacityKN===a.capacityKN);
check('Pending or failed result has no stale capacity',inspectionCapacity(null,0)===null);
check('Nonfinite capacity is withheld',inspectionCapacity({...sound,timberLimitKN:Infinity},0)===null);
const defect=newRegion(p);defect.kind='void';defect.zMin=0;defect.zMax=2;defect.shape={type:'ellipse',centreX:.035,centreY:0,radiusX:.07,radiusY:.06,angle:0,profile:'constant'};p.regions=[defect];
const damaged=inspectionCapacity(solvePole(p),p.bearing);
check('Known section loss lowers the structural capacity',damaged.capacityKN<a.capacityKN,{sound:a.capacityKN,damaged:damaged.capacityKN});
const high=inspectionCapacity(solvePole({...p,loadKN:4}),p.bearing);
check('Capacity is not current-load utilisation or an amplitude-scaled estimate',Math.abs(high.capacityKN-damaged.capacityKN)<1e-6);
check('History-dependent response remains labelled an elastic reference',inspectionCapacity({...sound,nonlinear:{}},-90).nonlinearFailure===false&&inspectionCapacity(sound,-90).bearing===270);
for(const motion of ['reveal','orbit','push','sweep','orbitDetail','topDetail']){
 const frames=Array.from({length:31},(_,i)=>filmPose(motion,i/30,1.2,[.1,.05]));
 check(`${motion}: finite static default framing`,frames.every(f=>f.position.concat(f.target).every(Number.isFinite))&&frames.every(f=>JSON.stringify(f)===JSON.stringify(frames[0])));
}
writeFileSync('verification/results/p18.json',JSON.stringify({scope:'Inspection capacity provenance and camera paths; no new physical qualification',checks},null,2));
console.log(`${checks.length} P18 checks passed.`);
