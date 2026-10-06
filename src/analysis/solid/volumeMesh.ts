import {diameterAt,exteriorRadiusAt,type PoleCase} from '../../domain/model.ts';
import {EDGES,type SolidMesh,type Vec3} from './kernel.ts';
/** Shared T10 upgrade and boundary extraction, preserving matching triangle diagonals. */
export function quadraticMesh(points:Vec3[],tets:number[][],zMin:number,zMax:number,project?:(mid:Vec3,a:Vec3,b:Vec3)=>Vec3):SolidMesh{
 const mids=new Map<string,number>(),edge=(a:number,b:number)=>[a,b].sort((a,b)=>a-b).join(','),faces=new Map<string,{face:number[];count:number}>();
 for(const tet of tets){const corners=tet.slice();for(const f of [[0,2,1],[0,1,3],[1,2,3],[2,0,3]]){const face=f.map(i=>corners[i]),key=face.slice().sort((a,b)=>a-b).join(','),old=faces.get(key);if(old)old.count++;else faces.set(key,{face,count:1});}for(const [i,j] of EDGES){const a=corners[i],b=corners[j],key=edge(a,b);let n=mids.get(key);if(n===undefined){n=points.length;let v=points[a].map((x,k)=>(x+points[b][k])/2) as Vec3;if(project)v=project(v,points[a],points[b]);points.push(v);mids.set(key,n);}tet.push(n);}}
 const surface=[...faces.values()].filter(f=>f.count===1).map(({face:f})=>[...f,...[[0,1],[1,2],[2,0]].map(([i,j])=>mids.get(edge(f[i],f[j]))!)]),top=surface.filter(f=>f.every(n=>Math.abs(points[n][2]-zMax)<1e-8)),bottom=points.flatMap((v,i)=>Math.abs(v[2]-zMin)<1e-8?[i]:[]);
 return {points,tets,factors:tets.map(()=>1),surface,top,bottom,zMin,zMax};
}
export function prism(tets:number[][],tri:number[],next:(n:number)=>number){const [a,b,c]=tri.slice().sort((a,b)=>a-b),A=next(a),B=next(b),C=next(c);tets.push([a,b,c,C],[a,b,B,C],[a,A,B,C]);}
/** Star-shaped timber volume for continuous graded elasticity/fibre directions. */
export function volumeMesh(p:PoleCase,level='coarse',marginDiameters=2){
 const na=level==='fine'?32:level==='medium'?24:16,nr=level==='fine'?6:level==='medium'?4:3,nz=level==='fine'?24:level==='medium'?18:12,lo=Math.max(0,Math.min(...p.regions.map(r=>r.zMin))),hi=Math.min(p.length-p.embedment,Math.max(...p.regions.map(r=>r.zMax))),D=diameterAt(p,(lo+hi)/2),zMin=Math.max(0,lo-marginDiameters*D),zMax=Math.min(p.length-p.embedment,hi+marginDiameters*D);
 if(hi<=lo)throw Error('This local model needs a defect above ground.');
 const heights=Array.from({length:nz+1},(_,i)=>lo+(hi-lo)*i/nz);for(const edge of [zMin,zMax]){const at=edge===zMin?lo:hi;for(let i=1;i<=4;i++)heights.push(at+(edge-at)*i/4);}for(const r of p.regions)heights.push(Math.max(lo,r.zMin),Math.min(hi,r.zMax),(Math.max(lo,r.zMin)+Math.min(hi,r.zMax))/2);
 const zs=[...new Set(heights.map(z=>+z.toFixed(10)))].sort((a,b)=>a-b),points:Vec3[]=[],tris:number[][]=[];
 const knots=p.regions.filter(r=>r.kind==='knot'&&r.shape.type!=='section-contours').map(r=>{const sh=r.shape;if(sh.type==='section-contours')throw Error('Unsupported knot');const R=diameterAt(p,(r.zMin+r.zMax)/2)/2,c=Math.hypot(sh.centreX,sh.centreY);return {rho:c/R,phi:Math.atan2(sh.centreY,sh.centreX),radial:Math.max(sh.radiusX,sh.radiusY)/R*.7,angular:Math.atan2(Math.max(sh.radiusX,sh.radiusY),Math.max(.01,c))*1.5};});
 // Redistribute existing nodes around geometric fibre gradients, not around a chosen probe.
 // The total mesh size and remote geometry remain independently refinable.
 const quantiles=(count:number,length:number,density:(x:number)=>number)=>{const steps=4096,cdf=[0];for(let i=1;i<=steps;i++)cdf.push(cdf[i-1]+density((i-.5)/steps*length));return Array.from({length:count+1},(_,j)=>{if(j===count)return length;const target=cdf[steps]*j/count;let i=1;while(cdf[i]<target)i++;return (i-1+(target-cdf[i-1])/(cdf[i]-cdf[i-1]))/steps*length;});},wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
 const radii=knots.length?quantiles(nr,1,x=>1+knots.reduce((s,k)=>s+6*Math.exp(-Math.pow((x-k.rho)/k.radial,2)),0)):Array.from({length:nr+1},(_,i)=>i/nr),rawAngles=knots.length?quantiles(na,Math.PI*2,a=>1+knots.reduce((s,k)=>s+6*Math.exp(-Math.pow(wrap(a-k.phi)/k.angular,2)),0)):Array.from({length:na+1},(_,i)=>i*Math.PI*2/na);
 for(const r of p.regions)if(r.kind==='chipping'&&r.chipping){const d=r.chipping,steps=d.facets>=6?d.facets:32,arc=d.degrees>=360?360:d.degrees,start=d.bearing-arc/2;for(let k=0;k<=steps;k++){const bearing=d.degrees>=360?k*360/steps:start+arc*k/steps;rawAngles.push(((Math.PI/2-bearing*Math.PI/180)%(Math.PI*2)+Math.PI*2)%(Math.PI*2));}}
 const angles=[...new Set(rawAngles.map(a=>+(((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2)).toFixed(12)))].sort((a,b)=>a-b),angleCount=angles.length;
 const boundary=(z:number,a:number)=>exteriorRadiusAt(p,z,((90-a*180/Math.PI)%360+360)%360);
 for(const z of zs){points.push([0,0,z]);for(let j=1;j<=nr;j++)for(let k=0;k<angleCount;k++){const a=angles[k],R=boundary(z,a);points.push([R*radii[j]*Math.cos(a),R*radii[j]*Math.sin(a),z]);}}
 const id=(j:number,k:number)=>1+(j-1)*angleCount+(k+angleCount)%angleCount,count=1+nr*angleCount;
 for(let k=0;k<angleCount;k++){tris.push([0,id(1,k),id(1,k+1)]);for(let j=1;j<nr;j++)tris.push([id(j,k),id(j+1,k),id(j+1,k+1)],[id(j,k),id(j+1,k+1),id(j,k+1)]);}
 const tets:number[][]=[];for(let j=0;j<zs.length-1;j++)for(const tri of tris)prism(tets,tri.map(i=>i+j*count),n=>n+count);
 return quadraticMesh(points,tets,zMin,zMax,(v,a,b)=>{if([a,b].every(q=>{const angle=Math.atan2(q[1],q[0]);return Math.abs(Math.hypot(q[0],q[1])-boundary(q[2],angle))<1e-8;})){const angle=Math.atan2(v[1],v[0]),rho=Math.hypot(v[0],v[1]),target=boundary(v[2],angle);if(rho>1e-12){v[0]*=target/rho;v[1]*=target/rho;}}return v;});
}
