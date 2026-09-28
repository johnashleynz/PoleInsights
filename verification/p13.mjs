import {writeFileSync} from 'node:fs';
import {ElasticWave} from '../src/inspection/elasticWave.ts';
import {makeWaveMedium,simulateWaves,waveMaterial} from '../src/inspection/waveSimulation.ts';
import {defaultCase,newRegion} from '../src/domain/model.ts';
const checks=[],check=(name,pass,data)=>{checks.push({name,pass,data});if(!pass)throw Error(name+' '+JSON.stringify(data));};
const uniform=(nx=64,ny=8,loss=0)=>({nx,ny,dx:.001,density:new Float32Array(nx*ny).fill(650),speed:new Float32Array(nx*ny).fill(1600),loss:new Float32Array(nx*ny).fill(loss),periodicX:true,periodicY:true});
for(const shear of [false,true]){
 const m=uniform(),e=new ElasticWave(m),u=shear?e.uy:e.ux,v=shear?e.vy:e.vx,c=1600/(shear?Math.sqrt(3):1),omega=2*c/m.dx*Math.sin(Math.PI/m.nx),wave=Float64Array.from(u,(_,i)=>1e-6*Math.sin(2*Math.PI*(i%m.nx)/m.nx));u.set(wave);for(let i=0;i<v.length;i++)v[i]=.5*e.dt*omega*omega*wave[i];
 const steps=Math.round(1.3*2*Math.PI/omega/e.dt);for(let k=0;k<steps;k++)e.step();const projection=u.reduce((sum,x,i)=>sum+x*wave[i],0)/wave.reduce((sum,x)=>sum+x*x,0),exact=Math.cos(omega*steps*e.dt);
 check(`${shear?'Shear':'Compression'} mode matches independent lattice dispersion`,Math.abs(projection-exact)<.007,{projection,exact});
 check(`${shear?'Shear':'Compression'} long-wave speed agrees with continuum`,Math.abs(omega/(2*Math.PI/(m.nx*m.dx))/c-1)<.001);
}
{
 const m=uniform(30,20),e=new ElasticWave({...m,periodicX:false,periodicY:false});e.vx.fill(.001);e.vy.fill(-.002);for(let i=0;i<100;i++)e.step();check('Rigid translation generates no elastic strain',e.energy().strain<1e-20);
 const q=new ElasticWave(m);q.ux[100]=1e-6;const before=q.energy().total;let max=0;for(let k=0;k<1200;k++){q.step();max=Math.max(max,q.energy().total);}const mx=q.vx.reduce((s,v,i)=>s+v*q.mass[i],0),my=q.vy.reduce((s,v,i)=>s+v*q.mass[i],0);check('Internal elastic forces conserve linear momentum',Math.hypot(mx,my)<1e-12,{mx,my});check('Undamped integration stays bounded',max/before<1.6,{ratio:max/before});
 const d=new ElasticWave(uniform(30,20,5000));d.vx.fill(.001);const energy=d.energy().total;for(let k=0;k<100;k++)d.step();const ratio=d.energy().total/energy,exact=Math.exp(-2*5000*100*d.dt);check('Viscous absorption matches exponential rigid-velocity decay',Math.abs(ratio-exact)<1e-10,{ratio,exact});
}
{
 // Independent normal-incidence displacement coefficients: R=(Z1-Z2)/(Z1+Z2), T=1+R.
 const m=uniform(800,4);m.periodicX=false;for(let y=0;y<m.ny;y++)for(let x=400;x<m.nx;x++)m.speed[y*m.nx+x]=800;
 const e=new ElasticWave(m),centre=.16,width=.024;for(let i=0;i<e.ux.length;i++){const x=(i%m.nx)*m.dx,u=1e-6*Math.exp(-(((x-centre)/width)**2));e.ux[i]=u;e.vx[i]=2*1600*(x-centre)/width**2*u;}
 for(let k=0;k<Math.round(.0003/e.dt);k++)e.step();let reflected=0,transmitted=0;for(let x=110;x<210;x++)reflected=Math.max(reflected,e.ux[x]/1e-6);for(let x=470;x<570;x++)transmitted=Math.max(transmitted,e.ux[x]/1e-6);
 check('Interface reflection agrees with impedance coefficient',Math.abs(reflected-1/3)<.035,{reflected,expected:1/3});check('Interface transmission agrees with impedance coefficient',Math.abs(transmitted-4/3)<.06,{transmitted,expected:4/3});
}
const p=defaultCase(),sound=simulateWaves(p,.3,90,80);
check('Sound specimen and independent sound run have identical receiver trace',sound.peakRatio===1&&sound.trace.every((v,i)=>Math.abs(v-sound.reference[i])<1e-15));
check('Wave sequence evolves from rest',sound.field.slice(0,sound.n**2).every(v=>v===0)&&sound.field.some(v=>v>128));
check('Recorded times and samples are finite',sound.duration>0&&sound.dt>0&&sound.trace.every(Number.isFinite));
check('Chosen pulse has at least sixteen cells per sound wavelength',1600/sound.frequency/sound.dx>=15.99);
const d=newRegion(p,'void');d.shape.centreX=d.shape.centreY=0;d.shape.radiusX=d.shape.radiusY=.06;d.shape.profile='constant';p.regions=[d];const grid=makeWaveMedium(p,.3,96),cavity=simulateWaves(p,.3,90,96);
check('Cavity has no mass or stiffness-bearing nodes',grid.mask.some(v=>v===2)&&grid.mask.every((v,i)=>v!==2||grid.medium.density[i]===0));
check('Cavity has zero wave displacement in every frame',Array.from({length:cavity.frames},(_,f)=>cavity.mask.every((v,i)=>v!==2||cavity.field[f*cavity.n*cavity.n+i]===0)).every(Boolean));
check('Cavity changes received waveform',cavity.trace.some((v,i)=>Math.abs(v-cavity.reference[i])>1e-9));
check('Decay reduces speed and increases absorption independently of structural E',waveMaterial(.6).speed<waveMaterial(0).speed&&waveMaterial(.6).loss>waveMaterial(0).loss);
d.kind='decay';d.severity=.7;const decay=simulateWaves(p,.3,90,96);check('Decay produces a distinct finite response',decay.trace.every(Number.isFinite)&&decay.trace.some((v,i)=>Math.abs(v-cavity.trace[i])>1e-9));
const bore=newRegion(p,'drilling');p.regions=[bore];const thin=simulateWaves(p,.3,90,64);check('Under-resolved drilling is explicitly identified',thin.warnings.some(w=>w.includes('under-resolved')));
const coarse=simulateWaves(defaultCase(),.3,90,96),fine=simulateWaves(defaultCase(),.3,90,160);
const firstArrival=r=>{const peak=r.reference.reduce((m,v)=>Math.max(m,Math.abs(v)),0),i=r.reference.findIndex(v=>Math.abs(v)>.05*peak);return i/(r.frames-1)*r.duration;};
check('First-arrival estimate stable within 10 microseconds under refinement',Math.abs(firstArrival(coarse)-firstArrival(fine))<10e-6,{coarse:firstArrival(coarse),fine:firstArrival(fine)});
let difference=0,signal=0;for(let i=0;i<fine.frames;i++){const t=i/(fine.frames-1)*fine.duration,x=t/coarse.duration*(coarse.frames-1),a=Math.min(coarse.frames-1,Math.floor(x)),b=Math.min(coarse.frames-1,a+1),v=coarse.reference[a]+(coarse.reference[b]-coarse.reference[a])*(x-a);difference+=(v-fine.reference[i])**2;signal+=fine.reference[i]**2;}
const refinement={firstArrivalCoarse:firstArrival(coarse),firstArrivalFine:firstArrival(fine),relativeFullTraceL2:Math.sqrt(difference/signal),lateWaveformQualified:false};
writeFileSync('verification/results/p13.json',JSON.stringify({scope:'Elastic-lattice consistency, independent dispersion and planar reflection references; not physical wood/UB1000 validation',checks,refinement,timing:{soundMs:sound.elapsedMs,cavityMs:cavity.elapsedMs,decayMs:decay.elapsedMs}},null,2));
console.log(`${checks.length} P13 elastic-wave checks passed.`);

