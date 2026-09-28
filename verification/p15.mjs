import {writeFileSync} from 'node:fs';
import {defaultCase,newRegion} from '../src/domain/model.ts';
import {EDGES,orthotropicD} from '../src/analysis/solid/kernel.ts';
import {prepareRecovery,recoverCurvedTensor} from '../src/analysis/solid/curvedRecovery.ts';
import {mappedPoint} from '../src/analysis/solid/curved.ts';
import {fibreStresses,fibreAxisAt,materialAt} from '../src/analysis/solid/material.ts';
import {displayedStress,localTensorAt,localValue} from '../src/analysis/solid/field.ts';
import {assessSolid} from '../src/analysis/solid/assessment.ts';
const checks=[],check=(name,pass,data)=>{checks.push({name,pass,data});if(!pass)throw Error(name+JSON.stringify(data));},close=(name,a,b,t=1e-5)=>check(name,Math.abs(a-b)<t,{a,b});
const p=defaultCase(),corners=[[0,0,.9],[.12,0,.9],[0,.12,.9],[0,0,1.1]],points=[...corners,...EDGES.map(([a,b],j)=>corners[a].map((v,k)=>(v+corners[b][k])/2+(j===0&&k===1?.005:0)))],mesh={points,tets:[points.map((_,i)=>i)],factors:[.7],surface:[],bottom:[],top:[],zMin:.9,zMax:1.1},G=[[.001,.0002,.0003],[.0004,-.0005,.0006],[.0007,.0008,.0009]],strain=[.001,-.0005,.0009,.0006,.0014,.001],D=orthotropicD(p.material.E),u=Float64Array.from(points.flatMap(x=>G.map(row=>row.reduce((v,g,i)=>v+g*x[i],0)))),rec=prepareRecovery(mesh,u,D),field={...rec,elements:1,zMin:.9,zMax:1.1,defectMin:.9,defectMax:1.1};
for(const L of [[.25,.25,.25,.25],[.1,.3,.4,.2]]){const q=mappedPoint(points,L).x,got=recoverCurvedTensor(rec.curved,0,...q,L.slice(1)),located=localTensorAt(field,...q);for(let i=0;i<6;i++){const expected=D[i].reduce((v,d,k)=>v+d*strain[k],0)*.7;close(`Curved affine tensor component ${i} at ${L}`,got[i],expected);close(`Located tensor component ${i} at ${L}`,located[i],expected);}}
const rotated=fibreStresses([10,20,30,4,5,6],[0,0,1]);close('Along fibre normal traction',rotated.longitudinal,30);close('Fibre shear traction magnitude',rotated.shear,Math.hypot(5,6));close('Transverse principal maximum',rotated.transverseMax,15+Math.hypot(5,4));
const isotropic=fibreStresses([12,12,12,0,0,0],[.6,0,.8]);close('Hydrostatic stress rotation invariant',isotropic.longitudinal,12);close('Hydrostatic stress has zero fibre shear',isotropic.shear,0);
const knot=newRegion(p,'knot');p.regions=[knot];const axis=fibreAxisAt(p,knot.shape.centreX,0,1);close('Prescribed knot axis rotates 45 degrees',axis[2],Math.SQRT1_2);
const variable=prepareRecovery({...mesh,factors:[1]},u,D,p),at=mappedPoint(points,[.25,.25,.25,.25]).x,tensor=recoverCurvedTensor(variable.curved,0,...at,[.25,.25,.25]),Dm=materialAt(p,...at);for(let i=0;i<6;i++)close(`Spatial knot tensor ${i}`,tensor[i],Dm[i].reduce((v,d,k)=>v+d*strain[k],0));
check('Beam-only transverse stress is unavailable',displayedStress(p,{z:1},0,0,1,'transverse',null)===null);
const assessment=assessSolid(p,{...field,curved:variable.curved});check('Assessment records sampled governing location',assessment.sampleCount===1&&assessment.governing?.point.length===3);check('Assessment never promotes capacity',assessment.status==='preliminary'&&assessment.capacityQualified===false);check('Unprovided shear criterion remains unassessed',assessment.unassessed.includes('Shear strength criterion'));
const point=mappedPoint(points,[.25,.25,.25,.25]).x,raw=localTensorAt(field,...point)[2],loaded={...p,loadKN:3};close('Actual-load field is not scaled again',localValue(loaded,{...field,actualLoad:true},...point,'stress'),raw);close('Unit field retains exact load scaling',localValue(loaded,field,...point,'stress'),raw*3);
writeFileSync('verification/results/p15.json',JSON.stringify({checks,assessment,scope:'Tensor recovery, fibre transformation and preliminary screening. Not physical capacity qualification.'},null,2));console.log(`${checks.length} P15 stress checks passed.`);
