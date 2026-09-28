import {SOILS,diameterAt,validateCase,loadApplicationHeight,type PoleCase} from '../../domain/model.ts';
import {hermite,sectionProperties} from '../beam.ts';

type Pair=[number,number];
/** Associative circular yield surface for a distributed lateral soil spring.
 * k: N/m²; limit: N/m; displacement and plastic slip: m. Trial states are pure.
 * Perfect plasticity is an illustrative law, not a calibrated p-y soil model. */
export function soilReturn(y:Pair,plastic:Pair,k:number,limit:number){
 if(!(k>0&&limit>0)||![...y,...plastic,k,limit].every(Number.isFinite))throw Error('Invalid soil spring input.');
 const trial:Pair=[k*(y[0]-plastic[0]),k*(y[1]-plastic[1])],norm=Math.hypot(...trial);
 if(norm<=limit)return {force:trial,tangent:[k,0,0,k],plastic:[...plastic] as Pair,dissipation:0,yielded:false};
 const a=trial[0]/norm,b=trial[1]/norm,t=k*limit/norm,slip=(norm-limit)/k;
 return {force:[limit*a,limit*b] as Pair,tangent:[t*b*b,-t*a*b,-t*a*b,t*a*a],plastic:[plastic[0]+slip*a,plastic[1]+slip*b] as Pair,dissipation:limit*slip,yielded:true};
}
function spd(matrix:Float64Array,rhs:Float64Array){
 const n=rhs.length,a=new Float64Array(matrix),b=new Float64Array(rhs),s=Float64Array.from(b,(_,i)=>Math.sqrt(a[i*n+i]));
 for(let i=0;i<n;i++){if(!(s[i]>0))throw Error('No stable soil tangent.');b[i]/=s[i];for(let j=0;j<n;j++)a[i*n+j]/=s[i]*s[j];}
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let v=a[i*n+j];for(let k=0;k<j;k++)v-=a[i*n+k]*a[j*n+k];if(i===j){if(v<1e-13)throw Error('Soil tangent lost restraint; no converged equilibrium.');a[i*n+i]=Math.sqrt(v);}else a[i*n+j]=v/a[j*n+j];}
 for(let i=0;i<n;i++){for(let j=0;j<i;j++)b[i]-=a[i*n+j]*b[j];b[i]/=a[i*n+i];}
 for(let i=n-1;i>=0;i--){for(let j=i+1;j<n;j++)b[i]-=a[j*n+i]*b[j];b[i]/=a[i*n+i];}
 return Float64Array.from(b,(v,i)=>v/s[i]);
}
interface Spring{z:number;weight:number;k:number;limit:number;H:number[];ix:number[];iy:number[]}
/** Coupled beam / history-dependent soil; independently checked research law. Never unit-load scaled.
 * Bending remains elastic, small-displacement; no timber failure/capacity output.
 * Requested load path is in N, east/north. Failed increments never commit slip. */
