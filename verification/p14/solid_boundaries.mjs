import {writeFileSync} from 'node:fs';
import {defaultCase,newRegion} from '../../src/domain/model.ts';
import {volumeMesh} from '../../src/analysis/solid/volumeMesh.ts';
import {extendMesh} from '../../src/analysis/solid/extendMesh.ts';
import {materialAt} from '../../src/analysis/solid/material.ts';
import {orthotropicD} from '../../src/analysis/solid/kernel.ts';
import {curvedEndLoads,solveCurved} from '../../src/analysis/solid/curved.ts';
import {prepareRecovery} from '../../src/analysis/solid/curvedRecovery.ts';
import {localStressAt} from '../../src/analysis/solid/field.ts';
const report={gate:.05,scope:'Fixed local mesh; remote boundary extension only. Selected elastic stresses, not capacity or physical validation.',rows:[],assessments:[]};
const save=()=>writeFileSync('verification/results/p14-solid-boundaries.json',JSON.stringify(report,null,2));
for(const kind of ['knot','decay']){
 const p=defaultCase();p.soil='Fixed';p.diameters={butt:.3,ground:.3,tip:.3};const r=newRegion(p,kind);r.zMin=1.9;r.zMax=2.1;
 if(kind==='decay'){r.shape.centreX=r.shape.centreY=0;r.decay={pattern:'heart',progression:'source',sourceZ:2,exponent:2,shellDepth:.03};}
 p.regions=[r];const original=volumeMesh(p,'coarse',1),D=orthotropicD(p.material.E),probes=[[.1,0,2],[-.1,0,2],[.06,.04,2],[.1,0,1.8],[.1,0,2.2]];
 for(const extension of [0,.3,.6]){
  const mesh=extendMesh(original,p,extension),keys=new Set(mesh.points.map(q=>q.map(v=>v.toFixed(11)).join(','))),preserved=original.points.every(q=>keys.has(q.map(v=>v.toFixed(11)).join(','))),loads=curvedEndLoads(mesh,[1000,0,0],[1000*(p.length-p.embedment-mesh.zMax),0]).loads,bc=new Map(mesh.bottom.flatMap(n=>[0,1,2].map(k=>[3*n+k,0]))),s=solveCurved(mesh,x=>materialAt(p,...x),loads,bc),recovery=prepareRecovery(mesh,s.displacements,D,p),field={...recovery,elements:mesh.tets.length,zMin:mesh.zMin,zMax:mesh.zMax};
  const row={kind,extension,preserved,nodes:mesh.points.length,elements:mesh.tets.length,residual:s.relativeResidual,probes,MPa:probes.map(q=>{const v=localStressAt(field,...q);return v===null?null:v/1e6;}),ms:s.elapsedMs};report.rows.push(row);save();console.log(JSON.stringify(row));
 }
 const rows=report.rows.filter(q=>q.kind===kind),a=rows[1],b=rows[2],changes=b.MPa.map((v,i)=>v===null||a.MPa[i]===null?null:Math.abs(v/a.MPa[i]-1));report.assessments.push({kind,changes,passed:rows.every(q=>q.preserved)&&changes.every(v=>v!==null&&v<report.gate),capacityQualified:false,physicalValidation:false});save();
}
