import {elasticAt,type Elasticity} from './material.ts';
/** P07 curved solid preview; local failure measures remain unqualified.
 * Isoparametric T10 geometry and displacement use the same quadratic basis.
 * No stress correction or affine recovery is applied to curved elements. */
import {EDGES,inverse,geometry,pcg,type Vec3,type SolidMesh} from './kernel.ts';
import {diameterAt,type PoleCase} from '../../domain/model.ts';

export function gauss(order:number){
  if(order===3)return [[(1-Math.sqrt(3/5))/2,5/18],[.5,4/9],[(1+Math.sqrt(3/5))/2,5/18]];
  if(order===4)return [-.8611363115940526,-.3399810435848563,.3399810435848563,.8611363115940526].map((v,i)=>[(v+1)/2,[.3478548451374539,.6521451548625461,.6521451548625461,.3478548451374539][i]/2]);
  if(order===5)return [-.906179845938664,-.5384693101056831,0,.5384693101056831,.906179845938664].map((v,i)=>[(v+1)/2,[.2369268850561891,.4786286704993665,.5688888888888889,.4786286704993665,.2369268850561891][i]/2]);
  throw Error('Use a verified quadrature order (3, 4 or 5).');
}
export function volumeRule(order=4){const rule:{L:number[];w:number}[]=[];for(const [u,wu] of gauss(order))for(const [v,wv] of gauss(order))for(const [t,wt] of gauss(order)){const x=u,y=(1-u)*v,z=(1-u)*(1-v)*t;rule.push({L:[1-x-y-z,x,y,z],w:wu*wv*wt*(1-u)**2*(1-v)});}return rule;}
export function basis(L:number[]){
  const g=[[-1,-1,-1],[1,0,0],[0,1,0],[0,0,1]],N=[...L.map(v=>v*(2*v-1)),...EDGES.map(([a,b])=>4*L[a]*L[b])],dN=[...g.map((v,i)=>v.map(x=>x*(4*L[i]-1))),...EDGES.map(([a,b])=>g[a].map((x,k)=>4*(x*L[b]+g[b][k]*L[a])))];return {N,dN};
}
const det3=(a:number[][])=>a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
export function mappedPoint(points:Vec3[],L:number[]){
  const {N,dN}=basis(L),x=[0,1,2].map(k=>points.reduce((s,p,i)=>s+p[k]*N[i],0)),J=[0,1,2].map(k=>[0,1,2].map(j=>points.reduce((s,p,i)=>s+p[k]*dN[i][j],0))),det=det3(J);
  if(Math.abs(det)<1e-17)throw Error('Degenerate curved element.');
  const inv=inverse(J),grads=dN.map(row=>[0,1,2].map(k=>row.reduce((s,d,j)=>s+d*inv[j][k],0))),B=Array.from({length:6},()=>new Float64Array(30));
  grads.forEach(([a,b,c],i)=>{const k=i*3;B[0][k]=a;B[1][k+1]=b;B[2][k+2]=c;B[3][k]=b;B[3][k+1]=a;B[4][k+1]=c;B[4][k+2]=b;B[5][k]=c;B[5][k+2]=a;});return {N,x,J,det,B};
}
export function curvedElement(points:Vec3[],D:Elasticity,factor=1,order=4){
  const K=new Float64Array(900),centre=mappedPoint(points,[.25,.25,.25,.25]),samples=volumeRule(order).map(q=>{const m=mappedPoint(points,q.L);if(m.det*centre.det<=0)throw Error('Curved element Jacobian changes sign.');return {...m,w:q.w*Math.abs(m.det)};});
  // Check edges/vertices as well as quadrature sites; not a mathematical global positivity proof.
  for(const L of [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],...EDGES.map(([a,b])=>[0,1,2,3].map(i=>i===a||i===b?.5:0))])if(mappedPoint(points,L).det*centre.det<=0)throw Error('Curved element folds at its boundary.');
  for(const {B,w,x} of samples){const DB=elasticAt(D,x).map(row=>Float64Array.from({length:30},(_,i)=>row.reduce((s,d,k)=>s+d*B[k][i],0)));for(let i=0;i<30;i++)for(let j=0;j<=i;j++){let v=0;for(let k=0;k<6;k++)v+=B[k][i]*DB[k][j];v*=w*factor;K[i*30+j]+=v;if(i!==j)K[j*30+i]+=v;}}
  return {K,centre,samples};
}

/** Project shared boundary midnodes only; original P05 mesh is preserved. */
export function curveMesh(input:SolidMesh,p:PoleCase,inner=false):SolidMesh{
  const m=structuredClone(input),seen=new Set<number>(),r=p.regions[0],sh=r.shape;if(sh.type!=='ellipse')throw Error('Unsupported shape');const centre=[sh.centreX,sh.centreY,(r.zMin+r.zMax)/2],half=(r.zMax-r.zMin)/2,co=Math.cos(sh.angle*Math.PI/180),si=Math.sin(sh.angle*Math.PI/180);
  const terms=(v:Vec3)=>{const x=v[0]-centre[0],y=v[1]-centre[1],z=v[2]-centre[2];return [((x*co+y*si)/sh.radiusX)**2+((-x*si+y*co)/sh.radiusY)**2,(z/half)**6];};
  const onInner=(v:Vec3)=>Math.abs(terms(v).reduce((a,b)=>a+b,0)-1)<1e-7,onOuter=(v:Vec3)=>Math.abs(Math.hypot(v[0],v[1])-diameterAt(p,v[2])/2)<1e-9;
  for(const ns of m.tets)EDGES.forEach(([a,b],k)=>{const n=ns[k+4];if(seen.has(n))return;seen.add(n);const v=m.points[n],pa=m.points[ns[a]],pb=m.points[ns[b]];
    if(onOuter(pa)&&onOuter(pb)){const ratio=diameterAt(p,v[2])/2/Math.hypot(v[0],v[1]);v[0]*=ratio;v[1]*=ratio;}
    else if(inner&&onInner(pa)&&onInner(pb)){const [A,B]=terms(v);let lo=0,hi=8;for(let j=0;j<55;j++){const t=(lo+hi)/2;if(A*t*t+B*t**6>1)hi=t;else lo=t;}m.points[n]=v.map((x,k)=>centre[k]+(x-centre[k])*(lo+hi)/2) as Vec3;}
  });return m;
}

