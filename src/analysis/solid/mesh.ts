import type {PoleCase,Region} from '../../domain/model.ts';
import {diameterAt,validateCase} from '../../domain/model.ts';
import {EDGES,type Vec3,type SolidMesh} from './kernel.ts';
export interface Resolution {angular:number;axial:number;radial:number;marginDiameters:number;capRadial?:number}
export const RESOLUTIONS:Record<string,Resolution>={coarse:{angular:12,axial:8,radial:2,marginDiameters:2},medium:{angular:16,axial:12,radial:3,marginDiameters:2},fine:{angular:24,axial:16,radial:4,marginDiameters:2}};
export function eligibleRegion(p:PoleCase):Region {
 const errors=validateCase(p);if(errors.length)throw Error(errors[0]);
 if(p.regions.length!==1)throw Error('Detailed stresses currently require one enclosed decay region or hollow.');const r=p.regions[0];
 if(r.kind==='knot')throw Error('Knot fibre directions and strength are not supported by the solid model yet.');
 if(r.kind==='drilling')throw Error('Drilling is included in beam section loss; local bore stresses are not supported by this solid mesh.');
 if(r.decay&&(r.decay.pattern==='shell'||r.decay.progression==='source'))throw Error('Shell rot and graded decay use beam results. This solid mesh supports uniform enclosed decay only.');
 if(r.shape.type!=='ellipse'||r.shape.profile!=='rounded')throw Error('Detailed stresses currently require a rounded enclosed region.');
 const R=Math.min(diameterAt(p,r.zMin),diameterAt(p,r.zMax))/2;
 if(Math.hypot(r.shape.centreX,r.shape.centreY)+Math.max(r.shape.radiusX,r.shape.radiusY)>R*.87)throw Error('Detailed stresses need an enclosed region with a timber ligament of at least 13% of pole radius.');
 if(r.zMin<=0||r.zMax>=p.length-p.embedment)throw Error('The first solid model supports enclosed defects above ground only.');
 return r;
}
/** Body-fitted, straight-sided T10 mesh. Inner surfaces follow the case's rounded
 * ellipse profile at mesh vertices; surface faceting is exposed in convergence studies. */
