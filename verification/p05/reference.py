"""Independent NumPy T10 assembly/traction integration from raw mesh.
Does not import TypeScript element matrices, shape functions or solver outputs as inputs.
The supplied TS solution is used only after the independent solution for comparison.
"""
import json,time
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'verification/p05/reference-input.json').read_text())
p=np.array(data['mesh']['points']); tets=np.array(data['mesh']['tets']); nd=3*len(p); E=data['E']; ET=E/10
S=np.array([[1/ET,-.35/ET,-.3/E],[-.35/ET,1/ET,-.3/E],[-.3/E,-.3/E,1/E]])
D=np.zeros((6,6)); D[:3,:3]=np.linalg.inv(S); D[3,3]=ET/2.7;D[4,4]=D[5,5]=.065*E
edges=[(0,1),(1,2),(2,0),(0,3),(1,3),(2,3)]
q=np.full((4,4),(5-np.sqrt(5))/20);np.fill_diagonal(q,(5+3*np.sqrt(5))/20)
def Bmatrix(inv,L):
    g=inv[1:,:].T
    dg=np.vstack([g*(4*L-1)[:,None],*[4*(L[j]*g[i]+L[i]*g[j]) for i,j in edges]])
    B=np.zeros((6,30))
    for i,(x,y,z) in enumerate(dg):
        j=3*i;B[0,j]=x;B[1,j+1]=y;B[2,j+2]=z;B[3,j]=y;B[3,j+1]=x;B[4,j+1]=z;B[4,j+2]=y;B[5,j]=z;B[5,j+2]=x
    return B
start=time.perf_counter();K=np.zeros((nd,nd)); geometries=[]
for ns,factor in zip(tets,data['mesh']['factors']):
    corners=p[ns[:4]]; M=np.column_stack([np.ones(4),corners]);inv=np.linalg.inv(M);V=abs(np.linalg.det(corners[1:]-corners[0]))/6
    Ke=np.zeros((30,30))
    for L in q:
        B=Bmatrix(inv,L);Ke+=B.T@D@B*V*factor/4
    ids=(3*ns[:,None]+np.arange(3)).ravel();K[np.ix_(ids,ids)]+=Ke;geometries.append((inv,ids,factor))
# Independent 7-point degree-five face integration (TS uses a six-point rule).
rule=[([1/3]*3,.225)]
for a,b,w in [(.470142064105115,.059715871789770,.132394152788506),(.101286507323456,.797426985353087,.125939180544827)]:
    for i in range(3):rule.append(([b if i==j else a for j in range(3)],w))
samples=[];M=np.zeros((3,3));area=0
for face in data['mesh']['top']:
    ps=p[face[:3]];A=np.linalg.norm(np.cross(ps[1]-ps[0],ps[2]-ps[0]))/2
    for L,w in rule:
        x,y,z=np.array(L)@ps;v=np.array([1,x,y]);M+=A*w*np.outer(v,v);area+=A*w;samples.append((face,L,A*w,v))
F=np.array(data['force']);coeff=np.linalg.solve(M,[F[2],-data['bending'][0],-data['bending'][1]]);f=np.zeros(nd)
for face,L,w,v in samples:
    a,b,c=L;N=np.array([a*(2*a-1),b*(2*b-1),c*(2*c-1),4*a*b,4*b*c,4*c*a]);traction=np.array([F[0]/area,F[1]/area,coeff@v]);ids=(3*np.array(face)[:,None]+np.arange(3)).ravel();f[ids]+=np.outer(N,traction).ravel()*w
fixed=(3*np.array(data['mesh']['bottom'])[:,None]+np.arange(3)).ravel();free=np.setdiff1d(np.arange(nd),fixed);u=np.zeros(nd);u[free]=np.linalg.solve(K[np.ix_(free,free)],f[free]);sig=np.array([D@Bmatrix(inv,np.full(4,.25))@u[ids]*fac for inv,ids,fac in geometries]);energy=.5*u@K@u
errors={'tractionRelative':float(np.max(abs(f-data['loads']))/np.max(abs(f))),'displacementRelative':float(np.max(abs(u-data['displacements']))/np.max(abs(u))),'stressRelative':float(np.max(abs(sig-data['stress']))/np.max(abs(sig))),'energyRelative':float(abs(energy-data['energy'])/energy),'freeResidualN':float(np.max(abs((K@u-f)[free])))}
limits={'tractionRelative':1e-10,'displacementRelative':2e-7,'stressRelative':2e-6,'energyRelative':1e-7,'freeResidualN':1e-6}
result={'implementation':'Independent NumPy dense T10 assembly and solve; shared raw mesh only','nodes':len(p),'elements':len(tets),'elapsedSeconds':time.perf_counter()-start,'errors':errors,'limits':limits,'pass':all(errors[k]<=v for k,v in limits.items())}
(root/'verification/results/p05-independent.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));assert result['pass']
