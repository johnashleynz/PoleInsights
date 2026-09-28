import {decaySeverity,defectDistance,type PoleCase} from '../../domain/model.ts';
import {orthotropicD} from './kernel.ts';
export type Elasticity=number[][]|((x:number[])=>number[][]);
export const elasticAt=(D:Elasticity,x:number[])=>typeof D==='function'?D(x):D;
const pairs=[[0,0],[1,1],[2,2],[0,1],[1,2],[0,2]];
/** Rotation of transversely isotropic fourth-order elasticity. Engineering shear convention.
 * Fibre direction is prescribed by the sandbox knot, not inferred from a scan. */
export function rotateTimber(D:number[][],n:number[]){
 const lambda=D[0][1],mu=D[3][3],a=D[0][2]-lambda,c=D[4][4]-mu,b=D[2][2]-lambda-2*mu-2*a-4*c,delta=(i:number,j:number)=>+(i===j);
 return pairs.map(([i,j])=>pairs.map(([k,l])=>lambda*delta(i,j)*delta(k,l)+mu*(delta(i,k)*delta(j,l)+delta(i,l)*delta(j,k))+a*(delta(i,j)*n[k]*n[l]+n[i]*n[j]*delta(k,l))+b*n[i]*n[j]*n[k]*n[l]+c*(delta(i,k)*n[j]*n[l]+delta(i,l)*n[j]*n[k]+delta(j,k)*n[i]*n[l]+delta(j,l)*n[i]*n[k])));
}
const bases=new WeakMap<PoleCase,number[][]>();
export function materialAt(p:PoleCase,x:number,y:number,z:number){let D=bases.get(p);if(!D){D=orthotropicD(p.material.E);bases.set(p,D);}let factor=1,angle=0,bearing=0;
 for(const r of p.regions){const q=defectDistance(p,r,x,y,z);if(q>1)continue;if(r.kind==='decay')factor=Math.min(factor,1-.85*decaySeverity(r,q,z));if(r.kind==='knot'&&r.shape.type!=='section-contours'){const theta=(r.knot?.grainAngle??45)*Math.max(0,1-q*q);if(theta>angle){angle=theta;bearing=Math.atan2(r.shape.centreY,r.shape.centreX)+r.shape.angle*Math.PI/180;}}}
 if(angle){const a=angle*Math.PI/180;D=rotateTimber(D,[Math.sin(a)*Math.cos(bearing),Math.sin(a)*Math.sin(bearing),Math.cos(a)]);}return factor===1?D:D.map(row=>row.map(v=>v*factor));
}

/** Same prescribed fibre axis used by materialAt. No grain-strength factor is
 * applied a second time after transforming stresses into this frame. */
export function fibreAxisAt(p:PoleCase,x:number,y:number,z:number){let angle=0,bearing=0;for(const r of p.regions){const q=defectDistance(p,r,x,y,z);if(q>1||r.kind!=='knot'||r.shape.type==='section-contours')continue;const theta=(r.knot?.grainAngle??45)*Math.max(0,1-q*q);if(theta>angle){angle=theta;bearing=Math.atan2(r.shape.centreY,r.shape.centreX)+r.shape.angle*Math.PI/180;}}const a=angle*Math.PI/180;return [Math.sin(a)*Math.cos(bearing),Math.sin(a)*Math.sin(bearing),Math.cos(a)];}
export function fibreStresses(stress:number[],n:number[]){const S=[[stress[0],stress[3],stress[5]],[stress[3],stress[1],stress[4]],[stress[5],stress[4],stress[2]]],dot=(a:number[],b:number[])=>a.reduce((s,v,i)=>s+v*b[i],0),mul=(a:number[])=>S.map(row=>dot(row,a));const seed=Math.abs(n[2])<.9?[0,0,1]:[1,0,0],d=dot(seed,n),q=seed.map((v,i)=>v-d*n[i]),length=Math.hypot(...q),a=q.map(v=>v/length),b=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]],longitudinal=dot(n,mul(n)),aa=dot(a,mul(a)),bb=dot(b,mul(b)),ab=dot(a,mul(b)),mean=(aa+bb)/2,delta=Math.hypot((aa-bb)/2,ab);return {longitudinal,transverseMax:mean+delta,transverseMin:mean-delta,transverse:Math.abs(mean+delta)>Math.abs(mean-delta)?mean+delta:mean-delta,shear:Math.hypot(dot(a,mul(n)),dot(b,mul(n)))};}
