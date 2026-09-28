import fs from 'node:fs';
import assert from 'node:assert/strict';
import {defaultCase,conditionAt} from '../../src/domain/model.ts';
import {poleMesh,endLoads,RESOLUTIONS} from '../../src/analysis/solid/mesh.ts';
import {orthotropicD,solveSolid} from '../../src/analysis/solid/kernel.ts';
import {solveLocal,localStressAt,localValue} from '../../src/analysis/solid/field.ts';
const p=defaultCase();p.soil='Fixed';p.diameters={butt:.3,ground:.3,tip:.3};p.regions=[{id:'cavity',name:'Enclosed hollow',kind:'void',zMin:1.6,zMax:2.2,severity:1,shape:{type:'ellipse',centreX:.02,centreY:0,radiusX:.06,radiusY:.07,angle:0,profile:'rounded'},provenance:'synthetic'}];
const field=solveLocal(p),m=poleMesh(p,RESOLUTIONS.coarse),f=endLoads(m,[1000,1000*Math.cos(Math.PI/2),0],[1000*(p.length-p.embedment-m.zMax),1000*Math.cos(Math.PI/2)*(p.length-p.embedment-m.zMax)]),bc=new Map(m.bottom.flatMap(n=>[0,1,2].map(k=>[3*n+k,0]))),s=solveSolid(m,orthotropicD(p.material.E),f,bc),checks=[];
function check(name,value,limit){assert.ok(value<=limit,`${name}: ${value}`);checks.push({name,value,limit});}
let worst=0;for(let i=0;i<m.tets.length;i+=17){const point=[0,1,2].map(k=>m.tets[i].slice(0,4).reduce((v,n)=>v+m.points[n][k]/4,0)),stress=localStressAt(field,...point);assert.notEqual(stress,null);worst=Math.max(worst,Math.abs(stress-s.centroidStress[i][2]));}check('Unaveraged field sampling vs element recovery (Pa)',worst,1e-5);
check('Hollow has no stress',localValue(p,field,.02,0,1.9,'stress')===null?0:1,0);check('Outside submodel unavailable',localStressAt(field,0,0,7)===null?0:1,0);
const sample=[.115,0,1.9],base=localValue(p,field,...sample,'stress');assert.notEqual(base,null);const high={...p,loadKN:7},zero={...p,loadKN:0};check('Cached field load scaling',Math.abs(localValue(high,field,...sample,'stress')-7*base),1e-8);check('Zero stress without zero-load division',Math.abs(localValue(zero,field,...sample,'stress')),0);const sigma=localValue(p,field,...sample,'stress'),usage=localValue(p,field,...sample,'utilisation'),c=conditionAt(p,...sample);check('Sign-dependent local utilisation',Math.abs(usage-Math.abs(sigma)/((sigma>=0?p.material.tension:p.material.compression)*c.strength)),1e-12);
// Rotate the existing discretisation, preserving its tetrahedron diagonals.
const rotatedMesh={...m,points:m.points.map(([x,y,z])=>[-y,x,z])},rf=endLoads(rotatedMesh,[0,1000,0],[0,1000*(p.length-p.embedment-m.zMax)]),rs=solveSolid(rotatedMesh,orthotropicD(p.material.E),rf,bc);check('Rigid rotation of mesh, material symmetry and load',Math.abs(rs.energy-s.energy)/s.energy,1e-6);
fs.writeFileSync('verification/results/p05-field.json',JSON.stringify({checks,scope:'Linear field, indexing, load scaling and orientation checks; not physical validation.'},null,2));console.log(`${checks.length} field checks passed.`);
