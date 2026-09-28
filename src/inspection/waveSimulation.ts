import {conditionAt,diameterAt,type PoleCase} from '../domain/model.ts';
import {ElasticWave,type WaveMedium} from './elasticWave.ts';
export interface WaveSequence {n:number;frames:number;field:Uint8Array;mask:Uint8Array;condition:Uint8Array;trace:Float32Array;reference:Float32Array;duration:number;frequency:number;dt:number;dx:number;peakRatio:number;elapsedMs:number;height:number;bearing:number;warnings:string[]}
export function waveMaterial(severity:number,knot=false){return {density:650*(1-.30*severity)*(knot?1.10:1),speed:1600*(1-.60*severity)*(knot?1.15:1),loss:1200+32000*severity*severity+(knot?1800:0)};}
export function makeWaveMedium(p:PoleCase,z:number,n:number,sound=false){
 const R=diameterAt(p,z)/2,dx=2*R/(n-4),density=new Float32Array(n*n),speed=new Float32Array(n*n),loss=new Float32Array(n*n),mask=new Uint8Array(n*n),condition=new Uint8Array(n*n);
 const xy=(i:number)=>({x:(i%n-(n-1)/2)*dx,y:((n-1)/2-Math.floor(i/n))*dx});
 for(let i=0;i<n*n;i++){const {x,y}=xy(i);if(Math.hypot(x,y)>R)continue;const c=conditionAt(p,x,y,z);mask[i]=!sound&&c.voided?2:1;condition[i]=sound?0:c.voided?255:Math.round((c.knot?.25:c.severity)*220);if(mask[i]===2)continue;const m=waveMaterial(sound?0:c.severity,!sound&&c.knot);density[i]=m.density;speed[i]=m.speed;loss[i]=m.loss;}
 const medium:WaveMedium={nx:n,ny:n,dx,density,speed,loss,bondAllowed:(i,j)=>{if(sound)return true;const a=xy(i),b=xy(j);return !conditionAt(p,(a.x+b.x)/2,(a.y+b.y)/2,z).voided;}};
 return {medium,mask,condition,R,xy};
}
function contact(grid:ReturnType<typeof makeWaveMedium>,bearing:number){
 const a=bearing*Math.PI/180,sx=Math.sin(a),sy=Math.cos(a),{R,xy,medium}=grid,ids:number[]=[],weights:number[]=[],width=.012;
 for(let i=0;i<medium.density.length;i++){if(!medium.density[i])continue;const {x,y}=xy(i),along=x*sx+y*sy,across=x*sy-y*sx;if(along>R-2.4*medium.dx&&Math.abs(across)<width){ids.push(i);weights.push(Math.exp(-.5*(across/(width*.5))**2));}}
 const sum=weights.reduce((a,b)=>a+b,0);return {ids:Int32Array.from(ids),weights:Float64Array.from(weights,w=>w/sum),x:sx,y:sy};
}
function run(p:PoleCase,z:number,bearing:number,n:number,sound:boolean,normalisation=1,pulseFrequency=16000,onProgress?:(v:number)=>void){
 const grid=makeWaveMedium(p,z,n,sound),engine=new ElasticWave(grid.medium),transmitter=contact(grid,bearing),receiver=contact(grid,bearing+180);
 if(!transmitter.ids.length||!receiver.ids.length)throw Error('A probe is over missing timber. Turn the pair or move to a different height.');
 const frequency=pulseFrequency,duration=3.2*grid.R*2/1600+4/frequency,steps=Math.ceil(duration/engine.dt),frames=144,stride=Math.max(1,Math.floor(steps/(frames-1))),count=Math.floor(steps/stride)+1,trace=new Float32Array(count),field=sound?new Uint8Array(0):new Uint8Array(count*n*n);let peak=0,k=0;
 // Normal traction pulse with approximately zero net impulse; common to sound and defect cases.
 for(let t=0;t<=steps;t++){
  if(t%stride===0){let displacement=0;for(let q=0;q<receiver.ids.length;q++){const i=receiver.ids[q];displacement+=(engine.ux[i]*receiver.x-engine.uy[i]*receiver.y)*receiver.weights[q];}trace[k]=displacement;
   for(let i=0;i<n*n;i++){const v=Math.hypot(engine.ux[i],engine.uy[i]);if(!Number.isFinite(v))throw Error('Wave calculation became unstable; reduce detail or change the section.');peak=Math.max(peak,v);if(!sound)field[k*n*n+i]=Math.min(255,Math.round(255*Math.sqrt(v/Math.max(1e-20,normalisation))));}k++;if(k%20===0)onProgress?.(t/steps);
  }
  const q=Math.PI*frequency*(t*engine.dt-1.5/frequency),force=1000*(1-2*q*q)*Math.exp(-q*q);engine.step({...transmitter,x:-transmitter.x,y:transmitter.y,force});
 }
 return {grid,trace,field,peak,count,duration:(count-1)*stride*engine.dt,frequency,dt:engine.dt};
}
export function simulateWaves(p:PoleCase,z:number,bearing:number,n=112,onProgress?:(v:number)=>void):WaveSequence{
 const start=performance.now(),basis=makeWaveMedium(p,z,96);let slowest=1600;
 for(const c of basis.medium.speed)if(c>0)slowest=Math.min(slowest,c);
 // A common pulse for both cases and every quality level, resolving the slower shear wave.
 const frequency=Math.min(18000,slowest/Math.sqrt(3)/(16*basis.medium.dx)),reference=run(p,z,bearing,n,true,1,frequency,v=>onProgress?.(v*.4)),actual=run(p,z,bearing,n,false,reference.peak*.30,frequency,v=>onProgress?.(.4+v*.6));
 // Different material maxima can change the stable time step: interpolate the reference on actual frame times.
 const ref=new Float32Array(actual.count);for(let i=0;i<ref.length;i++){const index=(i/(ref.length-1)*actual.duration)/reference.duration*(reference.count-1),lo=Math.min(reference.count-1,Math.floor(index)),hi=Math.min(reference.count-1,lo+1);ref[i]=reference.trace[lo]+(reference.trace[hi]-reference.trace[lo])*(index-lo);}
 const refPeak=Math.max(...ref.map(Math.abs)),actualPeak=Math.max(...actual.trace.map(Math.abs));
 const warnings=['Illustrative 2D isotropic elastic lattice; acoustic properties and source are not UB1000 calibrated.','Late echo phase and amplitude remain grid-sensitive; this is not a converged quantitative acoustic assessment.'];
 if(p.regions.some(r=>r.kind==='drilling'&&r.drilling&&r.drilling.diameter<3*actual.grid.medium.dx&&z>=r.zMin&&z<=r.zMax))warnings.push('A drill bore is less than three grid cells wide; its acoustic response is under-resolved.');
 return {n,frames:actual.count,field:actual.field,mask:actual.grid.mask,condition:actual.grid.condition,trace:actual.trace,reference:ref,duration:actual.duration,frequency:actual.frequency,dt:actual.dt,dx:actual.grid.medium.dx,peakRatio:refPeak>1e-20?actualPeak/refPeak:0,elapsedMs:performance.now()-start,height:z,bearing,warnings};
}
