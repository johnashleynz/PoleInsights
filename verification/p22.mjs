import {writeFileSync} from 'node:fs';
import {defaultCase,standardExample,refreshStandardMaterial,validateCase} from '../src/domain/model.ts';
import {SPECIES,speciesById,referenceMaterial,materialErrors,roundDefaults,roundValues} from '../src/domain/species.ts';
import {solvePole} from '../src/analysis/beam.ts';
import {placeholderAssessment} from '../src/inspection/placeholder.ts';
const checks=[];function check(name,pass,data){checks.push({name,pass,data});if(!pass)throw Error(name);}
const nz=speciesById('radiata-pine'),defaults=roundDefaults(nz.round),raw={...defaults,preparation:'natural',steamed:false};
check('NZ normal row E 8.7 and Fb 38',roundValues(nz.round,raw).E===8.7e9&&roundValues(nz.round,raw).bending===38e6);
check('NZ high row E 12.1 and Fb 52',roundValues(nz.round,{...raw,density:'high'}).E===12.1e9&&roundValues(nz.round,{...raw,density:'high'}).bending===52e6);
const normal=referenceMaterial(nz);
check('NZ default peeled and steamed factors',Math.abs(normal.E-8.265e9)<1&&Math.abs(normal.bending-29.07e6)<1);
const shaved=roundValues(nz.round,{...defaults,preparation:'shaved'});
check('NZ shaving and steaming compound correctly',Math.abs(shaved.E-8.7e9*.95*.95)<1&&Math.abs(shaved.bending-38e6*.8*.85)<1);
check('NZ larch shares category without using US western-larch values',referenceMaterial(speciesById('european-larch-nz')).bending===normal.bending&&referenceMaterial(speciesById('western-larch')).bending===57.9e6);
check('NZ standard example validates; legacy examples preserved',validateCase(standardExample()).length===0&&defaultCase().material.basis==='illustrative');
for(const s of SPECIES.filter(s=>s.round)){const m=referenceMaterial(s),p=refreshStandardMaterial({...defaultCase(),species:s.id,material:m});check(s.id+' reference and current geometry validate',materialErrors(s.id,m).length===0&&validateCase(p).length===0);}
for(const [id,fb,E] of [['grey-ironbark',84,21.5],['spotted-gum',67,18.5],['forest-red-gum',55,16],['jarrah',42,14],['slash-pine-australia',36,12],['hoop-pine',31,10.5]]){
 const m=referenceMaterial(speciesById(id));check(id+' standard group and F-grade mapping',m.bending===fb*1e6&&m.E===E*1e9);
}
const au=speciesById('radiata-pine-australia'),small={...roundDefaults(au.round),midDiameterMM:150},smallV=roundValues(au.round,small);
check('Australian softwood immaturity acts on E and Fb',smallV.E===10.5e9*.85&&smallV.bending===31e6*.85);
check('Between table diameters use conservative lower band',roundValues(au.round,{...small,midDiameterMM:174}).factors.immaturity===.85);
check('Australian shaved softwood bending and E factors remain distinct',roundValues(au.round,{...small,preparation:'shaved',steamed:true}).bending===31e6*.85*.75*.85&&roundValues(au.round,{...small,preparation:'shaved',steamed:true}).E===10.5e9*.85*.95);
const pole=refreshStandardMaterial({...defaultCase(),species:au.id,material:referenceMaterial(au),diameters:{butt:.15,ground:.15,tip:.15}});
check('Geometry edits recompute and store immaturity diameter',pole.material.round.midDiameterMM===150&&validateCase(pole).length===0);
check('Stale geometry-dependent properties rejected',validateCase({...pole,diameters:{butt:.3,ground:.3,tip:.3}}).length>0);
check('Tampered reference strengths rejected',materialErrors(nz.id,{...normal,bending:99e6}).length>0);
check('Missing reference options rejected',materialErrors(nz.id,{...normal,round:undefined}).length>0);
check('Diameter below verified Australian table range unavailable',roundValues(au.round,{...small,midDiameterMM:60})===null);
check('Hybrid southern plantation pine, maritime pine and ambiguous grey-box remain unsourced',['southern-pine-australia','maritime-pine','grey-box'].every(id=>referenceMaterial(speciesById(id))===null));
const p={...standardExample(),soil:'Fixed',regions:[],loadKN:1,diameters:{butt:.3,ground:.3,tip:.3}};
const r=solvePole(p),expected=29.07e6*Math.PI*.3**3/32/(p.length-p.embedment)/1000;
check('Modified characteristic Fb drives solved pole capacity',Math.abs(r.timberLimitKN/expected-1)<.004,{actual:r.timberLimitKN,expected});
const high={...p,material:referenceMaterial(nz,false,{...defaults,density:'high'})},hr=solvePole(high);
check('High density increases capacity and reduces movement by independent expected ratios',Math.abs(hr.timberLimitKN/r.timberLimitKN-52/38)<1e-5&&Math.abs(hr.tipMovement/r.tipMovement-8.7/12.1)<1e-5);
check('Detect MPa reference follows selected modified material',Math.abs(placeholderAssessment(p,1).soundReferenceMPa-29.07)<1e-8);
writeFileSync('verification/results/p22.json',JSON.stringify({scope:'Source transcription, material modifiers, reference integrity and solver propagation; not full code or physical validation',checks},null,2));console.log(checks.length+' P22 checks passed.');
