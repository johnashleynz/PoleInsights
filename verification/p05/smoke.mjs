import {defaultCase} from '../../src/domain/model.ts';
import {poleMesh,endLoads,RESOLUTIONS} from '../../src/analysis/solid/mesh.ts';
import {orthotropicD,solveSolid} from '../../src/analysis/solid/kernel.ts';
const p=defaultCase();p.soil='Fixed';p.diameters={butt:.3,ground:.3,tip:.3};p.regions=[{id:'cavity',name:'Enclosed hollow',kind:'void',zMin:1.6,zMax:2.2,severity:1,shape:{type:'ellipse',centreX:.02,centreY:0,radiusX:.06,radiusY:.07,angle:0,profile:'rounded'},provenance:'synthetic'}];
const mesh=poleMesh(p,RESOLUTIONS.coarse),loads=endLoads(mesh,[1000,0,0],[1000*(p.length-p.embedment-mesh.zMax),0]),fixed=new Map(mesh.bottom.flatMap(n=>[0,1,2].map(k=>[n*3+k,0])));
console.log({nodes:mesh.points.length,elements:mesh.tets.length});const result=solveSolid(mesh,orthotropicD(p.material.E),loads,fixed);console.log({ms:result.elapsedMs,iterations:result.iterations,residual:result.relativeResidual,physical:result.freeResidualN,energy:result.energy,peak:Math.max(...result.centroidStress.map(s=>Math.abs(s[2])))/1e6});
