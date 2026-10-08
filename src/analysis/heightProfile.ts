import {bendingResistance,strengthUsage} from '../domain/species.ts';
import {conditionAt,diameterAt,type PoleCase} from '../domain/model.ts';
import {deconditioningHeights} from '../integrations/deconditioning.ts';
import {solvePole,stationAt} from './beam.ts';
export type ProfileMetric='capacityBest'|'capacityApplied'|'usageApplied'|'usageWorst'|'capacityWorst'|'stressApplied'|'stressWorst';
export interface ProfileRow {z:number;capacityBest:number|null;capacityApplied:number|null;usageApplied:number;usageWorst:number;bestBearing:number;capacityWorst:number|null;stressApplied:number;stressWorst:number;worstBearing:number;stressWorstBearing:number}
export interface DirectionBasis {z:number;points:number[][]}
/** Linear unit responses span every horizontal direction, including buried soil response.
 * Timber bending only. The strongest direction is searched on a declared 2 degree grid.
 * The worst-direction utilisation is the exact sinusoidal envelope of sampled material points. */
export function prepareHeightProfile(p:PoleCase):DirectionBasis[]{
 const east=solvePole({...p,loadKN:1,bearing:90}),north=solvePole({...p,loadKN:1,bearing:0});
 const heights=east.stations.map(s=>s.z);for(let i=0;i<=100;i++)heights.push(-p.embedment+p.length*i/100);
 heights.push(...deconditioningHeights(p));
 for(const r of p.regions)for(let i=0;i<=8;i++)heights.push(r.zMin+(r.zMax-r.zMin)*i/8);
 return [...new Set(heights.filter(z=>z>=-p.embedment&&z<=p.length-p.embedment).map(z=>+z.toFixed(7)))].sort((a,b)=>a-b).map(z=>{
  const e=stationAt(east,z),n=stationAt(north,z),R=diameterAt(p,z)/2,points:number[][]=[];
  for(let ri=1;ri<=12;ri++)for(let k=0;k<64;k++){const a=k*Math.PI/32,x=R*ri/12*Math.cos(a),y=R*ri/12*Math.sin(a),c=conditionAt(p,x,y,z);if(c.voided)continue;points.push([-p.material.E*c.e*((x-e.cx)*e.kx+(y-e.cy)*e.ky),-p.material.E*c.e*((x-n.cx)*n.kx+(y-n.cy)*n.ky),bendingResistance(p.material,1,c),bendingResistance(p.material,-1,c)]);}
  return {z,points};
 });
}
export function profileFromBasis(basis:DirectionBasis[],bearing:number,load:number,includeBest=true):ProfileRow[]{
 const a=bearing*Math.PI/180,sa=Math.sin(a),ca=Math.cos(a),angles=Array.from({length:180},(_,i)=>[Math.sin(i*Math.PI/90),Math.cos(i*Math.PI/90)]);
 return basis.map(({z,points})=>{let applied=0,worst=0,best=Infinity,bestBearing=0,stressApplied=0,stressWorst=0,worstBearing=0,stressWorstBearing=0;const usages=new Float64Array(180);
  for(const [x,y,t,c] of points){const s=x*sa+y*ca;applied=Math.max(applied,strengthUsage(s,s>=0?t:c));const amplitude=Math.hypot(x,y),usage=strengthUsage(amplitude,Math.min(t,c));stressApplied=Math.max(stressApplied,Math.abs(s));if(amplitude>stressWorst){stressWorst=amplitude;stressWorstBearing=(Math.atan2(x,y)*180/Math.PI+360)%360;}if(usage>worst){worst=usage;const sign=c<t?-1:1;worstBearing=(Math.atan2(sign*x,sign*y)*180/Math.PI+360)%360;}if(includeBest)for(let i=0;i<180;i++){const v=x*angles[i][0]+y*angles[i][1];usages[i]=Math.max(usages[i],strengthUsage(v,v>=0?t:c));}}
  if(includeBest)usages.forEach((v,i)=>{if(v<best){best=v;bestBearing=i*2;}});
  return {z,capacityBest:includeBest&&best>1e-10?1/best:null,capacityApplied:applied>1e-10?1/applied:null,usageApplied:load===0?0:applied*load,usageWorst:load===0?0:worst*load,bestBearing,capacityWorst:worst>1e-10?1/worst:null,stressApplied:stressApplied*load/1e6,stressWorst:stressWorst*load/1e6,worstBearing,stressWorstBearing};
 });
}
