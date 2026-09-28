import type {PoleCase} from '../../domain/model.ts';
import type {SolidField} from './field.ts';
import {poleMesh,RESOLUTIONS,type Resolution} from './mesh.ts';
import {orthotropicD} from './kernel.ts';
import {curveMesh,curvedEndLoads,solveCurved,mappedPoint} from './curved.ts';
import {prepareRecovery} from './curvedRecovery.ts';

export function solveCurvedLocal(p:PoleCase,level='coarse',override?:Resolution):SolidField{
  const started=performance.now(),m=curveMesh(poleMesh(p,{...(override??RESOLUTIONS[level]??RESOLUTIONS.coarse),capRadial:override?.capRadial??({coarse:2,medium:3,fine:4}[level]??2)}),p,true),a=p.bearing*Math.PI/180,fx=1000*Math.sin(a),fy=1000*Math.cos(a),lever=p.length-p.embedment-m.zMax,D=orthotropicD(p.material.E),end=curvedEndLoads(m,[fx,fy,0],[fx*lever,fy*lever]),fixed=new Map(m.bottom.flatMap(n=>[0,1,2].map(k=>[n*3+k,0] as [number,number]))),s=solveCurved(m,D,end.loads,fixed),recovery=prepareRecovery(m,s.displacements,D);
  let peak=0;m.tets.forEach((ns,i)=>{const z=mappedPoint(ns.map(n=>m.points[n]),[.25,.25,.25,.25]).x[2];if(z>=p.regions[0].zMin&&z<=p.regions[0].zMax)peak=Math.max(peak,Math.abs(s.centroidStress[i][2]));});
  return {version:'solid-p07',zMin:m.zMin,zMax:m.zMax,defectMin:p.regions[0].zMin,defectMax:p.regions[0].zMax,resolution:level,nodes:m.points.length,elements:m.tets.length,elapsedMs:performance.now()-started,iterations:s.iterations,residual:s.relativeResidual,energy:s.energy,...recovery,longitudinal:new Float64Array(0),sampledPeakPa:peak,basis:'Curved T10 one-way force-driven solid preview. Exact element-local recovery; no nodal smoothing. Illustrative elasticity; local failure measures and boundary qualification incomplete. Capacity remains beam-based.'};
}
