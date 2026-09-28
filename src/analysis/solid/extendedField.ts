import {yielding,solveNonlinearPole} from '../nonlinear.ts';
import {validateCase,type PoleCase} from '../../domain/model.ts';
import {solvePole,beamKinematicsAt} from '../beam.ts';
import {orthotropicD} from './kernel.ts';
import {volumeMesh} from './volumeMesh.ts';
import {drillMesh} from './drillMesh.ts';
import {materialAt} from './material.ts';
import {curvedEndLoads,solveCurved} from './curved.ts';
import {prepareRecovery} from './curvedRecovery.ts';
import {solveCurvedLocal} from './curvedField.ts';
import type {SolidField} from './field.ts';
export function solveDetailed(p:PoleCase,level='coarse',extent=1):SolidField{
 const errors=validateCase(p);if(errors.length)throw Error(errors[0]);if(!p.regions.length)throw Error('Add a defect to resolve its local stresses.');
 if(p.regions.some(r=>r.kind==='void'))return solveCurvedLocal(p,level);
 const started=performance.now(),isDrill=p.regions.some(r=>r.kind==='drilling');if(isDrill&&p.regions.length!==1)throw Error('For the bore preview, use one drilling defect. Combined bore/other-defect meshes remain unqualified.');
 const drill=isDrill?drillMesh(p,level,extent):null,mesh=drill?.mesh??volumeMesh(p,level,extent*2),D=orthotropicD(p.material.E),fixed=new Map<number,number>();let loads:Float64Array,patch:SolidField['patch'];
 if(drill){
  const beam=yielding(p)?solveNonlinearPole(p):solvePole({...p,loadKN:1}),origin=beamKinematicsAt(beam,drill.centre);
  // Remove an exactly representable rigid translation/rotation before solving.
  // This changes no strain, and avoids cancellation between large prescribed motions.
  for(const n of drill.artificial){const [x,y,z]=mesh.points[n],s=beamKinematicsAt(beam,z),dx=s.rx-origin.rx,dy=s.ry-origin.ry,u=[s.ux-origin.ux-origin.rx*(z-drill.centre)+.3*(s.kx*(x*x-y*y)/2+s.ky*x*y),s.uy-origin.uy-origin.ry*(z-drill.centre)+.3*(s.kx*x*y+s.ky*(y*y-x*x)/2),-x*dx-y*dy];u.forEach((v,k)=>fixed.set(n*3+k,v));}
  loads=new Float64Array(mesh.points.length*3);patch={bearing:p.regions[0].drilling!.bearing,back:drill.back,halfWidth:drill.halfWidth,centre:drill.centre,halfHeight:drill.halfHeight};
 }else{
  const a=p.bearing*Math.PI/180,fx=1000*Math.sin(a),fy=1000*Math.cos(a),lever=p.length-p.embedment-mesh.zMax;loads=curvedEndLoads(mesh,[fx,fy,0],[fx*lever,fy*lever]).loads;mesh.bottom.forEach(n=>[0,1,2].forEach(k=>fixed.set(n*3+k,0)));
 }
 const material=isDrill?D:(x:number[])=>materialAt(p,x[0],x[1],x[2]),solved=solveCurved(mesh,material,loads,fixed),recovery=prepareRecovery(mesh,solved.displacements,D,isDrill?undefined:p),defectMin=Math.max(mesh.zMin,Math.min(...p.regions.map(r=>r.zMin))),defectMax=Math.min(mesh.zMax,Math.max(...p.regions.map(r=>r.zMax)));
 const force=[0,0,0],moment=[0,0,0];let work=0;mesh.points.forEach(([x,y,z],n)=>{const f=[0,1,2].map(k=>{const i=n*3+k,v=fixed.has(i)?solved.internal[i]:loads[i];force[k]+=v;work+=v*solved.displacements[i];return v;});moment[0]+=y*f[2]-z*f[1];moment[1]+=z*f[0]-x*f[2];moment[2]+=x*f[1]-y*f[0];});const diagnostics={forceBalanceN:Math.hypot(...force),momentBalanceNm:Math.hypot(...moment),relativeWorkError:Math.abs(work-2*solved.energy)/Math.max(1e-20,Math.abs(work))};
 return {actualLoad:isDrill&&yielding(p),version:'solid-p09',diagnostics,zMin:mesh.zMin,zMax:mesh.zMax,defectMin,defectMax,resolution:level,nodes:mesh.points.length,elements:mesh.tets.length,elapsedMs:performance.now()-started,iterations:solved.iterations,residual:solved.relativeResidual,energy:solved.energy,...recovery,longitudinal:new Float64Array(0),sampledPeakPa:Math.max(...solved.centroidStress.map(s=>Math.abs(s[2]))),...(patch?{patch}:{}),basis:isDrill?'Curved T10 blind-bore displacement submodel. Exact Hermite beam kinematics on artificial cut faces, free bore/pole surfaces. Flat blind-end edge is singular; peak is diagnostic, not capacity. Broader mesh/boundary and physical qualification incomplete.':'Curved T10 continuous graded-decay / prescribed knot-fibre elasticity, integrated at quadrature points and recovered at the query point. One-way force-driven submodel. Illustrative material laws; broader mesh/boundary and physical qualification incomplete. Capacity stays beam-based.'};
}
