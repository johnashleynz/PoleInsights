import * as T from 'three';
import type {PoleCase,StressDisplay} from '../domain/model.ts';
import {diameterAt,conditionAt,exteriorRadiusAt,regionScale} from '../domain/model.ts';
import type {AnalysisResult} from '../analysis/beam.ts';
import {stationAt} from '../analysis/beam.ts';
import {displayedStress,type SolidField} from '../analysis/solid/field.ts';
import {stressColour,utilisationColour} from './materials.ts';

/** Crossarm-style result colouring on actual timber surfaces, with an optional
 * longitudinal reveal. No intersecting interior sheets or added stress fields.
 * Vertex interpolation is a display approximation; probes retain point recovery. */
export function stressSurface(p:PoleCase,result:AnalysisResult,scale:number,display:StressDisplay,solid:SolidField|null|undefined,reveal:boolean,utilisationMax=1.5){
  const pos:number[]=[],col:number[]=[],normals:number[]=[],group=new T.Group();
  type Point=[number,number,number];
  const visible=(q:Point)=>!reveal||Math.atan2(q[1],q[0])>=0||Math.atan2(q[1],q[0])<=-2*Math.PI/3;
  function quad(points:Point[],clip=true){
    const centre=points.reduce((s,q)=>s.map((v,i)=>v+q[i]/4) as Point,[0,0,0] as Point);
    if((clip&&!visible(centre))||conditionAt(p,...centre).voided)return;
    const samples=points.map(q=>{const station=stationAt(result,q[2]),value=displayedStress(p,station,...q,display,solid),rgb=value===null?[202,210,216]:display==='utilisation'?utilisationColour(value,utilisationMax):stressColour(value);return {point:new T.Vector3(q[0]+station.ux*scale,q[2],-q[1]-station.uy*scale),colour:new T.Color().setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,T.SRGBColorSpace),voided:conditionAt(p,...q).voided};});
    for(const triangle of [[0,1,2],[0,2,3]]){if(triangle.some(i=>samples[i].voided))continue;const a=samples[triangle[0]].point,b=samples[triangle[1]].point,c=samples[triangle[2]].point,n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();for(const i of triangle){pos.push(...samples[i].point.toArray());col.push(...samples[i].colour.toArray());normals.push(...n.toArray());}}
  }
  // Additional axial stations resolve every defect, including small drill bores.
  const zs=Array.from({length:121},(_,i)=>-p.embedment+p.length*i/120);
  for(const r of p.regions)for(let i=0;i<=32;i++)zs.push(Math.max(-p.embedment,Math.min(p.length-p.embedment,r.zMin+(r.zMax-r.zMin)*i/32)));
  const heights=[...new Set(zs)].sort((a,b)=>a-b),bearingAt=(a:number)=>((90-a*180/Math.PI)%360+360)%360,at=(z:number,a:number,u=1):Point=>{const R=exteriorRadiusAt(p,z,bearingAt(a))*(u>=1?.9995:u);return [R*Math.cos(a),R*Math.sin(a),z];};
  const rawAngles=Array.from({length:97},(_,k)=>k*Math.PI*2/96);for(const r of p.regions){if(r.drilling){const a=Math.PI/2-r.drilling.bearing*Math.PI/180,delta=Math.asin(Math.min(.9,r.drilling.diameter/diameterAt(p,(r.zMin+r.zMax)/2)));for(let k=-12;k<=12;k++)rawAngles.push(((a+delta*k/8)%(Math.PI*2)+Math.PI*2)%(Math.PI*2));}if(r.kind==='chipping'&&r.chipping){const d=r.chipping,steps=d.facets>=6?d.facets:32,arc=d.degrees>=360?360:d.degrees,start=d.bearing-arc/2;for(let k=0;k<=steps;k++){const bearing=d.degrees>=360?k*360/steps:start+arc*k/steps;rawAngles.push(((Math.PI/2-bearing*Math.PI/180)%(Math.PI*2)+Math.PI*2)%(Math.PI*2));}}}const angles=[...new Set(rawAngles.map(a=>+(((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2)).toFixed(12)))].sort((a,b)=>a-b);
  for(let j=0;j<heights.length-1;j++)for(let k=0;k<angles.length-1;k++){const a=angles[k],b=angles[k+1];quad([at(heights[j],a),at(heights[j+1],a),at(heights[j+1],b),at(heights[j],b)]);}
  // Sawn ends sample the same field as the sides; voids remain absent.
  for(const z of [-p.embedment,p.length-p.embedment])for(let k=0;k<angles.length-1;k++)for(let i=0;i<24;i++)
    quad([at(z,angles[k],i/24),at(z,angles[k],(i+1)/24),at(z,angles[k+1],(i+1)/24),at(z,angles[k+1],i/24)]);
  // Boundaries of a single 120-degree wedge: these are exposed wood faces.
  if(reveal)for(const a of [0,4*Math.PI/3])for(let j=0;j<heights.length-1;j++)for(let k=0;k<24;k++)quad([at(heights[j],a,k/24),at(heights[j+1],a,k/24),at(heights[j+1],a,(k+1)/24),at(heights[j],a,(k+1)/24)],false);
  // Rounded cavity walls. The sampled skin lies 0.05% outside the analytic void.
  for(const r of p.regions){if(r.kind==='drilling'&&r.drilling){const d=r.drilling,h=(r.zMin+r.zMax)/2,R=diameterAt(p,h)/2,a=d.bearing*Math.PI/180,si=Math.sin(a),co=Math.cos(a),bottom=R-d.depth;
    const bore=(i:number,k:number):Point=>{const phi=k*Math.PI*2/48,transverse=d.diameter/2*1.0005*Math.cos(phi),z=h+d.diameter/2*1.0005*Math.sin(phi),outer=Math.sqrt((diameterAt(p,z)/2)**2-transverse**2),along=bottom+(outer-bottom)*i/16;return [along*si+transverse*co,along*co-transverse*si,z];};
    for(let i=0;i<16;i++)for(let k=0;k<48;k++)quad([bore(i,k),bore(i+1,k),bore(i+1,k+1),bore(i,k+1)],false);continue;
  }if(r.kind!=='void'||r.shape.type==='section-contours')continue;const sh=r.shape,rotation=sh.angle*Math.PI/180,cols=sh.type==='sketch'?sh.outline.length:96;
    const point=(j:number,k:number):Point=>{const z=r.zMin+(r.zMax-r.zMin)*(j+.02)/64.04,f=regionScale(r,z)*1.0005,a=k*Math.PI*2/cols,q=sh.type==='sketch'?sh.outline[k%cols]:[Math.cos(a),Math.sin(a)],u=sh.radiusX*f*q[0],v=sh.radiusY*f*q[1];return [sh.centreX+u*Math.cos(rotation)-v*Math.sin(rotation),sh.centreY+u*Math.sin(rotation)+v*Math.cos(rotation),z];};
    for(let j=0;j<64;j++)for(let k=0;k<cols;k++)quad([point(j,k),point(j+1,k),point(j+1,k+1),point(j,k+1)]);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new T.Float32BufferAttribute(col,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false}));mesh.name='stress-timber-surfaces';group.add(mesh);return group;
}