export function poleMesh(p:PoleCase,res:Resolution):SolidMesh {
 const r=eligibleRegion(p),sh=r.shape;if(sh.type!=='ellipse')throw Error('Unsupported shape.');
 const mid=(r.zMin+r.zMax)/2,half=(r.zMax-r.zMin)/2,D=diameterAt(p,mid),margin=res.marginDiameters*D,zMin=r.zMin-margin,zMax=r.zMax+margin;
 if(zMin<0||zMax>p.length-p.embedment)throw Error(`Leave ${res.marginDiameters} pole diameters of sound wood between the region and groundline/tip for this solid solve.`);
 const na=res.angular,nz=res.axial,nr=res.radial,outer:Vec3[]=[],faces:number[][]=[],topRaw:number[][]=[];
 // Side rings plus cap centres provide a closed star-shaped outer surface.
 // Cluster axial stations at the cavity ends while retaining the whole buffer.
 const heights=Array.from({length:nz+1},(_,i)=>zMin+(zMax-zMin)*i/nz);
 heights.push(r.zMin,r.zMax,mid);heights.sort((a,b)=>a-b);const zs=heights.filter((v,i)=>i===0||v-heights[i-1]>1e-8),last=zs.length-1;
 for(const z of zs)for(let a=0;a<na;a++){const t=2*Math.PI*a/na,R=diameterAt(p,z)/2;outer.push([R*Math.cos(t),R*Math.sin(t),z]);}
 const id=(j:number,a:number)=>j*na+(a+na)%na;
 for(let j=0;j<last;j++)for(let a=0;a<na;a++){const h=[id(j,a),id(j,a+1),id(j+1,a+1),id(j+1,a)];faces.push([h[0],h[1],h[2]],[h[0],h[2],h[3]]);}
 for(const j of [0,last]){
   const centre=outer.length;outer.push([sh.centreX,sh.centreY,zs[j]]);const capRings=res.capRadial??1;let previous:number[]|null=null;
   const add=(tri:number[])=>{faces.push(tri);if(j===last)topRaw.push(tri);};
   for(let ring=1;ring<=capRings;ring++){
     const current=Array.from({length:na},(_,a)=>{if(ring===capRings)return id(j,a);const edge=outer[id(j,a)],t=ring/capRings,index=outer.length;outer.push([sh.centreX+(edge[0]-sh.centreX)*t,sh.centreY+(edge[1]-sh.centreY)*t,zs[j]]);return index;});
     for(let a=0;a<na;a++){const b=(a+1)%na;if(!previous)add([centre,current[a],current[b]]);else{add([previous[a],current[a],current[b]]);add([previous[a],current[b],previous[b]]);}}
     previous=current;
   }
 }
 const centre:Vec3=[sh.centreX,sh.centreY,mid],angle=sh.angle*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),inner=outer.map(v=>{const d=v.map((x,i)=>x-centre[i]),a=((d[0]*co+d[1]*si)/sh.radiusX)**2+((-d[0]*si+d[1]*co)/sh.radiusY)**2,b=(d[2]/half)**6;let lo=0,hi=1;for(let k=0;k<55;k++){const t=(lo+hi)/2;if(a*t*t+b*t**6>1)hi=t;else lo=t;}return centre.map((x,i)=>x+(lo+hi)/2*d[i]) as Vec3;});
 const points:Vec3[]=[],tets:number[][]=[],factors:number[]=[],count=outer.length;
 for(let layer=0;layer<=nr;layer++){const t=(layer/nr)**1.35;for(let i=0;i<count;i++)points.push(inner[i].map((v,k)=>v+t*(outer[i][k]-v)) as Vec3);}
 for(let layer=0;layer<nr;layer++)for(const f of faces){const [a,b,c]=f.slice().sort((x,y)=>x-y),a0=layer*count+a,b0=layer*count+b,c0=layer*count+c,a1=a0+count,b1=b0+count,c1=c0+count;tets.push([a0,b0,c0,c1],[a0,b0,b1,c1],[a0,a1,b1,c1]);factors.push(1,1,1);}
 if(r.kind==='decay'){const c=points.length;points.push(centre);for(const face of faces){tets.push([c,...face]);factors.push(1-.85*r.severity);}}
 const mids=new Map<string,number>(),key=(a:number,b:number)=>`${Math.min(a,b)},${Math.max(a,b)}`;
 for(const tet of tets){const corners=tet.slice();for(const [a,b] of EDGES){const k=key(corners[a],corners[b]);let index=mids.get(k);if(index===undefined){index=points.length;points.push(points[corners[a]].map((v,i)=>(v+points[corners[b]][i])/2) as Vec3);mids.set(k,index);}tet.push(index);}}
 const face6=(f:number[])=>[...f,...[[0,1],[1,2],[2,0]].map(([i,j])=>mids.get(key(f[i],f[j]))!)],top=topRaw.map(f=>face6(f.map(i=>nr*count+i))),surface=faces.map(f=>face6(f.map(i=>nr*count+i)));
 if(r.kind==='void')surface.push(...faces.map(face6));
 const bottom=points.flatMap((v,i)=>Math.abs(v[2]-zMin)<1e-9?[i]:[]);
 return {points,tets,factors,top,bottom,surface,zMin,zMax};
}
/** Consistent quadratic face loading. Six-point triangle rule integrates N2*t1. */
export function endLoads(mesh:SolidMesh,force:Vec3,bending:[number,number]){
 const loads=new Float64Array(mesh.points.length*3),rule:number[][]=[];
 for(const [a,b,w] of [[.445948490915965,.108103018168070,.223381589678011],[.091576213509771,.816847572980459,.109951743655322]])for(let i=0;i<3;i++)rule.push(...[Array.from({length:3},(_,j)=>i===j?b:a).concat(w)]);
 // Use the actual polygon moments so the transferred generalized forces are exact
 // even before angular geometry refinement. No ideal-circle traction correction.
 let area=0,ax=0,ay=0,xx=0,yy=0,xy=0;
 const samples:{face:number[];N:number[];x:number;y:number;w:number}[]=[];
 for(const face of mesh.top){const ps=face.slice(0,3).map(n=>mesh.points[n]),A=Math.abs((ps[1][0]-ps[0][0])*(ps[2][1]-ps[0][1])-(ps[1][1]-ps[0][1])*(ps[2][0]-ps[0][0]))/2;for(const q of rule){const [a,b,c]=q,x=ps.reduce((s,p,i)=>s+p[0]*q[i],0),y=ps.reduce((s,p,i)=>s+p[1]*q[i],0),w=A*q[3],N=[a*(2*a-1),b*(2*b-1),c*(2*c-1),4*a*b,4*b*c,4*c*a];samples.push({face,N,x,y,w});area+=w;ax+=w*x;ay+=w*y;xx+=w*x*x;yy+=w*y*y;xy+=w*x*y;}}
 const coeff=inverse3([[area,ax,ay],[ax,xx,xy],[ay,xy,yy]],[force[2],-bending[0],-bending[1]]);
 for(const s of samples){const traction=[force[0]/area,force[1]/area,coeff[0]+coeff[1]*s.x+coeff[2]*s.y];s.face.forEach((n,i)=>traction.forEach((t,k)=>loads[3*n+k]+=s.w*s.N[i]*t));}
 return loads;
}
function inverse3(a:number[][],b:number[]){const m=a.map((r,i)=>[...r,b[i]]);for(let j=0;j<3;j++){const p=m[j][j];for(let k=j;k<4;k++)m[j][k]/=p;for(let i=0;i<3;i++)if(i!==j){const v=m[i][j];for(let k=j;k<4;k++)m[i][k]-=v*m[j][k];}}return m.map(r=>r[3]);}
