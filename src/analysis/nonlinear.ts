import {bendingResistance} from '../domain/species.ts';
import {conditionAt,diameterAt,loadApplicationHeight,type PoleCase} from '../domain/model.ts';
import {hermite,sectionProperties,solvePole,type AnalysisResult,type Station} from './beam.ts';
import {soilYieldStudy} from './research/soilYield.ts';
export const yielding=(p:PoleCase)=>p.soilResponse==='yielding'&&p.soil!=='Fixed';
export function loadPath(p:PoleCase):[number,number][]{const a=p.bearing*Math.PI/180,current:[number,number]=[1000*p.loadKN*Math.sin(a),1000*p.loadKN*Math.cos(a)],out:[number,number][]=[];for(const q of [...(p.soilHistory??[]),current])if(!out.length||Math.hypot(q[0]-out.at(-1)![0],q[1]-out.at(-1)![1])>1e-7)out.push(q);return out;}
export function structuralKey(p:PoleCase){const {loadKN,bearing,soilHistory,axonic,gridManager,...rest}=p;return JSON.stringify(rest);}
export function resetHistoryOnGeometry(previous:PoleCase,next:PoleCase){return structuralKey(previous)===structuralKey(next)?next:{...next,soilHistory:[]};}
/** The nonlinear result uses one solved displacement field throughout. Elastic
 * reference loads are explicitly retained as references, never nonlinear capacity. */
export function solveNonlinearPole(p:PoleCase,segments=32):AnalysisResult{
 if(!yielding(p))return solvePole(p,segments);const path=loadPath(p);if(path.length>64)throw Error('Ground history is full. Reset ground history before continuing.');const s=soilYieldStudy(p,path,segments,12),r=s.rows.at(-1)!,zs=r.z,u=r.displacements,reference=solvePole({...p,loadKN:1},segments),stations:Station[]=[];let maxRotation=0,usage=0,timberZ=0,soilMovement=0;
 for(let i=0;i<zs.length;i++){maxRotation=Math.max(maxRotation,Math.hypot(u[4*i+1],u[4*i+3]));if(zs[i]<0)soilMovement=Math.max(soilMovement,Math.hypot(u[4*i],u[4*i+2]));}
 for(let e=0;e<zs.length-1;e++)for(const t of [0,.5,1]){if(t===0&&e>0)continue;const L=zs[e+1]-zs[e],z=zs[e]+t*L,{H,B}=hermite(t,L),ix=[4*e,4*e+1,4*e+4,4*e+5],iy=ix.map(i=>i+2),dot=(v:number[],ids:number[])=>v.reduce((a,b,i)=>a+b*u[ids[i]],0),q={...sectionProperties(p,z),z,ux:dot(H,ix),uy:dot(H,iy),kx:dot(B,ix),ky:dot(B,iy),stressMin:0,stressMax:0,usage:0};
  for(let ri=1;ri<=12;ri++)for(let k=0;k<64;k++){const a=k*Math.PI/32,R=diameterAt(p,z)/2,x=R*ri/12*Math.cos(a),y=R*ri/12*Math.sin(a),c=conditionAt(p,x,y,z);if(c.voided)continue;const stress=-p.material.E*c.e*((x-q.cx)*q.kx+(y-q.cy)*q.ky);q.stressMin=Math.min(q.stressMin,stress);q.stressMax=Math.max(q.stressMax,stress);q.usage=Math.max(q.usage,Math.abs(stress)/(bendingResistance(p.material,stress,c)));}
  if(q.usage>usage){usage=q.usage;timberZ=z;}stations.push(q);
 }
 const loadZ=loadApplicationHeight(p),forceError=Math.hypot(r.reaction[0]+r.load[0],r.reaction[1]+r.load[1]),momentError=Math.hypot(r.moment[0]+r.load[0]*loadZ,r.moment[1]+r.load[1]*loadZ);if(forceError>.001||momentError>.01)throw Error('Nonlinear force/moment balance failed; result withheld.');
 const warnings=reference.warnings.filter(w=>!w.startsWith('Rotation exceeds'));warnings.push('Ground yields with loading history. Limit loads and capacity curves are elastic references, not nonlinear capacities.');if(maxRotation>.15)warnings.push('Rotation exceeds the small-deflection range. Numerical results are extrapolated.');
 return {...reference,version:'beam-p16',elapsedMs:s.elapsedMs,nodes:zs.length,kinematics:zs.map((z,i)=>({z,ux:u[4*i],rx:u[4*i+1],uy:u[4*i+2],ry:u[4*i+3]})),stations,tipX:r.tip[0],tipY:r.tip[1],tipMovement:Math.hypot(...r.tip),reactionX:r.reaction[0],reactionY:r.reaction[1],momentX:-r.moment[1],momentY:r.moment[0],balance:forceError/Math.max(1,Math.hypot(...r.load)),maxRotation,soilMovement,utilisation:usage,timberZ,governingZ:timberZ,governing:'Timber bending',warnings,nonlinear:{path,plasticDepths:r.plasticDepths,plasticSlip:r.maxPlasticSlip,dissipation:r.dissipation,residualTip:p.loadKN===0?Math.hypot(...r.tip):0,referenceLimits:true},basis:'Biaxial elastic beam with history-dependent elastoplastic soil. One displacement/stress field; illustrative properties. Reported limit loads are elastic reference loads; nonlinear collapse and timber fracture are not assessed.'};
}
