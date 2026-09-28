/** Conservative vector spring discretisation of 2D isotropic elasticity.
 * Axis/diagonal bond stiffness ratio 2 gives long-wave lambda=mu, cp/cs=sqrt(3).
 * Missing bonds give free boundaries. Equal/opposite forces preserve momentum.
 * Explicit staggered velocity integration; split viscous drag removes energy.
 * This is an illustrative transverse elastic model, not calibrated wood acoustics. */
export interface WaveMedium {nx:number;ny:number;dx:number;density:Float32Array;speed:Float32Array;loss:Float32Array;periodicX?:boolean;periodicY?:boolean;bondAllowed?:(a:number,b:number)=>boolean}
export class ElasticWave {
 readonly ux:Float64Array;readonly uy:Float64Array;readonly vx:Float64Array;readonly vy:Float64Array;
 readonly fx:Float64Array;readonly fy:Float64Array;readonly mass:Float64Array;readonly dt:number;
 readonly a:Int32Array;readonly b:Int32Array;readonly ex:Float64Array;readonly ey:Float64Array;readonly stiffness:Float64Array;readonly drag:Float64Array;
 readonly medium:WaveMedium;
 constructor(medium:WaveMedium){this.medium=medium;
  const {nx,ny,dx,density,speed,loss}=medium,n=nx*ny;this.ux=new Float64Array(n);this.uy=new Float64Array(n);this.vx=new Float64Array(n);this.vy=new Float64Array(n);this.fx=new Float64Array(n);this.fy=new Float64Array(n);this.mass=Float64Array.from(density,r=>r*dx*dx);
  const a:number[]=[],b:number[]=[],ex:number[]=[],ey:number[]=[],stiff:number[]=[],sum=new Float64Array(n);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*nx+x;if(!density[i])continue;for(const [ox,oy] of [[1,0],[0,1],[1,1],[-1,1]]){let xx=x+ox,yy=y+oy;if(medium.periodicX)xx=(xx+nx)%nx;if(medium.periodicY)yy=(yy+ny)%ny;if(xx<0||xx>=nx||yy<0||yy>=ny)continue;const j=yy*nx+xx;if(!density[j]||medium.bondAllowed&&!medium.bondAllowed(i,j))continue;const ka=2/3*density[i]*speed[i]**2,kb=2/3*density[j]*speed[j]**2,k=2*ka*kb/(ka+kb)/(ox&&oy?2:1),len=Math.hypot(ox,oy);a.push(i);b.push(j);ex.push(ox/len);ey.push(oy/len);stiff.push(k);sum[i]+=k;sum[j]+=k;}}
  this.a=Int32Array.from(a);this.b=Int32Array.from(b);this.ex=Float64Array.from(ex);this.ey=Float64Array.from(ey);this.stiffness=Float64Array.from(stiff);
  let rate=0;for(let i=0;i<n;i++)if(this.mass[i])rate=Math.max(rate,2*sum[i]/this.mass[i]);if(!rate)throw Error('This section has no connected timber to simulate.');
  this.dt=.65*2/Math.sqrt(rate);this.drag=Float64Array.from(loss,g=>Math.exp(-Math.max(0,g)*this.dt));
 }
 step(source?:{ids:Int32Array;weights:Float64Array;x:number;y:number;force:number}){
  const {ux,uy,vx,vy,fx,fy,a,b,ex,ey,stiffness:k,mass,dt,drag}=this;fx.fill(0);fy.fill(0);
  for(let e=0;e<a.length;e++){const i=a[e],j=b[e],q=k[e]*((ux[j]-ux[i])*ex[e]+(uy[j]-uy[i])*ey[e]),x=q*ex[e],y=q*ey[e];fx[i]+=x;fy[i]+=y;fx[j]-=x;fy[j]-=y;}
  if(source)for(let j=0;j<source.ids.length;j++){const i=source.ids[j],f=source.force*source.weights[j];fx[i]+=f*source.x;fy[i]+=f*source.y;}
  for(let i=0;i<ux.length;i++){if(!mass[i])continue;vx[i]=(vx[i]+dt*fx[i]/mass[i])*drag[i];vy[i]=(vy[i]+dt*fy[i]/mass[i])*drag[i];ux[i]+=dt*vx[i];uy[i]+=dt*vy[i];}
 }
 energy(){let kinetic=0,strain=0;for(let i=0;i<this.mass.length;i++)kinetic+=.5*this.mass[i]*(this.vx[i]**2+this.vy[i]**2);for(let e=0;e<this.a.length;e++){const i=this.a[e],j=this.b[e],d=(this.ux[j]-this.ux[i])*this.ex[e]+(this.uy[j]-this.uy[i])*this.ey[e];strain+=.5*this.stiffness[e]*d*d;}return {kinetic,strain,total:kinetic+strain};}
}
