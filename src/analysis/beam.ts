import {bendingResistance} from '../domain/species.ts';
import {conditionAt,diameterAt,SOILS,validateCase,defectDistance} from '../domain/model.ts';
import type {PoleCase} from '../domain/model.ts';

export interface SectionProperties {area:number;cx:number;cy:number;xx:number;yy:number;xy:number;remaining:number}
export interface Station extends SectionProperties {z:number;ux:number;uy:number;kx:number;ky:number;stressMin:number;stressMax:number;usage:number}
export interface AnalysisResult {
  nonlinear?:{path:[number,number][];plasticDepths:number[];plasticSlip:number;dissipation:number;residualTip:number;referenceLimits:true};
  kinematics?:{z:number;ux:number;uy:number;rx:number;ry:number}[];
  status:'solved'; version:'beam-p08'|'beam-p16'; elapsedMs:number; nodes:number; stations:Station[];
  tipX:number;tipY:number;tipMovement:number; timberLimitKN:number;soilLimitKN:number|null;limitKN:number;
  governingZ:number;governing:'Timber bending'|'Soil response limit';timberZ:number;utilisation:number;
  reactionX:number;reactionY:number;momentX:number;momentY:number;balance:number;soilMovement:number;maxRotation:number;
  warnings:string[];basis:string;
}
const PI=Math.PI;
export function sectionProperties(p:PoleCase,z:number,nr=20,na=64):SectionProperties {
  const R=diameterAt(p,z)/2,A=PI*R*R;
  const holes=p.regions.filter(r=>r.kind==='drilling'&&z>=r.zMin&&z<=r.zMax);
  if(holes.length){
    // Integrate narrow radial cuts directly: polar sampling can miss small bores.
    // Subtract surviving timber only, once across overlapping drill holes.
    const base={...p,regions:p.regions.filter(r=>r.kind!=='drilling')},s=sectionProperties(base,z,nr,na);
    let a=s.area,ax=a*s.cx,ay=a*s.cy,xx=s.xx+a*s.cx*s.cx,yy=s.yy+a*s.cy*s.cy,xy=s.xy+a*s.cx*s.cy,remaining=s.remaining*A;
    holes.forEach((r,index)=>{const d=r.drilling!,h=(r.zMin+r.zMax)/2,w=Math.sqrt(Math.max(0,(d.diameter/2)**2-(z-h)**2)),angle=d.bearing*PI/180,si=Math.sin(angle),co=Math.cos(angle),bottom=diameterAt(p,h)/2-d.depth;
      for(let j=0;j<64;j++){const transverse=-w+(j+.5)*2*w/64,edge=Math.sqrt(Math.max(0,R*R-transverse*transverse)),lo=Math.max(-edge,bottom),hi=edge;if(hi<=lo)continue;
        for(let k=0;k<12;k++){const along=lo+(k+.5)*(hi-lo)/12,x=along*si+transverse*co,y=along*co-transverse*si;if(holes.slice(0,index).some(previous=>defectDistance(p,previous,x,y,z)<=1))continue;const c=conditionAt(base,x,y,z),da=2*w/64*(hi-lo)/12,weight=da*c.e;a-=weight;ax-=weight*x;ay-=weight*y;xx-=weight*x*x;yy-=weight*y*y;xy-=weight*x*y;if(!c.voided)remaining-=da;}
      }
    });
    if(a<1e-8)throw new Error('A section has no supported continuous timber.');const cx=ax/a,cy=ay/a;return {area:a,cx,cy,xx:xx-a*cx*cx,yy:yy-a*cy*cy,xy:xy-a*cx*cy,remaining:remaining/A};
  }
  if(!p.regions.some(r=>z>=r.zMin&&z<=r.zMax))return {area:A,cx:0,cy:0,xx:PI*R**4/4,yy:PI*R**4/4,xy:0,remaining:1};
  let a=0,ax=0,ay=0,xx=0,yy=0,xy=0,remaining=0;
  for(let j=0;j<nr;j++){
    const lo=R*j/nr,hi=R*(j+1)/nr,r=Math.sqrt((lo*lo+hi*hi)/2),da=PI*(hi*hi-lo*lo)/na;
    for(let k=0;k<na;k++){
      const theta=(k+.5)*2*PI/na,x=r*Math.cos(theta),y=r*Math.sin(theta),c=conditionAt(p,x,y,z),w=da*c.e;
      a+=w;ax+=w*x;ay+=w*y;xx+=w*x*x;yy+=w*y*y;xy+=w*x*y;remaining+=c.voided?0:da;
    }
  }
  if(a<1e-8)throw new Error('A section has no supported continuous timber. Reduce the hollow region.');
  const cx=ax/a,cy=ay/a;
  return {area:a,cx,cy,xx:xx-a*cx*cx,yy:yy-a*cy*cy,xy:xy-a*cx*cy,remaining:remaining/A};
}
export function hermite(t:number,L:number) {
  return {H:[1-3*t*t+2*t*t*t,L*(t-2*t*t+t*t*t),3*t*t-2*t*t*t,L*(-t*t+t*t*t)],B:[(-6+12*t)/L**2,(-4+6*t)/L,(6-12*t)/L**2,(-2+6*t)/L]};
}
function solveSPD(K:Float64Array,f:Float64Array,n:number) {
  const scale=Float64Array.from({length:n},(_,i)=>Math.sqrt(K[i*n+i]));
  const a=new Float64Array(K),rhs=new Float64Array(f);
  for(let i=0;i<n;i++) {if(!Number.isFinite(scale[i])||scale[i]<=0)throw new Error('The pole has no stable restraint.');rhs[i]/=scale[i];for(let j=0;j<n;j++)a[i*n+j]/=scale[i]*scale[j];}
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
    let sum=a[i*n+j];for(let k=0;k<j;k++)sum-=a[i*n+k]*a[j*n+k];
    if(i===j){if(sum<1e-13)throw new Error('The model is unstable or too ill-conditioned to assess.');a[i*n+j]=Math.sqrt(sum);}else a[i*n+j]=sum/a[j*n+j];
  }
  for(let i=0;i<n;i++){for(let j=0;j<i;j++)rhs[i]-=a[i*n+j]*rhs[j];rhs[i]/=a[i*n+i];}
  for(let i=n-1;i>=0;i--){for(let j=i+1;j<n;j++)rhs[i]-=a[j*n+i]*rhs[j];rhs[i]/=a[i*n+i];}
  return Float64Array.from(rhs,(v,i)=>v/scale[i]);
}
const gauss=[{t:(1-Math.sqrt(3/5))/2,w:5/18},{t:.5,w:4/9},{t:(1+Math.sqrt(3/5))/2,w:5/18}];
function soilAt(p:PoleCase,z:number) {
  if(z>=0||p.soil==='Fixed')return {k:0,limit:Infinity};
  const s=SOILS[p.soil],depth=-z,d=diameterAt(p,z);
  return {k:s.k*(.25+depth)*d/.32,limit:(s.pressure0+s.pressureGradient*depth)*d};
}
export function solvePole(p:PoleCase,segments=32):AnalysisResult {
  const start=performance.now(),errors=validateCase(p);if(errors.length)throw new Error(errors[0]);
  const h=p.length-p.embedment,first=p.soil==='Fixed'?0:-p.embedment;
  const locations=[first,0,h];
  for(let i=1;i<segments;i++)locations.push(first+(h-first)*i/segments);
  if(p.soil!=='Fixed')for(let i=1;i<8;i++)locations.push(-p.embedment*i/8);
  for(const r of p.regions)for(const z of [r.zMin,r.zMax,(r.zMin+r.zMax)/2])if(z>first&&z<h)locations.push(z);
  const zs=[...new Set(locations.map(z=>Math.round(z*1e8)/1e8))].sort((a,b)=>a-b),nn=zs.length,n=nn*4;
  const K=new Float64Array(n*n),f=new Float64Array(n),d=new Float64Array(n),theta=p.bearing*PI/180;
  // A 1 kN unit pattern permits exact scaling in this linear model, including at zero applied load.
  f[(nn-1)*4]=1000*Math.sin(theta);f[(nn-1)*4+2]=1000*Math.cos(theta);
  const integration:{L:number;ix:number[];iy:number[];H:number[];B:number[];s:SectionProperties;k:number;weight:number}[]=[];
  for(let el=0;el<nn-1;el++){
    const L=zs[el+1]-zs[el],ix=[el*4,el*4+1,el*4+4,el*4+5],iy=ix.map(v=>v+2);
    for(const q of gauss){
      const z=zs[el]+q.t*L,{H,B}=hermite(q.t,L),s=sectionProperties(p,z),soil=soilAt(p,z),weight=q.w*L;
      integration.push({L,ix,iy,H,B,s,k:soil.k,weight});
      for(let a=0;a<4;a++)for(let b=0;b<4;b++){
        const bend=p.material.E*B[a]*B[b]*weight,spring=H[a]*H[b]*soil.k*weight;
        K[ix[a]*n+ix[b]]+=s.xx*bend+spring;K[iy[a]*n+iy[b]]+=s.yy*bend+spring;
        K[ix[a]*n+iy[b]]+=s.xy*bend;K[iy[a]*n+ix[b]]+=s.xy*bend;
      }
    }
  }
  const offset=p.soil==='Fixed'?4:0,nf=n-offset,Kf=new Float64Array(nf*nf),ff=f.slice(offset);
  for(let i=0;i<nf;i++)for(let j=0;j<nf;j++)Kf[i*nf+j]=K[(i+offset)*n+j+offset];
  d.set(solveSPD(Kf,ff,nf),offset);
  // Recover compatible internal forces from element strains, avoiding K*d cancellation
  // on millimetre drilling spans. Iterative refinement uses the unchanged stiffness.
  function equilibrium(){const r=Float64Array.from(f,v=>-v);for(const q of integration){const curvature=(ids:number[])=>{const chord=(d[ids[2]]-d[ids[0]])/q.L;return q.B[1]*(d[ids[1]]-chord)+q.B[3]*(d[ids[3]]-chord);},x=curvature(q.ix),y=curvature(q.iy),ux=q.H.reduce((a,h,i)=>a+h*d[q.ix[i]],0),uy=q.H.reduce((a,h,i)=>a+h*d[q.iy[i]],0);for(let i=0;i<4;i++){r[q.ix[i]]+=q.weight*(p.material.E*q.B[i]*(q.s.xx*x+q.s.xy*y)+q.k*q.H[i]*ux);r[q.iy[i]]+=q.weight*(p.material.E*q.B[i]*(q.s.yy*y+q.s.xy*x)+q.k*q.H[i]*uy);}}return r;}
  let forces=equilibrium(),residual=Math.max(...forces.slice(offset).map(Math.abs));
  for(let pass=0;pass<4&&residual>1e-4;pass++){const correction=solveSPD(Kf,Float64Array.from(forces.slice(offset),v=>-v),nf);for(let i=offset;i<n;i++)d[i]+=correction[i-offset];forces=equilibrium();residual=Math.max(...forces.slice(offset).map(Math.abs));}
  if(residual>1e-3)throw new Error('Equilibrium check failed. This result has been withheld.');
  const stations:Station[]=[];
  let unitUsage=0,timberZ=0,soilUsage=0,soilZ=0,reactionX=0,reactionY=0,momentX=0,momentY=0,soilMovement=0,maxSlope=0;
  for(let el=0;el<nn-1;el++) {
    const L=zs[el+1]-zs[el],ix=[el*4,el*4+1,el*4+4,el*4+5],iy=ix.map(v=>v+2);
    for(const q of gauss) {
      const z=zs[el]+q.t*L,{H}=hermite(q.t,L),x=H.reduce((sum,a,i)=>sum+a*d[ix[i]],0),y=H.reduce((sum,a,i)=>sum+a*d[iy[i]],0),s=soilAt(p,z);
      reactionX-=s.k*x*q.w*L;reactionY-=s.k*y*q.w*L;momentX+=z*s.k*y*q.w*L;momentY-=z*s.k*x*q.w*L;
      if(z<0){const usage=s.k*Math.hypot(x,y)/s.limit;if(usage>soilUsage){soilUsage=usage;soilZ=z;}soilMovement=Math.max(soilMovement,Math.hypot(x,y));}
    }
    for(const t of [0,.5,1]){
      if(t===0&&el>0)continue;
      const z=zs[el]+t*L,{H,B}=hermite(t,L),s=sectionProperties(p,z),ux=H.reduce((v,a,i)=>v+a*d[ix[i]],0),uy=H.reduce((v,a,i)=>v+a*d[iy[i]],0),kx=B.reduce((v,a,i)=>v+a*d[ix[i]],0),ky=B.reduce((v,a,i)=>v+a*d[iy[i]],0),R=diameterAt(p,z)/2;
      let stressMin=0,stressMax=0,usage=0;
      for(let ri=1;ri<=12;ri++)for(let ai=0;ai<64;ai++){
        const r=R*ri/12,a=ai*2*PI/64,x=r*Math.cos(a),y=r*Math.sin(a),c=conditionAt(p,x,y,z);if(c.voided)continue;
        const stress=-p.material.E*c.e*((x-s.cx)*kx+(y-s.cy)*ky),strength=bendingResistance(p.material,stress,c);
        stressMin=Math.min(stressMin,stress);stressMax=Math.max(stressMax,stress);usage=Math.max(usage,Math.abs(stress)/strength);
      }
      if(usage>unitUsage){unitUsage=usage;timberZ=z;}
      stations.push({...s,z,ux:ux*p.loadKN,uy:uy*p.loadKN,kx:kx*p.loadKN,ky:ky*p.loadKN,stressMin:stressMin*p.loadKN,stressMax:stressMax*p.loadKN,usage:usage*p.loadKN});
    }
  }
  for(let i=0;i<nn;i++)maxSlope=Math.max(maxSlope,Math.hypot(d[i*4+1],d[i*4+3])*p.loadKN);
  if(p.soil==='Fixed'){
    reactionX=-f[n-4];reactionY=-f[n-2];momentX=h*f[n-2];momentY=-h*f[n-4];
    stations.unshift({...sectionProperties(p,-p.embedment),z:-p.embedment,ux:0,uy:0,kx:0,ky:0,stressMin:0,stressMax:0,usage:0});
  }
  const timberLimitKN=1/unitUsage,soilLimitKN=soilUsage>0?1/soilUsage:null,soilGoverns=soilLimitKN!==null&&soilLimitKN<timberLimitKN,limitKN=soilGoverns?soilLimitKN!:timberLimitKN;
  const warnings=[p.material.basis==='illustrative'?'Illustrative timber and soil properties; no field calibration.':'Pole bending reference: '+p.material.source+'. No grade, size, duration or code safety factors applied. Defect laws and soil remain illustrative.','Beam-recovered bending stresses. Shear, splitting, local buckling and fracture are not assessed.'];
  if(maxSlope>.15)warnings.push('Rotation exceeds the small-deflection range. Numerical results are extrapolated.');
  if(p.regions.some(r=>r.kind==='knot'))warnings.push('Knots use a prescribed grain-angle field and Hankinson stiffness/strength ratios in the beam. Knot-interface splitting is not assessed. Optional local solids use a separate prescribed fibre field; capacity stays beam-based.');
  if(p.regions.some(r=>r.kind==='drilling'))warnings.push('Drill bores remove timber from section properties. This beam result does not resolve local bore-edge concentrations. Optional bore solids are a separate preview; splitting and moisture effects are not assessed.');
  if(p.soil!=='Fixed'&&(Math.hypot(reactionX+f[n-4],reactionY+f[n-2])>.001||Math.hypot(momentX-h*f[n-2],momentY+h*f[n-4])>.01))throw Error('Physical foundation balance failed; result withheld.');
  const tipX=d[n-4]*p.loadKN,tipY=d[n-2]*p.loadKN;
  return {status:'solved',version:'beam-p08',kinematics:zs.map((z,i)=>({z,ux:d[i*4]*p.loadKN,rx:d[i*4+1]*p.loadKN,uy:d[i*4+2]*p.loadKN,ry:d[i*4+3]*p.loadKN})),elapsedMs:performance.now()-start,nodes:nn,stations,tipX,tipY,tipMovement:Math.hypot(tipX,tipY),timberLimitKN,soilLimitKN,limitKN,governingZ:soilGoverns?soilZ:timberZ,governing:soilGoverns?'Soil response limit':'Timber bending',timberZ,utilisation:p.loadKN/limitKN,reactionX:reactionX*p.loadKN,reactionY:reactionY*p.loadKN,momentX:momentX*p.loadKN,momentY:momentY*p.loadKN,balance:residual/1000,soilMovement:soilMovement*p.loadKN,maxRotation:maxSlope,warnings,basis:'Linear tapered Euler–Bernoulli beam FE + elastic distributed soil springs; first material-reference/soil limit, not ultimate failure.'};
}
/** Exact load-only update for this linear model. Input must be a 1 kN solve. */
export function scaleUnitResult(unit:AnalysisResult,loadKN:number):AnalysisResult {
  if(unit.nonlinear)throw Error('A history-dependent foundation result cannot be unit-load scaled.');
  const warnings=unit.warnings.filter(w=>!w.startsWith('Rotation exceeds'));
  if(unit.maxRotation*loadKN>.15)warnings.push('Rotation exceeds the small-deflection range. Numerical results are extrapolated.');
  return {...unit,kinematics:unit.kinematics?.map(q=>({...q,ux:q.ux*loadKN,uy:q.uy*loadKN,rx:q.rx*loadKN,ry:q.ry*loadKN})),stations:unit.stations.map(s=>({...s,ux:s.ux*loadKN,uy:s.uy*loadKN,kx:s.kx*loadKN,ky:s.ky*loadKN,stressMin:s.stressMin*loadKN,stressMax:s.stressMax*loadKN,usage:s.usage*loadKN})),tipX:unit.tipX*loadKN,tipY:unit.tipY*loadKN,tipMovement:unit.tipMovement*loadKN,reactionX:unit.reactionX*loadKN,reactionY:unit.reactionY*loadKN,momentX:unit.momentX*loadKN,momentY:unit.momentY*loadKN,soilMovement:unit.soilMovement*loadKN,maxRotation:unit.maxRotation*loadKN,utilisation:loadKN/unit.limitKN,warnings};
}
export function stationAt(result:AnalysisResult,z:number):Station {
  const a=result.stations;
  if(z<=a[0].z)return a[0];if(z>=a[a.length-1].z)return a[a.length-1];
  let hi=a.findIndex(s=>s.z>=z),lo=hi-1,t=(z-a[lo].z)/(a[hi].z-a[lo].z);
  const out={...a[lo]};for(const key of Object.keys(out) as (keyof Station)[])out[key]=a[lo][key]*(1-t)+a[hi][key]*t;
  return out;
}
export function stressAt(p:PoleCase,s:Station,x:number,y:number) {
  const c=conditionAt(p,x,y,s.z);
  return c.voided?null:-p.material.E*c.e*((x-s.cx)*s.kx+(y-s.cy)*s.ky);
}
/** Local timber bending demand / the local sign-dependent illustrative strength.
 * Missing wood has no stress or utilisation; it is not a zero-demand material.
 */
