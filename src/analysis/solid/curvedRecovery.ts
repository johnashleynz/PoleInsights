import {materialAt} from './material.ts';
import type {PoleCase} from '../../domain/model.ts';
import {EDGES,geometry,type SolidMesh} from './kernel.ts';

export interface CurvedRecovery {coefficients:Float64Array;elastic:Float64Array;materialPole?:PoleCase;constitutive?:Float64Array;factors?:Float64Array}
/** Exact quadratic power coefficients, not sampled or smoothed stresses. */
export function polynomial(v:number[]){
  return [v[0],4*v[4]-3*v[0]-v[1],4*v[6]-3*v[0]-v[2],4*v[7]-3*v[0]-v[3],
    2*(v[0]+v[1]-2*v[4]),2*(v[0]+v[2]-2*v[6]),2*(v[0]+v[3]-2*v[7]),
    4*(v[0]-v[4]-v[6]+v[5]),4*(v[0]-v[4]-v[7]+v[8]),4*(v[0]-v[6]-v[7]+v[9])];
}
export function prepareRecovery(mesh:SolidMesh,u:ArrayLike<number>,D:number[][],materialPole?:PoleCase){
  const coefficients=new Float64Array(mesh.tets.length*60),elastic=new Float64Array(mesh.tets.length*3),bounds=new Float64Array(mesh.tets.length*6),inverses=new Float64Array(mesh.tets.length*16);
  mesh.tets.forEach((ns,i)=>{const points=ns.map(n=>mesh.points[n]);inverses.set(geometry(mesh.points,ns).inv.flat(),i*16);
    for(let k=0;k<3;k++){
      coefficients.set(polynomial(points.map(p=>p[k])),i*60+k*10);coefficients.set(polynomial(ns.map(n=>u[n*3+k])),i*60+30+k*10);elastic[i*3+k]=D[2][k]*mesh.factors[i];
      // Bernstein control hull bounds the entire curved element, including bulges
      // beyond its nodal bounding box. These controls do not change the FE mesh.
      const controls=[...points.slice(0,4).map(p=>p[k]),...EDGES.map(([a,b],j)=>2*points[4+j][k]-(points[a][k]+points[b][k])/2)];bounds[i*6+k]=Math.min(...controls);bounds[i*6+3+k]=Math.max(...controls);
    }
  });return {curved:{coefficients,elastic,constitutive:Float64Array.from(D.flat()),factors:Float64Array.from(mesh.factors),...(materialPole?{materialPole}:{})},bounds,inverse:inverses};
}
function value(c:Float64Array,o:number,r:number,s:number,t:number){return c[o]+c[o+1]*r+c[o+2]*s+c[o+3]*t+c[o+4]*r*r+c[o+5]*s*s+c[o+6]*t*t+c[o+7]*r*s+c[o+8]*r*t+c[o+9]*s*t;}
function derivative(c:Float64Array,o:number,r:number,s:number,t:number){return [c[o+1]+2*c[o+4]*r+c[o+7]*s+c[o+8]*t,c[o+2]+2*c[o+5]*s+c[o+7]*r+c[o+9]*t,c[o+3]+2*c[o+6]*t+c[o+8]*r+c[o+9]*s];}
function inverse3(a:number[]){const [A,B,C,D,E,F,G,H,I]=a,det=A*(E*I-F*H)-B*(D*I-F*G)+C*(D*H-E*G);if(Math.abs(det)<1e-17)return null;return [(E*I-F*H)/det,(C*H-B*I)/det,(B*F-C*E)/det,(F*G-D*I)/det,(A*I-C*G)/det,(C*D-A*F)/det,(D*H-E*G)/det,(B*G-A*H)/det,(A*E-B*D)/det];}
/** Newton inverse map with a residual line search and explicit containment.
 * Stress is differentiated from solved quadratic displacements at that point. */
export function recoverCurvedTensor(data:CurvedRecovery,el:number,x:number,y:number,z:number,initial:number[]):number[]|null{
  const c=data.coefficients,o=el*60,target=[x,y,z];let [r,s,t]=initial,inv:number[]|null=null,converged=false;
  for(let step=0;step<14;step++){
    const residual=[0,1,2].map(k=>value(c,o+k*10,r,s,t)-target[k]),norm=Math.hypot(...residual),J=[0,1,2].flatMap(k=>derivative(c,o+k*10,r,s,t));inv=inverse3(J);if(!inv)return null;
    if(norm<1e-10){converged=true;break;}
    const delta=[0,1,2].map(k=>inv![k*3]*residual[0]+inv![k*3+1]*residual[1]+inv![k*3+2]*residual[2]);let alpha=1,accepted=false;
    for(let back=0;back<8;back++){const rr=r-alpha*delta[0],ss=s-alpha*delta[1],tt=t-alpha*delta[2],next=Math.hypot(...[0,1,2].map(k=>value(c,o+k*10,rr,ss,tt)-target[k]));if(next<norm){r=rr;s=ss;t=tt;accepted=true;break;}alpha*=.5;}if(!accepted)return null;
  }
  if(!converged||!inv||[1-r-s-t,r,s,t].some(v=>v< -1e-7||v>1+1e-7))return null;
  const grad=[0,1,2].map(k=>{const d=derivative(c,o+30+k*10,r,s,t);return [0,1,2].map(j=>d[0]*inv![j]+d[1]*inv![3+j]+d[2]*inv![6+j]);});const strain=[grad[0][0],grad[1][1],grad[2][2],grad[0][1]+grad[1][0],grad[1][2]+grad[2][1],grad[0][2]+grad[2][0]];if(data.materialPole)return materialAt(data.materialPole,x,y,z).map(row=>row.reduce((sum,v,i)=>sum+v*strain[i],0));if(!data.constitutive)return null;return Array.from({length:6},(_,j)=>strain.reduce((sum,v,k)=>sum+data.constitutive![j*6+k]*v,0)*(data.factors?.[el]??1));
}

export function recoverCurved(data:CurvedRecovery,el:number,x:number,y:number,z:number,initial:number[]):number|null{return recoverCurvedTensor(data,el,x,y,z,initial)?.[2]??null;}