export function curvedEndLoads(m:SolidMesh,force:Vec3,bending:[number,number]){
  const samples:{face:number[];N:number[];x:number;y:number;w:number}[]=[];let area=0,ax=0,ay=0,xx=0,xy=0,yy=0;
  for(const face of m.top)for(const [u,wu] of gauss(4))for(const [v,wv] of gauss(4)){
    const L=[1-u-(1-u)*v,u,(1-u)*v],g=[[-1,-1],[1,0],[0,1]],edges=[[0,1],[1,2],[2,0]],N=[...L.map(x=>x*(2*x-1)),...edges.map(([a,b])=>4*L[a]*L[b])],dN=[...g.map((v,i)=>v.map(x=>(4*L[i]-1)*x)),...edges.map(([a,b])=>g[a].map((x,k)=>4*(x*L[b]+g[b][k]*L[a])))],ps=face.map(n=>m.points[n]),x=ps.reduce((s,p,i)=>s+p[0]*N[i],0),y=ps.reduce((s,p,i)=>s+p[1]*N[i],0),J=[0,1].map(k=>[0,1].map(j=>ps.reduce((s,p,i)=>s+p[k]*dN[i][j],0))),w=Math.abs(J[0][0]*J[1][1]-J[0][1]*J[1][0])*wu*wv*(1-u);
    samples.push({face,N,x,y,w});area+=w;ax+=w*x;ay+=w*y;xx+=w*x*x;xy+=w*x*y;yy+=w*y*y;
  }
  const C=inverse([[area,ax,ay],[ax,xx,xy],[ay,xy,yy]]),target=[force[2],-bending[0],-bending[1]],c=C.map(row=>row.reduce((s,v,i)=>s+v*target[i],0)),loads=new Float64Array(m.points.length*3);
  for(const q of samples)q.face.forEach((n,i)=>[force[0]/area,force[1]/area,c[0]+c[1]*q.x+c[2]*q.y].forEach((v,k)=>loads[n*3+k]+=q.w*q.N[i]*v));return {loads,area,xx,xy,yy};
}

export function solveCurved(m:SolidMesh,D:Elasticity,loads:Float64Array,fixed:Map<number,number>,order=4){
  const start=performance.now(),nd=m.points.length*3,free:number[]=[],map=new Int32Array(nd).fill(-1);for(let i=0;i<nd;i++)if(!fixed.has(i)){map[i]=free.length;free.push(i);}const rows=free.map(()=>new Map<number,number>()),rhs=Float64Array.from(free,i=>loads[i]),matrices:Float64Array[]=[];
  m.tets.forEach((ns,el)=>{const {K}=curvedElement(ns.map(n=>m.points[n]),D,m.factors[el],order);matrices.push(K);const ids=ns.flatMap(n=>[n*3,n*3+1,n*3+2]);for(let i=0;i<30;i++){const at=map[ids[i]];if(at<0)continue;for(let j=0;j<30;j++){const to=map[ids[j]],v=K[i*30+j];if(to<0)rhs[at]-=v*fixed.get(ids[j])!;else if(v)rows[at].set(to,(rows[at].get(to)??0)+v);}}});
  const answer=free.length?pcg(rows,rhs,1e-9,3000):{x:new Float64Array(0),iterations:0,relativeResidual:0},u=new Float64Array(nd),internal=new Float64Array(nd);fixed.forEach((v,k)=>u[k]=v);free.forEach((k,i)=>u[k]=answer.x[i]);let energy=0;
  const centroidStress=m.tets.map((ns,el)=>{const ids=ns.flatMap(n=>[n*3,n*3+1,n*3+2]),ue=ids.map(i=>u[i]),K=matrices[el],B=mappedPoint(ns.map(n=>m.points[n]),[.25,.25,.25,.25]).B;ids.forEach((id,i)=>{let f=0;for(let j=0;j<30;j++)f+=K[i*30+j]*ue[j];internal[id]+=f;energy+=ue[i]*f/2;});const e=B.map(row=>row.reduce((s,v,i)=>s+v*ue[i],0));return elasticAt(D,mappedPoint(ns.map(n=>m.points[n]),[.25,.25,.25,.25]).x).map(row=>m.factors[el]*row.reduce((s,v,i)=>s+v*e[i],0));});
  let freeResidualN=0;for(const i of free)freeResidualN=Math.max(freeResidualN,Math.abs(internal[i]-loads[i]));if(freeResidualN>Math.max(1,rhs.reduce((m,v)=>Math.max(m,Math.abs(v)),0),loads.reduce((m,v)=>Math.max(m,Math.abs(v)),0))*2e-6)throw Error('Curved solve physical residual failed.');
  return {displacements:u,internal,centroidStress,energy,freeResidualN,iterations:answer.iterations,relativeResidual:answer.relativeResidual,elapsedMs:performance.now()-start};
}