export function utilisationAt(p:PoleCase,s:Station,x:number,y:number) {
  const stress=stressAt(p,s,x,y);if(stress===null)return null;
  const c=conditionAt(p,x,y,s.z);
  return Math.abs(stress)/(bendingResistance(p.material,stress,c));
}


/** Exact Hermite beam kinematics for work-consistent displacement submodel cuts.
 * Differentiating linearly interpolated display stations introduces false rotation jumps. */
export function beamKinematicsAt(result:AnalysisResult,z:number){
 const nodes=result.kinematics;if(!nodes?.length)throw Error('Exact beam kinematics unavailable.');const hi=Math.max(1,Math.min(nodes.length-1,nodes.findIndex(q=>q.z>=z)<0?nodes.length-1:nodes.findIndex(q=>q.z>=z))),a=nodes[hi-1],b=nodes[hi],L=b.z-a.z,t=Math.max(0,Math.min(1,(z-a.z)/L)),{H,B}=hermite(t,L),G=[(-6*t+6*t*t)/L,1-4*t+3*t*t,(6*t-6*t*t)/L,-2*t+3*t*t],x=[a.ux,a.rx,b.ux,b.rx],y=[a.uy,a.ry,b.uy,b.ry],dot=(v:number[],u:number[])=>v.reduce((s,q,i)=>s+q*u[i],0);
 return {ux:dot(H,x),uy:dot(H,y),rx:dot(G,x),ry:dot(G,y),kx:dot(B,x),ky:dot(B,y)};
}
