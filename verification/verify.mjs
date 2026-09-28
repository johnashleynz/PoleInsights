import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {solvePole,sectionProperties,scaleUnitResult} from '../src/analysis/beam.ts';
import {defaultCase,diameters,validateCase} from '../src/domain/model.ts';
const checks=[];
function close(name,actual,expected,tolerance){const error=Math.abs(actual-expected)/Math.max(Math.abs(expected),1e-14);assert.ok(error<=tolerance,`${name}: ${actual} vs ${expected}, error ${error}`);checks.push({name,actual,expected,relativeError:error,tolerance});}
function test(name,condition){assert.ok(condition,name);checks.push({name,passed:true});}
const pole=defaultCase();pole.soil='Fixed';pole.length=10;pole.embedment=2;pole.diameters={butt:.3,ground:.3,tip:.3};pole.loadKN=1;
const L=8,E=pole.material.E,I=Math.PI*.3**4/64,Z=Math.PI*.3**3/32;
const fixed=solvePole(pole);
close('Uniform cantilever deflection: independent closed form',fixed.tipMovement,1000*L**3/(3*E*I),.001);
close('Uniform cantilever peak stress: independent closed form',Math.max(...fixed.stations.map(s=>Math.max(-s.stressMin,s.stressMax))),1000*L/Z,.001);
close('Uniform cantilever compression limit',fixed.limitKN,pole.material.compression*Z/L/1000,.001);
test('Uniform cantilever critical section is groundline',Math.abs(fixed.governingZ)<1e-9);
for(const angle of [0,37,90,180,271]){const r=solvePole({...pole,bearing:angle});close(`Circular pole invariance ${angle} degrees`,r.tipMovement,fixed.tipMovement,.00001);close(`Circular pole capacity invariance ${angle}`,r.limitKN,fixed.limitKN,.002);}
const zero=solvePole({...pole,loadKN:0});test('Zero load returns zero movement and stress',zero.tipMovement===0&&zero.stations.every(s=>s.stressMin===0&&s.stressMax===0));close('Zero load retains unit-pattern limit',zero.limitKN,fixed.limitKN,1e-8);
const hollow={id:'annulus',name:'Annulus benchmark',kind:'void',zMin:-2,zMax:8,severity:1,shape:{type:'ellipse',centreX:0,centreY:0,radiusX:.075,radiusY:.075,angle:0,profile:'constant'},provenance:'synthetic'};
const annulus=sectionProperties({...pole,regions:[hollow]},1);close('Annulus area: independent exact section',annulus.area,Math.PI*(.15**2-.075**2),.001);close('Annulus second moment: independent exact section',annulus.xx,Math.PI*(.15**4-.075**4)/4,.001);
const eccentric=structuredClone(hollow);eccentric.shape.centreX=.04;eccentric.shape.radiusX=eccentric.shape.radiusY=.05;
const es=sectionProperties({...pole,regions:[eccentric]},1,100,256),Ao=Math.PI*.15**2,Ai=Math.PI*.05**2,cx=-Ai*.04/(Ao-Ai),Icentroid=Math.PI*.15**4/4-(Math.PI*.05**4/4+Ai*.04**2)-(Ao-Ai)*cx**2;
close('Eccentric void elastic centroid',es.cx,cx,.015);close('Eccentric void second moment',es.xx,Icentroid,.01);
const soilResults=[];
for(const soil of ['Soft','Medium','Hard']){
  const p={...defaultCase(),soil,loadKN:1,bearing:37},r=solvePole(p);soilResults.push(r);
  const fx=1000*Math.sin(37*Math.PI/180),fy=1000*Math.cos(37*Math.PI/180),height=p.length-p.embedment;
  close(`${soil}: integrated soil horizontal force X`,r.reactionX,-fx,1e-6);close(`${soil}: integrated soil horizontal force Y`,r.reactionY,-fy,1e-6);
  close(`${soil}: integrated soil moment X`,r.momentX,fy*height,1e-6);close(`${soil}: integrated soil moment Y`,r.momentY,-fx*height,1e-6);
  test(`${soil}: equilibrium residual gate`,r.balance<1e-6);
  const rotated=solvePole({...p,bearing:127});close(`${soil}: isotropic support rotation`,r.tipMovement,rotated.tipMovement,1e-6);
}
test('Higher ground stiffness reduces tip movement',soilResults[0].tipMovement>soilResults[1].tipMovement&&soilResults[1].tipMovement>soilResults[2].tipMovement);
// Independent rigid-body equilibrium with an analytically integrated linear-depth spring bed.
// Deliberately high E approaches the rigid reference; it is a test material, never a pole preset.
const rigid={...pole,soil:'Medium',material:{...pole.material,E:8e12}},embed=rigid.embedment,k=12e6*.3/.32;
const a=k*(.25*embed+embed**2/2),b=-k*(.25*embed**2/2+embed**3/3),c=k*(.25*embed**3/3+embed**4/4),det=a*c-b*b;
const translation=(1000*c-b*1000*L)/det,rotation=(a*1000*L-b*1000)/det;
close('Nearly rigid pole: independent soil-bed equilibrium',solvePole(rigid).tipMovement,translation+rotation*L,.01);
const unit=solvePole({...defaultCase(),loadKN:1});
for(const load of [0,.1,2,9]){const scaled=scaleUnitResult(unit,load),direct=solvePole({...defaultCase(),loadKN:load});close(`Exact live load scaling at ${load} kN`,scaled.tipMovement,direct.tipMovement,1e-10);close(`Live demand scaling at ${load} kN`,scaled.utilisation,direct.utilisation,1e-10);}
const oriented={...pole,regions:[eccentric],bearing:20};const rotatedCase=structuredClone(oriented);rotatedCase.bearing=110;rotatedCase.regions[0].shape.centreX=0;rotatedCase.regions[0].shape.centreY=-.04;
close('Rotate eccentric defect and force together',solvePole(oriented).tipMovement,solvePole(rotatedCase).tipMovement,.002);
test('Internal hollow lowers the timber bending limit',solvePole({...pole,regions:[hollow]}).timberLimitKN<fixed.timberLimitKN);
const shallow=solvePole({...defaultCase(),embedment:1.4}),deep=solvePole({...defaultCase(),embedment:2.2});test('Deeper embedment reduces deflection for the declared presets',deep.tipMovement<shallow.tipMovement);
const levels=[24,48,72].map(n=>solvePole(defaultCase(),n));close('Mesh: 48 to 72 elements tip displacement',levels[1].tipMovement,levels[2].tipMovement,.02);close('Mesh: 48 to 72 elements first limit',levels[1].limitKN,levels[2].limitKN,.05);
const estimated=diameters({...pole,diameters:{butt:.35,ground:null,tip:.2}});close('Missing diameter linear interpolation',estimated.ground,.32,1e-12);
test('Unsupported photo contours are rejected',validateCase({...pole,regions:[{...hollow,shape:{type:'section-contours',stations:[],interpolation:'none',longitudinalEvidence:'measured-stations'}}]}).some(x=>x.includes('future')));
test('Impossible geometry is rejected',validateCase({...pole,embedment:15}).length>0);
const data={version:'P01',date:new Date().toISOString(),checks:checks.length,scope:'Numerical checks only. No physical timber, soil, decay or UB1000 validation.',results:checks,mesh:levels.map(r=>({nodes:r.nodes,tipMovement:r.tipMovement,limitKN:r.limitKN,elapsedMs:r.elapsedMs}))};
writeFileSync(new URL('results/p01-numerics.json',import.meta.url),JSON.stringify(data,null,2));
console.log(`${checks.length} numerical checks passed. Reference and limits saved in verification/results/p01-numerics.json.`);
