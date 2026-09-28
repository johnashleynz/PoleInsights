import {writeFileSync} from 'node:fs';
import * as T from 'three';
import {defaultCase,newRegion,diameterAt} from '../src/domain/model.ts';
import {cavityGeometry} from '../src/scene/cavityGeometry.ts';
const checks=[];const check=(name,pass)=>{checks.push({name,pass});if(!pass)throw Error(name);};
const p=defaultCase(),r=newRegion(p,'void');r.zMin=1;r.zMax=2;r.shape={type:'ellipse',centreX:.12,centreY:0,radiusX:.09,radiusY:.07,angle:0,profile:'rounded'};p.regions=[r];
const mesh=(r)=>{const m=new T.Mesh(cavityGeometry(p,r,null,1),new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld();return m;};
const m=mesh(r),attr=m.geometry.getAttribute('position');
check('Clipped walls stay within the tapered pole',Array.from({length:attr.count},(_,i)=>Math.hypot(attr.getX(i),attr.getZ(i))<=diameterAt(p,attr.getY(i))/2+1e-7).every(Boolean));
const ray=new T.Raycaster(new T.Vector3(1,1.5,0),new T.Vector3(-1,0,0)),hits=ray.intersectObject(m);
check('Opening ray hits the cavity back wall, not a cap across its mouth',hits.length>0&&Math.abs(hits[0].point.x-.03)<.001);
for(const degrees of [-20,-10,0,10,20]){const a=degrees*Math.PI/180,origin=new T.Vector3(1,1.5,Math.tan(a)),target=new T.Vector3(.07,1.5,0);ray.set(origin,target.sub(origin).normalize());const h=ray.intersectObject(m);check('Oblique opening view '+degrees+' degrees finds an interior wall',h.length>0&&h[0].point.x<.14);}
const enclosed=structuredClone(r);enclosed.shape.centreX=0;p.regions=[enclosed];const inside=mesh(enclosed);
for(let k=0;k<36;k++){const a=k*Math.PI/18;ray.set(new T.Vector3(0,1.5,0),new T.Vector3(Math.cos(a),0,Math.sin(a)));check('Enclosed cavity has a wall at orbit angle '+k*10,ray.intersectObject(inside).length>0);}
for(const sign of [-1,1]){ray.set(new T.Vector3(0,1.5,0),new T.Vector3(0,sign,0));check('Rounded cavity closes at axial end '+sign,ray.intersectObject(inside).length>0);}
const constant=structuredClone(enclosed);constant.shape.profile='constant';p.regions=[constant];const cm=mesh(constant);
for(const sign of [-1,1]){ray.set(new T.Vector3(0,1.5,0),new T.Vector3(0,sign,0));check('Constant cavity has end wall '+sign,ray.intersectObject(cm).length>0);}
const sketch=structuredClone(constant);sketch.shape={...sketch.shape,type:'sketch',outline:[[-1,-1],[1,-1],[1,0],[0,0],[0,1],[-1,1]]};p.regions=[sketch];check('Concave sketched cavity triangulates',mesh(sketch).geometry.getAttribute('position').count>0);
writeFileSync('verification/results/p21.json',JSON.stringify({scope:'Display geometry and ray intersections, not structural validation',checks},null,2));console.log(checks.length+' P21 cavity geometry checks passed.');
