export type Vec3=[number,number,number];
export interface SolidMesh {points:Vec3[];tets:number[][];factors:number[];top:number[][];bottom:number[];surface:number[][];zMin:number;zMax:number}
export const EDGES=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]];
export const QUAD=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>i===j?.5854101966249685:.1381966011250105));
export function inverse(a:number[][]){const n=a.length,b=a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(i===j))]);for(let j=0;j<n;j++){let p=j;for(let i=j+1;i<n;i++)if(Math.abs(b[i][j])>Math.abs(b[p][j]))p=i;[b[j],b[p]]=[b[p],b[j]];const d=b[j][j];if(!Number.isFinite(d)||Math.abs(d)<1e-24)throw Error('Degenerate solid geometry/material.');for(let k=0;k<2*n;k++)b[j][k]/=d;for(let i=0;i<n;i++)if(i!==j){const f=b[i][j];for(let k=0;k<2*n;k++)b[i][k]-=f*b[j][k];}}return b.map(r=>r.slice(n));}
/** Engineering shear ordering xx, yy, zz, xy, yz, xz; z is longitudinal. */
export function orthotropicD(E:number,transverseRatio=.1,shearRatio=.065,nuLT=.3,nuTT=.35){
 const ET=E*transverseRatio,C=inverse([[1/ET,-nuTT/ET,-nuLT/E],[-nuTT/ET,1/ET,-nuLT/E],[-nuLT/E,-nuLT/E,1/E]]),D=Array.from({length:6},()=>Array(6).fill(0));
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)D[i][j]=C[i][j];D[3][3]=ET/(2*(1+nuTT));D[4][4]=D[5][5]=E*shearRatio;
 // Positive definiteness is a material admissibility gate, not a regularisation.
 const L=D.map(r=>r.slice());for(let i=0;i<6;i++)for(let j=0;j<=i;j++){let v=D[i][j];for(let k=0;k<j;k++)v-=L[i][k]*L[j][k];if(i===j){if(!(v>0))throw Error('Solid elasticity is not positive definite.');L[i][j]=Math.sqrt(v);}else L[i][j]=v/L[j][j];}return D;
}
export function geometry(points:Vec3[],nodes:number[]){const p=nodes.slice(0,4).map(n=>points[n]),inv=inverse(p.map(v=>[1,...v])),a=p[1].map((v,i)=>v-p[0][i]),b=p[2].map((v,i)=>v-p[0][i]),c=p[3].map((v,i)=>v-p[0][i]),det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);if(Math.abs(det)<1e-17)throw Error('Solid mesh contains a degenerate tetrahedron.');return {inv,volume:Math.abs(det)/6};}
export function strainB(inv:number[][],L:number[]){const g=[0,1,2,3].map(i=>[inv[1][i],inv[2][i],inv[3][i]]),grads=[...g.map((v,i)=>v.map(x=>(4*L[i]-1)*x)),...EDGES.map(([i,j])=>g[i].map((v,k)=>4*(v*L[j]+g[j][k]*L[i])))],B=Array.from({length:6},()=>new Float64Array(30));grads.forEach(([x,y,z],i)=>{const a=i*3;B[0][a]=x;B[1][a+1]=y;B[2][a+2]=z;B[3][a]=y;B[3][a+1]=x;B[4][a+1]=z;B[4][a+2]=y;B[5][a]=z;B[5][a+2]=x;});return B;}
export function elementK(inv:number[][],volume:number,D:number[][],factor=1){const K=new Float64Array(900);for(const q of QUAD){const B=strainB(inv,q),DB=D.map(row=>Float64Array.from({length:30},(_,j)=>row.reduce((sum,d,k)=>sum+d*B[k][j],0)));for(let i=0;i<30;i++)for(let j=0;j<=i;j++){let v=0;for(let k=0;k<6;k++)v+=B[k][i]*DB[k][j];v*=volume*factor/4;K[i*30+j]+=v;if(i!==j)K[j*30+i]+=v;}}return K;}
export function stress(inv:number[][],L:number[],D:number[][],u:ArrayLike<number>,factor=1){const B=strainB(inv,L),e=B.map(row=>row.reduce((s,b,i)=>s+b*u[i],0));return D.map(row=>factor*row.reduce((s,d,k)=>s+d*e[k],0));}

/** Sparse PCG, symmetrically scaled; shifted IC(0) is preconditioning ONLY.
 * Residuals always use the original assembled matrix. No stiffness is altered. */
