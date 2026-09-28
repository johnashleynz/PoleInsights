"""Independent continuum BVP for first monotonic yielding of a uniform pile.
No JS matrices, shape functions or soil implementation are consumed.
Unloading/2D plastic flow are covered separately, not by this scalar reference.
"""
import json
import numpy as np
from scipy.integrate import solve_bvp
from pathlib import Path
saved=json.loads(Path('verification/results/p14.json').read_text())
p=saved['soil']['inputs']; e=p['embedment']; h=p['length']-e; d=.32
EI=p['material']['E']*np.pi*d**4/64
# Two connected domains avoid a discontinuous foundation coefficient at ground.
# x in [0,1], lower physical z=-e+e*x; upper z=h*x.
def ode(x,u):
    z=-e+e*x
    k=12e6*(.25-z)*d/.32
    limit=(40e3-160e3*z)*d
    resistance=np.clip(k*u[0],-limit,limit)
    return np.vstack((e*u[1],e*u[2],e*u[3],-e*resistance/EI,
                      h*u[5],h*u[6],h*u[7],np.zeros_like(x)))
rows=[]; solution=None
for force in [1000,2000,3000]:
    def bc(a,b):
        return np.array([a[2],a[3],b[2]-a[6],b[3]-a[7],b[0]-a[4],b[1]-a[5],b[6],b[7]+force/EI])
    x=np.linspace(0,1,301)
    guess=np.zeros((8,len(x))) if solution is None else solution.sol(x)
    solution=solve_bvp(ode,bc,x,guess,tol=1e-8,max_nodes=20000)
    assert solution.success, solution.message
    rows.append({'loadN':force,'tipM':float(solution.y[4,-1]),'meshNodes':len(solution.x),'maxResidual':float(np.max(solution.rms_residuals))})
reference=rows[-1]['tipM']; model=saved['soil']['fine']['rows'][0]['tip'][0]
error=abs(model/reference-1)
report={'method':'Independent scipy solve_bvp, two connected continuous beam domains, monotonic capped soil law','rows':rows,'fineFETipM':model,'relativeTipError':error,'gate':.01,'passed':error<.01,'limits':'Uniform sound pole, monotonic one-direction foundation response only. No physical calibration or timber failure.'}
Path('verification/results/p14-soil-independent.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2)); assert report['passed']
