import {diameterAt,type PoleCase} from '../../domain/model.ts';
import {EDGES,type SolidMesh,type Vec3} from './kernel.ts';
import {quadraticMesh,prism} from './volumeMesh.ts';
/** Extend only remote end cuts. Every original corner, midnode and element is retained
 * geometrically, so a boundary study no longer remeshes the defect neighbourhood. */
export function extendMesh(original:SolidMesh,p:PoleCase,distance:number):SolidMesh{
 if(distance===0)return structuredClone(original);const zMin=original.zMin-distance,zMax=original.zMax+distance;if(zMin<0||zMax>p.length-p.embedment)throw Error('Extended boundary leaves the supported above-ground domain.');
 const key=(a:Vec3,b:Vec3)=>[a.map(v=>v.toFixed(12)).join(','),b.map(v=>v.toFixed(12)).join(',')].sort().join('/'),oldMids=new Map<string,Vec3>();for(const ns of original.tets)EDGES.forEach(([i,j],k)=>oldMids.set(key(original.points[ns[i]],original.points[ns[j]]),original.points[ns[k+4]]));
 const used=new Set(original.tets.flatMap(t=>t.slice(0,4))),map=new Map<number,number>(),points:Vec3[]=[];original.points.forEach((v,i)=>{if(used.has(i)){map.set(i,points.length);points.push([...v]);}});const tets=original.tets.map(t=>t.slice(0,4).map(i=>map.get(i)!));
 for(const [edge,sign] of [[original.zMin,-1],[original.zMax,1]]){
  let faces=original.surface.filter(f=>f.every(n=>Math.abs(original.points[n][2]-edge)<1e-8)).map(f=>f.slice(0,3).map(n=>map.get(n)!));const count=Math.max(1,Math.ceil(distance/(diameterAt(p,edge)/3)));
  for(let j=1;j<=count;j++){const z=edge+sign*distance*j/count,next=new Map<number,number>();for(const i of new Set(faces.flat())){const old=points[i],ratio=diameterAt(p,z)/diameterAt(p,old[2]);next.set(i,points.length);points.push([old[0]*ratio,old[1]*ratio,z]);}for(const f of faces)prism(tets,f,n=>next.get(n)!);faces=faces.map(f=>f.map(n=>next.get(n)!));}
 }
 return quadraticMesh(points,tets,zMin,zMax,(v,a,b)=>{const old=oldMids.get(key(a,b));if(old)return [...old];if([a,b].every(q=>Math.abs(Math.hypot(q[0],q[1])-diameterAt(p,q[2])/2)<1e-8)){const f=diameterAt(p,v[2])/2/Math.hypot(v[0],v[1]);v[0]*=f;v[1]*=f;}return v;});
}
