import {clamp,diameterAt,regionScale,type PoleCase,type Region} from './model.ts';
import type {Point2} from './sketch.ts';
export function moveDefectHeight(p:PoleCase,r:Region,height:number):Partial<Region>{
 const half=(r.zMax-r.zMin)/2,centre=clamp(height,-p.embedment+half,p.length-p.embedment-half),dz=centre-(r.zMin+r.zMax)/2;
 return {zMin:r.zMin+dz,zMax:r.zMax+dz,...(r.decay?{decay:{...r.decay,sourceZ:r.decay.sourceZ+dz}}:{}),...(r.drilling?{drilling:{...r.drilling,depth:Math.min(r.drilling.depth,diameterAt(p,centre))}}:{})};
}
export function moveDefectSection(p:PoleCase,r:Region,dx:number,dy:number):Partial<Region>{
 if(r.shape.type==='section-contours')return {};
 if(r.drilling){const d=r.drilling,a=d.bearing*Math.PI/180,R=diameterAt(p,(r.zMin+r.zMax)/2)/2,radial=R-d.depth/2,x=Math.sin(a)*radial+dx,y=Math.cos(a)*radial+dy;return {drilling:{...d,bearing:(Math.atan2(x,y)*180/Math.PI+360)%360,depth:clamp(2*(R-Math.hypot(x,y)),d.diameter,2*R)}};}
 if(r.decay?.pattern==='shell')return {decay:{...r.decay,offsetX:(r.decay.offsetX??0)+dx,offsetY:(r.decay.offsetY??0)+dy}};
 return {shape:{...r.shape,centreX:r.shape.centreX+dx,centreY:r.shape.centreY+dy}};
}
/** Physical section outlines; shell has an outer and inner loop. */
export function defectSectionLoops(p:PoleCase,r:Region,z:number):Point2[][]{
 const sh=r.shape;if(sh.type==='section-contours'||z<r.zMin||z>r.zMax)return [];
 const R=diameterAt(p,z)/2,f=regionScale(r,z),circle=(radius:number,cx=0,cy=0)=>Array.from({length:64},(_,i)=>[cx+radius*Math.cos(i*Math.PI/32),cy+radius*Math.sin(i*Math.PI/32)] as Point2);
 if(r.drilling){const d=r.drilling,a=d.bearing*Math.PI/180,half=Math.sqrt(Math.max(0,(d.diameter/2)**2-(z-(r.zMin+r.zMax)/2)**2));return [[[R-d.depth,-half],[R,-half],[R,half],[R-d.depth,half]].map(([u,v])=>[u*Math.sin(a)+v*Math.cos(a),u*Math.cos(a)-v*Math.sin(a)] as Point2)];}
 if(r.decay?.pattern==='shell')return [circle(R),circle(Math.max(0,R-r.decay.shellDepth*f),r.decay.offsetX??0,r.decay.offsetY??0)];
 const a=sh.angle*Math.PI/180,points=sh.type==='sketch'?sh.outline:circle(1);return [points.map(([x,y])=>{const u=x*sh.radiusX*f,v=y*sh.radiusY*f;return [sh.centreX+u*Math.cos(a)-v*Math.sin(a),sh.centreY+u*Math.sin(a)+v*Math.cos(a)] as Point2;})];
}