export function pcg(rows:Map<number,number>[],rhs:Float64Array,tolerance:number,maxIterations:number){
 const n=rows.length,scale=Float64Array.from(rows,(r,i)=>Math.sqrt(r.get(i)??0));if(scale.some(v=>!Number.isFinite(v)||v<=0))throw Error('Disconnected or unsupported solid DOF.');
 const ids=rows.map(r=>Int32Array.from([...r.keys()].sort((a,b)=>a-b))),vals=rows.map((r,i)=>Float64Array.from(ids[i],j=>r.get(j)!/(scale[i]*scale[j]))),b=Float64Array.from(rhs,(v,i)=>v/scale[i]);
 const matvec=(x:Float64Array)=>Float64Array.from(ids,(row,i)=>{let v=0;for(let k=0;k<row.length;k++)v+=vals[i][k]*x[row[k]];return v;});
 const lowerIds=ids.map((r,i)=>r.filter(j=>j<i)),lowerVals=lowerIds.map(r=>new Float64Array(r.length)),diag=new Float64Array(n);let shift=0,ready=false;
 for(const trial of [0,.001,.01,.1,1,10]){ready=true;shift=trial;for(let i=0;i<n;i++){const a=lowerIds[i],v=lowerVals[i];for(let j=0;j<a.length;j++){const col=a[j],other=lowerIds[col],ov=lowerVals[col];let sum=rows[i].get(col)!/(scale[i]*scale[col]),p=0,q=0;while(p<j&&q<other.length){if(a[p]===other[q]){sum-=v[p]*ov[q];p++;q++;}else if(a[p]<other[q])p++;else q++;}v[j]=sum/diag[col];}let d=1+trial;for(const x of v)d-=x*x;if(!(d>1e-12)){ready=false;break;}diag[i]=Math.sqrt(d);}if(ready)break;}
 if(!ready)throw Error('Solid preconditioner failed.');
 const precondition=(r:Float64Array)=>{const z=new Float64Array(r);for(let i=0;i<n;i++){for(let k=0;k<lowerIds[i].length;k++)z[i]-=lowerVals[i][k]*z[lowerIds[i][k]];z[i]/=diag[i];}for(let i=n-1;i>=0;i--){z[i]/=diag[i];for(let k=0;k<lowerIds[i].length;k++)z[lowerIds[i][k]]-=lowerVals[i][k]*z[i];}return z;};
 const dot=(a:Float64Array,c:Float64Array)=>a.reduce((s,v,i)=>s+v*c[i],0),x=new Float64Array(n);let r=new Float64Array(b),z=precondition(r),p=new Float64Array(z),rz=dot(r,z),iterations=0,relativeResidual=0;const norm=Math.sqrt(dot(b,b));
 if(norm>0)for(;iterations<maxIterations;iterations++){const Ap=matvec(p),den=dot(p,Ap);if(!(den>0))throw Error('Solid stiffness lost positive definiteness.');const alpha=rz/den;for(let i=0;i<n;i++){x[i]+=alpha*p[i];r[i]-=alpha*Ap[i];}if(iterations%30===29){const Ax=matvec(x);for(let i=0;i<n;i++)r[i]=b[i]-Ax[i];}relativeResidual=Math.sqrt(dot(r,r))/norm;if(relativeResidual<tolerance){iterations++;break;}z=precondition(r);const next=dot(r,z),beta=next/rz;for(let i=0;i<n;i++)p[i]=z[i]+beta*p[i];rz=next;}
 const Ax=matvec(x);relativeResidual=norm?Math.sqrt(Ax.reduce((s,v,i)=>s+(v-b[i])**2,0))/norm:0;if(relativeResidual>tolerance*2)throw Error(`Solid solve did not converge (${relativeResidual.toExponential(2)}).`);
 return {x:Float64Array.from(x,(v,i)=>v/scale[i]),iterations,relativeResidual,preconditionerShift:shift};
}
export interface SolidSolution {displacements:Float64Array;internal:Float64Array;energy:number;iterations:number;relativeResidual:number;freeResidualN:number;preconditionerShift:number;elapsedMs:number;centroidStress:number[][]}
export function solveSolid(mesh:SolidMesh,D:number[][],loads:Float64Array,prescribed:Map<number,number>,options:{tolerance?:number;maxIterations?:number}={}):SolidSolution{
 const started=performance.now(),nd=mesh.points.length*3,free:number[]=[],map=new Int32Array(nd).fill(-1);for(let i=0;i<nd;i++)if(!prescribed.has(i)){map[i]=free.length;free.push(i);}const rows=free.map(()=>new Map<number,number>()),rhs=Float64Array.from(free,i=>loads[i]);
 const geos=mesh.tets.map(ns=>geometry(mesh.points,ns));
 mesh.tets.forEach((ns,el)=>{const ids=ns.flatMap(n=>[3*n,3*n+1,3*n+2]),K=elementK(geos[el].inv,geos[el].volume,D,mesh.factors[el]);for(let i=0;i<30;i++){const at=map[ids[i]];if(at<0)continue;for(let j=0;j<30;j++){const v=K[i*30+j],to=map[ids[j]];if(to<0)rhs[at]-=v*prescribed.get(ids[j])!;else if(v!==0)rows[at].set(to,(rows[at].get(to)??0)+v);}}});
 const answer=free.length?pcg(rows,rhs,options.tolerance??1e-9,options.maxIterations??2500):{x:new Float64Array(0),iterations:0,relativeResidual:0,preconditionerShift:0},u=new Float64Array(nd);prescribed.forEach((v,k)=>u[k]=v);free.forEach((k,i)=>u[k]=answer.x[i]);
 const internal=new Float64Array(nd),centroidStress:number[][]=[];let energy=0;
 mesh.tets.forEach((ns,el)=>{const ids=ns.flatMap(n=>[3*n,3*n+1,3*n+2]),ue=Float64Array.from(ids,i=>u[i]),{inv,volume}=geos[el],factor=mesh.factors[el];centroidStress.push(stress(inv,[.25,.25,.25,.25],D,ue,factor));for(const q of QUAD){const B=strainB(inv,q),s=stress(inv,q,D,ue,factor),w=volume/4;for(let i=0;i<30;i++){let f=0;for(let k=0;k<6;k++)f+=B[k][i]*s[k];internal[ids[i]]+=f*w;energy+=ue[i]*f*w/2;}}});
 let freeResidualN=0;for(const i of free)freeResidualN=Math.max(freeResidualN,Math.abs(internal[i]-loads[i]));const forceScale=Math.max(1,loads.reduce((m,v)=>Math.max(m,Math.abs(v)),0),rhs.reduce((m,v)=>Math.max(m,Math.abs(v)),0));if(freeResidualN>forceScale*2e-6)throw Error('Solid physical force residual failed.');
 return {displacements:u,internal,energy,iterations:answer.iterations,relativeResidual:answer.relativeResidual,freeResidualN,preconditionerShift:answer.preconditionerShift,elapsedMs:performance.now()-started,centroidStress};
}
