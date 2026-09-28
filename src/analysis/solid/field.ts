import type {SolidAssessment} from './assessment.ts';
import {fibreAxisAt,fibreStresses} from './material.ts';
import {recoverCurved,recoverCurvedTensor,type CurvedRecovery} from './curvedRecovery.ts';
import type {Station} from '../beam.ts';
import {stressAt,utilisationAt} from '../beam.ts';
import type {PoleCase,StressDisplay} from '../../domain/model.ts';
import {conditionAt,diameterAt} from '../../domain/model.ts';
import {poleMesh,endLoads,RESOLUTIONS,type Resolution} from './mesh.ts';
import {geometry,orthotropicD,solveSolid,stress,type Vec3} from './kernel.ts';
export interface SolidField {actualLoad?:boolean;assessment?:SolidAssessment;diagnostics?:{forceBalanceN:number;momentBalanceNm:number;relativeWorkError:number};version:'solid-p05'|'solid-p07'|'solid-p09';patch?:{bearing:number;back:number;halfWidth:number;centre:number;halfHeight:number};curved?:CurvedRecovery;zMin:number;zMax:number;defectMin:number;defectMax:number;resolution:string;nodes:number;elements:number;elapsedMs:number;iterations:number;residual:number;energy:number;bounds:Float64Array;inverse:Float64Array;longitudinal:Float64Array;sampledPeakPa:number;basis:string}
/** Independent force-driven local submodel, no added beam stiffness/stress and
 * no feedback to the whole-pole capacity. Unit horizontal load is 1 kN. */
