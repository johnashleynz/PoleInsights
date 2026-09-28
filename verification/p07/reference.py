"""Independent NumPy assembly of the P07 curved mesh; no TS matrices/B arrays used."""
import json, time
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'verification/p07/reference-input.json').read_text())
mesh=data['mesh']; xyz=np.array(mesh['points']); tets=np.array(mesh['tets']); n=len(xyz)*3
# Independent constitutive construction from the declared material assumptions.
E=data['case']['material']['E']; ET=.1*E
S=np.diag([1/ET,1/ET,1/E,2*1.35/ET,1/(.065*E),1/(.065*E)])
S[0,1]=S[1,0]=-.35/ET; S[0,2]=S[2,0]=S[1,2]=S[2,1]=-.3/E
C=np.linalg.inv(S)
edges=[(0,1),(1,2),(2,0),(0,3),(1,3),(2,3)]; dl=np.array([[-1,-1,-1],[1,0,0],[0,1,0],[0,0,1]])
def shapes(l):
    N=np.r_[l*(2*l-1),[4*l[a]*l[b] for a,b in edges]]
    dN=np.vstack([(4*l[:,None]-1)*dl,[4*(l[a]*dl[b]+l[b]*dl[a]) for a,b in edges]])
    return N,dN

def sample(coords,l):
    N,dN=shapes(l); J=coords.T@dN; gradients=np.linalg.solve(J.T,dN.T).T
    B=np.zeros((6,30))
    for i,(x,y,z) in enumerate(gradients):
        B[:,3*i:3*i+3]=[[x,0,0],[0,y,0],[0,0,z],[y,x,0],[0,z,y],[z,0,x]]
    return B,abs(np.linalg.det(J))
# 125 integration points, higher order than the TS 64-point solve.
g,w=np.polynomial.legendre.leggauss(5); g=(g+1)/2; w=w/2
rule=[]
for i,u in enumerate(g):
 for j,v in enumerate(g):
  for k,t in enumerate(g):
   x=u;y=(1-u)*v;z=(1-u)*(1-v)*t
   rule.append((np.array([1-x-y-z,x,y,z]),w[i]*w[j]*w[k]*(1-u)**2*(1-v)))
start=time.time(); K=np.zeros((n,n))
for el,ns in enumerate(tets):
    ke=np.zeros((30,30)); coords=xyz[ns]
    for l,weight in rule:
        B,jac=sample(coords,l); ke+=B.T@C@B*(jac*weight*mesh['factors'][el])
    ids=(3*ns[:,None]+np.arange(3)).ravel();K[np.ix_(ids,ids)]+=ke
# Independent curved top-face consistent loads using 25-point quadrature.
samples=[]
for ns in mesh['top']:
 ps=xyz[ns]
 for i,u in enumerate(g):
  for j,v in enumerate(g):
   l=np.array([1-u-(1-u)*v,u,(1-u)*v]);dl2=np.array([[-1,-1],[1,0],[0,1]])
   N=np.r_[l*(2*l-1),4*l[0]*l[1],4*l[1]*l[2],4*l[2]*l[0]]
   dn=np.vstack([(4*l[:,None]-1)*dl2,[4*(l[a]*dl2[b]+l[b]*dl2[a]) for a,b in [(0,1),(1,2),(2,0)]]])
   J=ps[:,:2].T@dn;weight=abs(np.linalg.det(J))*w[i]*w[j]*(1-u);point=N@ps
   samples.append((ns,N,point,weight))
M=np.zeros((3,3))
for ns,N,p,wq in samples:
 a=np.array([1,p[0],p[1]]);M+=np.outer(a,a)*wq
lever=data['case']['length']-data['case']['embedment']-mesh['zMax'];coeff=np.linalg.solve(M,[0,-1000*lever,0]);f=np.zeros(n)
for ns,N,p,wq in samples:
 traction=np.array([1000/M[0,0],0,coeff@[1,p[0],p[1]]])
 for node,v in zip(ns,N):f[node*3:node*3+3]+=traction*v*wq
fixed=np.array([int(i) for i,v in data['fixed']]);free=np.setdiff1d(np.arange(n),fixed);u=np.zeros(n);u[fixed]=[v for i,v in data['fixed']]
u[free]=np.linalg.solve(K[np.ix_(free,free)],f[free]-K[np.ix_(free,fixed)]@u[fixed])
stress=[]
for el,ns in enumerate(tets):
 B,_=sample(xyz[ns],np.full(4,.25));ids=(3*ns[:,None]+np.arange(3)).ravel();stress.append(C@B@u[ids]*mesh['factors'][el])
u0=np.array(data['solution']['u']);s0=np.array(data['solution']['centroidStress']);s=np.array(stress);energy=u@K@u/2
point_error=0
for record in data['samples']:
 ns=tets[record['el']];B,_=sample(xyz[ns],np.array(record['L']));ids=(3*ns[:,None]+np.arange(3)).ravel();value=(C@B@u[ids])[2]*mesh['factors'][record['el']]
 point_error=max(point_error,abs(value-record['stress'])/max(1,abs(value)))
metrics={'pointStressMaxRelative':point_error,'displacementRelativeL2':float(np.linalg.norm(u-u0)/np.linalg.norm(u)), 'stressRelativeL2':float(np.linalg.norm(s-s0)/np.linalg.norm(s)), 'energyRelativeDifference':float(abs(energy-data['solution']['energy'])/energy),'loadRelativeL2':float(np.linalg.norm(f-np.array(data['loads']))/np.linalg.norm(f)),'freeResidualN':float(np.max(abs((K@u-f)[free]))),'seconds':time.time()-start}
# Includes integration-order sensitivity, so stricter identical-quadrature roundoff gates are inappropriate.
gates={'pointStressMaxRelative':1e-3,'displacementRelativeL2':1e-4,'stressRelativeL2':1e-3,'energyRelativeDifference':1e-4,'loadRelativeL2':1e-10,'freeResidualN':1e-4}
result={'metrics':metrics,'gates':gates,'passed':all(metrics[k]<v for k,v in gates.items()),'scope':'Independent curved outer and cavity geometry; same mesh/material/BC, higher quadrature. Numerical verification only.'}
(root/'verification/results/p07-independent.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
assert result['passed']
