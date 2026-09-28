import fs from 'node:fs';
import {defaultCase} from '../../src/domain/model.ts';
import {RESOLUTIONS} from '../../src/analysis/solid/mesh.ts';
import {solveLocal,localStressAt} from '../../src/analysis/solid/field.ts';
import {solvePole,stationAt,stressAt} from '../../src/analysis/beam.ts';
const p=defaultCase();p.soil='Fixed';p.diameters={butt:.3,ground:.3,tip:.3};p.regions=[{id:'cavity',name:'Enclosed hollow',kind:'void',zMin:1.6,zMax:2.2,severity:1,shape:{type:'ellipse',centreX:.02,centreY:0,radiusX:.06,radiusY:.07,angle:0,profile:'rounded'},provenance:'synthetic'}];
const rows=[];for(const marginDiameters of [1,2,3]){const f=solveLocal(p,'coarse',{...RESOLUTIONS.coarse,marginDiameters});const row={marginDiameters,pointStressMPa:localStressAt(f,.115,0,1.9)/1e6,peakMPa:f.sampledPeakPa/1e6,ms:f.elapsedMs};rows.push(row);console.log(row);}
const states=[];for(const [kind,severity] of [['decay',0],['decay',.7],['void',1]]){const q=structuredClone(p);q.regions[0].kind=kind;q.regions[0].severity=severity;const field=solveLocal(q),beam=solvePole(q),probes=[[.115,0,1.9],[.04,0,1.58],[.04,0,2.22]];states.push({kind,severity,energy:field.energy,probes:probes.map(([x,y,z])=>({x,y,z,solidMPa:(localStressAt(field,x,y,z)??0)/1e6,beamMPa:(stressAt(q,stationAt(beam,z),x,y)??0)/1e6}))});}
fs.writeFileSync('verification/results/p05-boundaries-and-decay.json',JSON.stringify({rows,states,scope:'Boundary plus remeshing sensitivity and decay diagnostics; no capacity gate.'},null,2));console.log(states);