export function soilYieldStudy(p:PoleCase,path:Pair[],segments=32,increments=12){
 const started=performance.now(),errors=validateCase(p);if(errors.length)throw Error(errors[0]);
 if(p.soil==='Fixed')throw Error('Soil study needs embedded soil restraint.');
 if(!Number.isInteger(segments)||segments<8||!Number.isInteger(increments)||increments<1||!path.length||path.some(q=>q.length!==2||!q.every(Number.isFinite)))throw Error('Invalid research path or resolution.');
 const top=p.length-p.embedment,loadZ=loadApplicationHeight(p),zs=[...new Set([-p.embedment,0,loadZ,top,...Array.from({length:segments-1},(_,i)=>-p.embedment+p.length*(i+1)/segments),...Array.from({length:15},(_,i)=>-p.embedment*(i+1)/16),...p.regions.flatMap(r=>[r.zMin,r.zMax,(r.zMin+r.zMax)/2]).filter(z=>z>=-p.embedment&&z<=top)].map(z=>Math.round(z*1e8)/1e8))].sort((a,b)=>a-b),n=zs.length*4,loadNode=zs.indexOf(loadZ),loadX=loadNode*4,loadY=loadX+2,K=new Float64Array(n*n),springs:Spring[]=[],soil=SOILS[p.soil];
 const bending:{ix:number[];iy:number[];B:number[];L:number;xx:number;yy:number;xy:number;weight:number}[]=[];
 const gauss=[[(1-Math.sqrt(3/5))/2,5/18],[.5,4/9],[(1+Math.sqrt(3/5))/2,5/18]];
 for(let e=0;e<zs.length-1;e++){const L=zs[e+1]-zs[e],ix=[4*e,4*e+1,4*e+4,4*e+5],iy=ix.map(i=>i+2);
  for(const [t,w] of gauss){const z=zs[e]+t*L,{H,B}=hermite(t,L),s=sectionProperties(p,z),weight=w*L;
   bending.push({ix,iy,B,L,xx:s.xx,yy:s.yy,xy:s.xy,weight:p.material.E*weight});
   for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=p.material.E*B[i]*B[j]*weight;K[ix[i]*n+ix[j]]+=s.xx*v;K[iy[i]*n+iy[j]]+=s.yy*v;K[ix[i]*n+iy[j]]+=s.xy*v;K[iy[i]*n+ix[j]]+=s.xy*v;}
   if(z<0){const d=diameterAt(p,z);springs.push({z,weight,k:soil.k*(.25-z)*d/.32,limit:(soil.pressure0-soil.pressureGradient*z)*d,H,ix,iy});}
  }
 }
 let u=new Float64Array(n),plastic=springs.map(()=>[0,0] as Pair),load:Pair=[0,0],dissipation=0,totalIterations=0;
 function evaluate(v:Float64Array,target:Pair){const force=new Float64Array(n),tangent=new Float64Array(K);// Recover internal force from element curvature, avoiding cancellation in K*u.
  for(const b of bending){const curvature=(ids:number[])=>{const chord=(v[ids[2]]-v[ids[0]])/b.L;return b.B[1]*(v[ids[1]]-chord)+b.B[3]*(v[ids[3]]-chord);},x=curvature(b.ix),y=curvature(b.iy);for(let i=0;i<4;i++){force[b.ix[i]]+=b.B[i]*b.weight*(b.xx*x+b.xy*y);force[b.iy[i]]+=b.B[i]*b.weight*(b.xy*x+b.yy*y);}}

  const states=springs.map((s,k)=>{const y:Pair=[s.H.reduce((a,h,i)=>a+h*v[s.ix[i]],0),s.H.reduce((a,h,i)=>a+h*v[s.iy[i]],0)],r=soilReturn(y,plastic[k],s.k,s.limit);
   for(let i=0;i<4;i++){force[s.ix[i]]+=s.H[i]*r.force[0]*s.weight;force[s.iy[i]]+=s.H[i]*r.force[1]*s.weight;
    for(let j=0;j<4;j++){const h=s.H[i]*s.H[j]*s.weight;tangent[s.ix[i]*n+s.ix[j]]+=h*r.tangent[0];tangent[s.ix[i]*n+s.iy[j]]+=h*r.tangent[1];tangent[s.iy[i]*n+s.ix[j]]+=h*r.tangent[2];tangent[s.iy[i]*n+s.iy[j]]+=h*r.tangent[3];}}
   return r;});force[loadX]-=target[0];force[loadY]-=target[1];let arithmeticScale=0;for(let i=0;i<n;i++){let row=0;for(let j=0;j<n;j++)row+=Math.abs(K[i*n+j]*v[j]);arithmeticScale=Math.max(arithmeticScale,row);}return {residual:force,tangent,states,norm:Math.max(...force.map(Math.abs)),roundoff:32*Number.EPSILON*arithmeticScale};
 }
 // Independent physical gate at every converged increment: a large numerical
 // arithmetic floor must never admit an unbalanced mechanism/overload.
 function balanced(states:ReturnType<typeof soilReturn>[],target:Pair){const force=[0,0],moment=[0,0];springs.forEach((q,i)=>{for(let k=0;k<2;k++){force[k]+=states[i].force[k]*q.weight;moment[k]+=q.z*states[i].force[k]*q.weight;}});return Math.hypot(force[0]-target[0],force[1]-target[1])<.001&&Math.hypot(moment[0]-target[0]*loadZ,moment[1]-target[1]*loadZ)<.01;}
 const rows=[];
 for(const target of path){const previous=[...load] as Pair;
  for(let step=1;step<=increments;step++){const next:Pair=target.map((v,i)=>previous[i]+(v-previous[i])*step/increments) as Pair;let trial=new Float64Array(u),state=evaluate(trial,next),converged=false;
   for(let iteration=0;iteration<60;iteration++){totalIterations++;if(state.norm<Math.max(state.roundoff,1e-8*Math.max(1,...path.map(q=>Math.hypot(...q))))&&balanced(state.states,next)){converged=true;break;}
    // A componentwise arithmetic floor accounts for cancellation on short spans.
    // The production adapter separately gates summed force (1 mN) and moment (0.01 N m).
    const du=spd(state.tangent,Float64Array.from(state.residual,v=>-v));let accepted=false;
    for(let alpha=1;alpha>=1/1024;alpha/=2){const candidate=Float64Array.from(trial,(v,i)=>v+alpha*du[i]),check=evaluate(candidate,next);if(check.norm<state.norm){trial=candidate;state=check;accepted=true;break;}}
    if(!accepted)throw Error(`Soil load increment did not converge at ${next}; residual ${state.norm}; trial slip not committed.`);
   }
   if(!converged)throw Error('Soil iteration limit; trial slip not committed.');
   u=trial;plastic=state.states.map(r=>r.plastic);dissipation+=state.states.reduce((a,r,i)=>a+r.dissipation*springs[i].weight,0);load=next;
  }
  const final=evaluate(u,target),reaction:Pair=[0,0],moment:Pair=[0,0];springs.forEach((s,i)=>{for(const k of [0,1]){reaction[k]-=final.states[i].force[k]*s.weight;moment[k]-=s.z*final.states[i].force[k]*s.weight;}});
  rows.push({load:[...target],tip:[u[n-4],u[n-2]],reaction,moment,residual:final.norm,roundoffFloor:final.roundoff,dissipation,plasticSpringCount:plastic.filter(q=>Math.hypot(...q)>1e-10).length,maxPlasticSlip:Math.max(...plastic.map(q=>Math.hypot(...q))),plasticDepths:springs.filter((s,i)=>Math.hypot(...plastic[i])>1e-10).map(s=>s.z),z:zs,displacements:Array.from(u)});
 }
 return {basis:'research-p14-elastoplastic-soil',production:false,rows,iterations:totalIterations,elapsedMs:performance.now()-started};
}

