import {diameterAt,type PoleCase} from '../../domain/model.ts';
import type {Vec3} from './kernel.ts';
import {quadraticMesh,prism} from './volumeMesh.ts';
/** Body-fitted blind radial bore in a local timber patch. Artificial cut boundaries
 * receive beam displacements; the pole surface, cylindrical bore and blind end are free.
 * The flat blind-end rim is singular: point maxima cannot establish capacity. */
export function drillMesh(p:PoleCase,level='coarse',extent=1){
 const r=p.regions.find(r=>r.kind==='drilling'),d=r?.drilling;if(!r||!d)throw Error('Select a drill bore.');const h=(r.zMin+r.zMax)/2,rad=d.diameter/2,R=diameterAt(p,h)/2,tip=R-d.depth,halfZ=Math.min(R*1.6*extent,h,p.length-p.embedment-h),W=Math.min(R*.80,Math.max(rad*6,d.depth*.6)*extent),back=Math.max(-R*.8,tip-R*.5*extent),zMin=h-halfZ,zMax=h+halfZ;
 if(halfZ<rad*4||tip<=back+rad)throw Error('The bore needs more timber behind and above/below it for this local mesh.');
 const nr=level==='fine'?7:level==='medium'?5:3,na=level==='fine'?32:level==='medium'?24:16,angles=Array.from({length:na},(_,i)=>i*Math.PI*2/na);for(const y of [-W,W])for(const z of [-halfZ,halfZ])angles.push((Math.atan2(z,y)+Math.PI*2)%(Math.PI*2));const as=[...new Set(angles.map(a=>+a.toFixed(12)))].sort((a,b)=>a-b),count=as.length;
 const fractions=Array.from({length:nr+1},(_,i)=>(Math.exp(i/nr*2.8)-1)/(Math.exp(2.8)-1)),sections=[back,tip-(tip-back)*.5,tip-rad,tip],forward=level==='fine'?6:level==='medium'?5:4;
 const yz:Vec3[]=[];for(const f of fractions)for(const a of as){const co=Math.cos(a),si=Math.sin(a),outer=Math.min(W/Math.max(1e-12,Math.abs(co)),halfZ/Math.max(1e-12,Math.abs(si))),rr=rad+f*(outer-rad);yz.push([0,rr*co,rr*si]);}const centre=yz.length;yz.push([0,0,0]);const n=yz.length,points:Vec3[]=[],layers=sections.length+forward;
 for(let layer=0;layer<layers;layer++)for(const [,y,z] of yz){const edge=Math.sqrt((diameterAt(p,h+z)/2)**2-y*y),x=layer<sections.length?sections[layer]:tip+(edge-tip)*(layer-sections.length+1)/forward;if(!Number.isFinite(edge)||edge<=tip)throw Error('This taper/depth needs a different bore patch.');points.push([x,y,h+z]);}
 const ringTris:number[][]=[];for(let j=0;j<nr;j++)for(let k=0;k<count;k++){const a=j*count+k,b=j*count+(k+1)%count,c=a+count,e=b+count;ringTris.push([a,c,e],[a,e,b]);}const core=as.map((_,k)=>[centre,k,(k+1)%count]),tets:number[][]=[];
 for(let layer=0;layer<layers-1;layer++)for(const tri of [...ringTris,...(layer<sections.length-1?core:[])])prism(tets,tri.map(i=>i+layer*n),i=>i+n);
 // Unused centre nodes beyond the blind end are removed before the solve.
 const used=new Set(tets.flat()),map=new Map<number,number>(),compact:Vec3[]=[];points.forEach((v,i)=>{if(used.has(i)){map.set(i,compact.length);compact.push(v);}});const reduced=tets.map(t=>t.map(i=>map.get(i)!));
 const outer=(v:Vec3)=>Math.abs(v[0]-Math.sqrt((diameterAt(p,v[2])/2)**2-v[1]**2))<1e-8,bore=(v:Vec3)=>v[0]>=tip-1e-9&&Math.abs(Math.hypot(v[1],v[2]-h)-rad)<1e-8;
 const mesh=quadraticMesh(compact,reduced,zMin,zMax,(v,a,b)=>{if(bore(a)&&bore(b)){const q=rad/Math.hypot(v[1],v[2]-h);v[1]*=q;v[2]=h+(v[2]-h)*q;}if(outer(a)&&outer(b))v[0]=Math.sqrt((diameterAt(p,v[2])/2)**2-v[1]**2);return v;});
 const artificial=mesh.points.flatMap((q,i)=>Math.abs(q[0]-back)<1e-8||Math.abs(Math.abs(q[1])-W)<1e-8||Math.abs(Math.abs(q[2]-h)-halfZ)<1e-8?[i]:[]),a=d.bearing*Math.PI/180,si=Math.sin(a),co=Math.cos(a);mesh.points=mesh.points.map(([x,y,z])=>[x*si+y*co,x*co-y*si,z]);
 return {mesh,artificial,centre:h,halfWidth:W,halfHeight:halfZ,back,blindEnd:tip};
}