export function solveLocal(p:PoleCase,level='coarse',override?:Resolution):SolidField {
 const started=performance.now(),m=poleMesh(p,override??RESOLUTIONS[level]??RESOLUTIONS.coarse),a=p.bearing*Math.PI/180,fx=1000*Math.sin(a),fy=1000*Math.cos(a),lever=p.length-p.embedment-m.zMax,D=orthotropicD(p.material.E),loads=endLoads(m,[fx,fy,0],[fx*lever,fy*lever]),bc=new Map<number,number>(m.bottom.flatMap(n=>[0,1,2].map(k=>[3*n+k,0] as [number,number]))),s=solveSolid(m,D,loads,bc),bounds=new Float64Array(m.tets.length*6),inverses=new Float64Array(m.tets.length*16),longitudinal=new Float64Array(m.tets.length*4);let peak=0;
 m.tets.forEach((ns,i)=>{const {inv}=geometry(m.points,ns),corners=ns.slice(0,4).map(n=>m.points[n]),u=Float64Array.from(ns.flatMap(n=>[3*n,3*n+1,3*n+2]),j=>s.displacements[j]);inverses.set(inv.flat(),i*16);for(let k=0;k<3;k++){bounds[6*i+k]=Math.min(...corners.map(p=>p[k]));bounds[6*i+3+k]=Math.max(...corners.map(p=>p[k]));}for(let k=0;k<4;k++){const sigma=stress(inv,[0,1,2,3].map(j=>+(j===k)),D,u,m.factors[i])[2];longitudinal[4*i+k]=sigma;}const z=corners.reduce((v,p)=>v+p[2]/4,0);if(z>=p.regions[0].zMin&&z<=p.regions[0].zMax)peak=Math.max(peak,Math.abs(s.centroidStress[i][2]));});
 return {version:'solid-p05',zMin:m.zMin,zMax:m.zMax,defectMin:p.regions[0].zMin,defectMax:p.regions[0].zMax,resolution:level,nodes:m.points.length,elements:m.tets.length,elapsedMs:performance.now()-started,iterations:s.iterations,residual:s.relativeResidual,energy:s.energy,bounds,inverse:inverses,longitudinal,sampledPeakPa:peak,basis:'One-way force-driven T10 solid submodel. Illustrative transverse elasticity. Faceted geometry; mesh/boundary qualification incomplete. Longitudinal stress only in this view; no solid-based capacity.'};
}
interface Index {bins:Map<string,number[]>;h:number}
const indices=new WeakMap<SolidField,Index>();
function index(field:SolidField){let out=indices.get(field);if(out)return out;const h=Math.max(.015,(field.zMax-field.zMin)/36),bins=new Map<string,number[]>();for(let i=0;i<field.elements;i++){const b=field.bounds.subarray(6*i,6*i+6),lo=[0,1,2].map(k=>Math.floor(b[k]/h)),hi=[0,1,2].map(k=>Math.floor(b[k+3]/h));for(let x=lo[0];x<=hi[0];x++)for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++){const key=`${x},${y},${z}`,list=bins.get(key);if(list)list.push(i);else bins.set(key,[i]);}}out={h,bins};indices.set(field,out);return out;}
/** No nodal averaging: recover the affine T10 stress in the containing element. */
export function localStressAt(field:SolidField,x:number,y:number,z:number):number|null {
 if(z<field.zMin||z>field.zMax)return null;const {h,bins}=index(field),ids=bins.get(`${Math.floor(x/h)},${Math.floor(y/h)},${Math.floor(z/h)}`);if(!ids)return null;
 for(const i of ids){const b=i*6;if(x<field.bounds[b]-1e-9||x>field.bounds[b+3]+1e-9||y<field.bounds[b+1]-1e-9||y>field.bounds[b+4]+1e-9||z<field.bounds[b+2]-1e-9||z>field.bounds[b+5]+1e-9)continue;const at=i*16,L=[0,1,2,3].map(k=>field.inverse[at+k]+x*field.inverse[at+4+k]+y*field.inverse[at+8+k]+z*field.inverse[at+12+k]);if(field.curved){const value=recoverCurved(field.curved,i,x,y,z,L.slice(1));if(value!==null)return value;continue;}if(L.some(v=>v< -1e-8||v>1+1e-8))continue;return L.reduce((v,l,k)=>v+l*field.longitudinal[i*4+k],0);}return null;
}
export function localTensorAt(field:SolidField,x:number,y:number,z:number):number[]|null {
 if(!field.curved||z<field.zMin||z>field.zMax)return null;const {h,bins}=index(field),ids=bins.get(`${Math.floor(x/h)},${Math.floor(y/h)},${Math.floor(z/h)}`);if(!ids)return null;
 for(const i of ids){const b=i*6;if(x<field.bounds[b]-1e-9||x>field.bounds[b+3]+1e-9||y<field.bounds[b+1]-1e-9||y>field.bounds[b+4]+1e-9||z<field.bounds[b+2]-1e-9||z>field.bounds[b+5]+1e-9)continue;const o=i*16,L=[1,2,3].map(k=>field.inverse[o+k]+x*field.inverse[o+4+k]+y*field.inverse[o+8+k]+z*field.inverse[o+12+k]),v=recoverCurvedTensor(field.curved,i,x,y,z,L);if(v)return v;}return null;
}
export function localValue(p:PoleCase,field:SolidField,x:number,y:number,z:number,display:StressDisplay){
 const c=conditionAt(p,x,y,z);if(c.voided)return null;if(!['stress','utilisation'].includes(display)){const tensor=localTensorAt(field,x,y,z);if(!tensor)return null;return fibreStresses(tensor,fibreAxisAt(p,x,y,z))[display as 'longitudinal'|'transverse'|'shear']*(field.actualLoad?1:p.loadKN);}const unit=localStressAt(field,x,y,z);if(unit===null)return null;const sigma=unit*(field.actualLoad?1:p.loadKN);if(display==='stress')return sigma;if(p.material.basis!=='illustrative')return null;return Math.abs(sigma)/(sigma>=0?p.material.tension*c.tension:p.material.compression*c.compression);
}

export function inLocalZone(p:PoleCase,field:SolidField,z:number){const margin=diameterAt(p,(field.defectMin+field.defectMax)/2)*.5;return z>=Math.max(field.zMin,field.defectMin-margin)&&z<=Math.min(field.zMax,field.defectMax+margin);}
export function displayedStress(p:PoleCase,station:Station|null,x:number,y:number,z:number,display:StressDisplay,field?:SolidField|null){let inside=!!field&&inLocalZone(p,field,z);if(field?.patch){const q=field.patch,a=q.bearing*Math.PI/180,u=x*Math.sin(a)+y*Math.cos(a),v=x*Math.cos(a)-y*Math.sin(a);inside=inside&&u>=q.back&&Math.abs(v)<=q.halfWidth&&Math.abs(z-q.centre)<=q.halfHeight;}if(field&&inside)return localValue(p,field,x,y,z,display);if(!station||!['stress','utilisation'].includes(display))return null;return display==='stress'?stressAt(p,station,x,y):utilisationAt(p,station,x,y);}
