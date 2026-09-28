import {writeFileSync} from 'node:fs';
import * as T from 'three';
import {defaultCase,newRegion} from '../src/domain/model.ts';
import {placeholderAssessment} from '../src/inspection/placeholder.ts';
import {solvePole} from '../src/analysis/beam.ts';
import {stressSurface} from '../src/scene/stressSurface.ts';
import {soilReturn,soilYieldStudy} from '../src/analysis/research/soilYield.ts';
const checks=[],check=(name,pass,data)=>{checks.push({name,pass,data});if(!pass)throw Error(name+JSON.stringify(data));};
const close=(name,a,b,tol=1e-8)=>check(name,Math.abs(a-b)<=tol,{a,b,tol});
const p=defaultCase();p.diameters={butt:.32,ground:.32,tip:.32};
close('Sound reference is explicitly 35 MPa',placeholderAssessment(p,.3).fibreStrengthMPa,35);
const d=newRegion(p);d.shape={type:'ellipse',centreX:0,centreY:0,radiusX:1,radiusY:1,angle:0,profile:'constant'};d.zMin=0;d.zMax=1;d.severity=.5;
close('MPa retains the existing percentage strength law',placeholderAssessment({...p,regions:[d]},.3).fibreStrengthMPa,35*.525);
d.kind='void';check('Empty section has no MPa value',placeholderAssessment({...p,regions:[d]},.3).fibreStrengthMPa===null);
const b=solvePole(p),group=stressSurface(p,b,0,'stress',null,false),mesh=group.children[0];group.updateMatrixWorld(true);
for(let k=0;k<12;k++){const a=(k+.2)*Math.PI/6,origin=new T.Vector3(Math.cos(a),1,Math.sin(a)),ray=new T.Raycaster(origin,new T.Vector3(-Math.cos(a),0,-Math.sin(a)));check(`Complete stress circumference at ${k*30} degrees`,ray.intersectObject(mesh).length>0);}
for(const end of ['tip','butt']){const tip=end==='tip',z=tip?p.length-p.embedment:-p.embedment;check(`${end} has a stress end face`,new T.Raycaster(new T.Vector3(.05,z+(tip?1:-1),.02),new T.Vector3(0,tip?-1:1,0)).intersectObject(mesh).length>0);}
mesh.geometry.dispose();mesh.material.dispose();
let r=soilReturn([.003,.004],[0,0],1e6,2000);
close('Radial yield force reaches circular resistance',Math.hypot(...r.force),2000);
close('Plastic dissipation is resistance times slip',r.dissipation,6);
const held=[.001,-.002],y=[.01,.02],base=soilReturn(y,held,1e6,2000);
for(let j=0;j<2;j++){const plus=[...y],minus=[...y];plus[j]+=1e-7;minus[j]-=1e-7;const a=soilReturn(plus,held,1e6,2000),b=soilReturn(minus,held,1e6,2000);for(let i=0;i<2;i++)close(`Consistent plastic tangent ${i}${j}`,(a.force[i]-b.force[i])/2e-7,base.tangent[i*2+j],.002);}
close('Trial return does not mutate committed slip',held[0],.001);
const unload=soilReturn([.003,.004],r.plastic,1e6,2000);close('Repeated equilibrium state adds no plastic work',unload.dissipation,0);
const path=[[1000,0],[3000,0],[0,0],[-3000,0],[0,0]],study=soilYieldStudy(p,path,32),fine=soilYieldStudy(p,[[3000,0]],64),rotation=soilYieldStudy(p,[[1800,2400]],32);
close('Elastic foundation agrees with existing beam FE',study.rows[0].tip[0],b.tipX,.0001);
check('Yielding increases movement above linear scaling',study.rows[1].tip[0]>3*b.tipX*1.03);
check('Yielding leaves residual deflection after unloading',study.rows[2].tip[0]>.01);
check('Reversed load changes residual deflection sign',study.rows[4].tip[0]<-.01);
check('Dissipation never decreases along load history',study.rows.every((r,i)=>i===0||r.dissipation>=study.rows[i-1].dissipation-1e-8));
close('Rotation invariance after yielding',Math.hypot(...rotation.rows[0].tip),study.rows[1].tip[0],1e-5);
close('Rotation preserves direction',rotation.rows[0].tip[0]/rotation.rows[0].tip[1],.75,1e-6);
close('Soil mesh refinement tip displacement',fine.rows[0].tip[0],study.rows[1].tip[0],.003);
for(const [i,row] of study.rows.entries()){close(`Load path force equilibrium ${i}`,row.reaction[0]+row.load[0],0,.001);close(`Load path moment equilibrium ${i}`,row.moment[0]+row.load[0]*(p.length-p.embedment),0,.01);check(`No false successful residual ${i}`,row.residual<.001);}
let rejected=false;try{soilYieldStudy(p,[[100000,0]],24);}catch{rejected=true;}check('Unrestrained overload is rejected, not reported as capacity',rejected);
writeFileSync('verification/results/p14.json',JSON.stringify({checks,soil:{inputs:p,path,study,fine,rotation},scope:'Display geometry, placeholder conversion, research elastoplastic foundation. No timber failure or field validation.'},null,2));
console.log(`${checks.length} P14 checks passed. Soil research ${study.elapsedMs.toFixed(0)} ms.`);
