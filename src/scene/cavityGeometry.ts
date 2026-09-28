import * as T from 'three';
import {diameterAt,regionScale,defectDistance,type PoleCase,type Region} from '../domain/model.ts';
import {stationAt,type AnalysisResult} from '../analysis/beam.ts';

/** Physical void boundary, clipped at the timber exterior. Never wrap an
 * outlying cavity vertex onto the pole skin: that would close its mouth. */
export function cavityGeometry(p:PoleCase,r:Region,result:AnalysisResult|null,scale:number){
 const geometry=new T.BufferGeometry(),positions:number[]=[],uv:number[]=[];
 if(r.kind!=='void'||r.shape.type==='section-contours')return geometry;
 type V={x:number;y:number;z:number;u:number;v:number};
 const sh=r.shape,angle=sh.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),cols=sh.type==='sketch'?sh.outline.length:96,rows=80;
 const point=(z:number,k:number):V=>{const a=k/cols*Math.PI*2,q=sh.type==='sketch'?sh.outline[k%cols]:[Math.cos(a),Math.sin(a)],f=regionScale(r,z),x=sh.radiusX*f*q[0],y=sh.radiusY*f*q[1];return {x:sh.centreX+x*cs-y*sn,y:sh.centreY+x*sn+y*cs,z,u:k/cols,v:(z-r.zMin)/(r.zMax-r.zMin)};};
 const inside=(v:V)=>v.x*v.x+v.y*v.y<=(diameterAt(p,v.z)/2)**2;
 const mix=(a:V,b:V,t:number):V=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
 function triangle(a:V,b:V,c:V){
  let poly=[a,b,c];
  // A convex 128-sided clip also catches triangles whose three vertices are
  // outside while their edges or interior cross the pole (notably end walls).
  if(!poly.every(inside))for(let k=0;k<128&&poly.length;k++){
   const theta=(k+.5)*Math.PI*2/128,cx=Math.cos(theta),cy=Math.sin(theta);
   const distance=(v:V)=>diameterAt(p,v.z)/2*Math.cos(Math.PI/128)-v.x*cx-v.y*cy;
   const input=poly;poly=[];
   for(let i=0;i<input.length;i++){const v=input[i],w=input[(i+1)%input.length],dv=distance(v),dw=distance(w);if(dv>=0)poly.push(v);if((dv>=0)!==(dw>=0))poly.push(mix(v,w,dv/(dv-dw)));}
  }
  for(let i=1;i<poly.length-1;i++){
   const tri=[poly[0],poly[i],poly[i+1]],centre=mix(mix(tri[0],tri[1],.5),tri[2],1/3);
   // A wall within another empty region is not a timber boundary.
   if(p.regions.some(other=>other.id!==r.id&&(other.kind==='void'||other.kind==='drilling')&&defectDistance(p,other,centre.x,centre.y,centre.z)<.999))continue;
   for(const q of tri){const at=result?stationAt(result,q.z):null;positions.push(q.x+(at?.ux??0)*scale,q.z,-q.y-(at?.uy??0)*scale);uv.push(q.u,q.v);}
  }
 }
 const start=Math.max(-p.embedment,r.zMin),end=Math.min(p.length-p.embedment,r.zMax);
 if(end<=start)return geometry;
 // Cosine spacing resolves the rounded closure without a blunt open tube end.
 const heights=Array.from({length:rows+1},(_,j)=>start+(end-start)*(1-Math.cos(Math.PI*j/rows))/2);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=point(heights[j],k),b=point(heights[j+1],k),c=point(heights[j+1],k+1),d=point(heights[j],k+1);triangle(a,b,c);triangle(a,c,d);}
 // Constant-profile cavities have real end walls. Do not cap at a sawn pole end.
 if(sh.profile==='constant')for(const z of [r.zMin,r.zMax])if(z>-p.embedment&&z<p.length-p.embedment){
  const points=Array.from({length:cols},(_,k)=>point(z,k)),faces=T.ShapeUtils.triangulateShape(points.map(q=>new T.Vector2(q.x,q.y)),[]);
  for(const face of faces)triangle(points[face[0]],points[face[1]],points[face[2]]);
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();return geometry;
}
