import fs from 'node:fs';import assert from 'node:assert/strict';
import {defaultCase} from '../../src/domain/model.ts';
import {poleMesh} from '../../src/analysis/solid/mesh.ts';
import {curveMesh,curvedEndLoads,solveCurved,mappedPoint,volumeRule} from '../../src/analysis/solid/curved.ts';
import {orthotropicD,geometry} from '../../src/analysis/solid/kernel.ts';
import {prepareRecovery,recoverCurved} from '../../src/analysis/solid/curvedRecovery.ts';
import {solveCurvedLocal} from '../../src/analysis/solid/curvedField.ts';
import {localStressAt,localValue} from '../../src/analysis/solid/field.ts';
const checks=[];function check(name,condition,value){assert.ok(condition,name+': '+value);checks.push({name,value});}
const p=defaultCase();p.diameters={butt:.3,ground:.3,tip:.3};p.regions=[{id:'cavity',name:'Hollow',kind:'void',zMin:1.6,zMax:2.2,severity:1,shape:{type:'ellipse',centreX:.02,centreY:0,radiusX:.06,radiusY:.07,angle:0,profile:'rounded'},provenance:'synthetic'}];
const m=curveMesh(poleMesh(p,{angular:8,axial:4,radial:1,marginDiameters:2,capRadial:2}),p,true),D=orthotropicD(p.material.E),end=curvedEndLoads(m,[1000,0,0],[1000*(p.length-p.embedment-m.zMax),0]),fixed=new Map(m.bottom.flatMap(n=>[0,1,2].map(k=>[n*3+k,0]))),s=solveCurved(m,D,end.loads,fixed),recovery=prepareRecovery(m,s.displacements,D);
const field={version:'solid-p07',zMin:m.zMin,zMax:m.zMax,defectMin:1.6,defectMax:2.2,elements:m.tets.length,...recovery};
let error=0,globalError=0,missing=0,boundsMisses=0;const samples=[];
for(let el=0;el<m.tets.length;el++)for(const L of [[.1,.2,.3,.4],[.43,.17,.11,.29]]){
 const ns=m.tets[el],ps=ns.map(n=>m.points[n]),q=mappedPoint(ps,L),u=ns.flatMap(n=>Array.from(s.displacements.slice(n*3,n*3+3))),strain=q.B.map(row=>row.reduce((v,b,i)=>v+b*u[i],0)),sigma=D[2].reduce((v,d,i)=>v+d*strain[i],0)*m.factors[el];
 const b=field.bounds.subarray(el*6,el*6+6);if(q.x.some((v,k)=>v<b[k]-1e-12||v>b[k+3]+1e-12))boundsMisses++;
 const inv=geometry(m.points,ns).inv,initial=[1,2,3].map(k=>inv[0][k]+q.x[0]*inv[1][k]+q.x[1]*inv[2][k]+q.x[2]*inv[3][k]),got=recoverCurved(recovery.curved,el,...q.x,initial),whole=localStressAt(field,...q.x);if(got===null||whole===null){missing++;continue;}error=Math.max(error,Math.abs(got-sigma));globalError=Math.max(globalError,Math.abs(whole-sigma));if(el%40===0)samples.push({el,L,point:q.x,stress:whole});
}
check('All curved interior points located',missing===0,missing);check('Bernstein bounds contain curved samples',boundsMisses===0,boundsMisses);check('Polynomial recovery matches B-matrix recovery',error<.02,error);check('Spatial locator matches element recovery',globalError<.02,globalError);
check('No material in hollow',localValue(p,field,.02,0,1.9,'stress')===null,'null');check('Outside solid not extrapolated',localStressAt(field,.2,0,1.9)===null,'null');check('Outside axial domain unavailable',localStressAt(field,0,0,m.zMax+.01)===null,'null');
const point=[.115,0,1.9],unit=localValue(p,field,...point,'stress'),scaled=localValue({...p,loadKN:7},field,...point,'stress');check('Cached magnitude scales exactly',Math.abs(scaled-7*unit)<1e-8,scaled);check('Zero load',localValue({...p,loadKN:0},field,...point,'stress')===0,0);
const small={angular:8,axial:4,radial:1,marginDiameters:2,capRadial:2};
const sound=solveCurvedLocal({...p,regions:p.regions.map(r=>({...r,kind:'decay',severity:0}))},'coarse',small),decayed=solveCurvedLocal({...p,regions:p.regions.map(r=>({...r,kind:'decay',severity:.7}))},'coarse',small);
check('Decay increases elastic compliance',sound.energy<decayed.energy&&decayed.energy<s.energy,[sound.energy,decayed.energy,s.energy]);
check('Decayed core retains a solved stress',localStressAt(decayed,.02,0,1.9)!==null,localStressAt(decayed,.02,0,1.9));
let rejected=false;try{solveCurvedLocal({...p,regions:p.regions.map(r=>({...r,kind:'knot'}))},'coarse',small);}catch{rejected=true;}check('Unsupported knot is rejected',rejected,rejected);
const start=performance.now();let count=0;for(let j=0;j<64;j++)for(let i=0;i<64;i++){const x=(i/63-.5)*.3,y=(j/63-.5)*.3;if(x*x+y*y<.15**2){localValue(p,field,x,y,1.9,'stress');count++;}}const sampleMs=performance.now()-start;
fs.writeFileSync('verification/p07/reference-input.json',JSON.stringify({case:p,mesh:m,D,loads:Array.from(end.loads),fixed:Array.from(fixed),solution:{u:Array.from(s.displacements),centroidStress:s.centroidStress,energy:s.energy},samples,quadratureOrder:4}));
fs.writeFileSync('verification/results/p07-recovery.json',JSON.stringify({checks,sampleMs,samples:count,nodes:m.points.length,elements:m.tets.length,solveMs:s.elapsedMs},null,2));console.log(checks.length+' P07 checks passed; '+count+' probes in '+sampleMs.toFixed(0)+' ms');
