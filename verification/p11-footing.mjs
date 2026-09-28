import {writeFileSync} from 'node:fs';
import {defaultCase,newRegion,SOILS} from '../src/domain/model.ts';
import {solvePole} from '../src/analysis/beam.ts';
import {prepareHeightProfile,profileFromBasis} from '../src/analysis/heightProfile.ts';
const checks=[],check=(name,pass,data)=>{checks.push({name,pass,data});if(!pass)throw Error(name+JSON.stringify(data));};
const pole=defaultCase();pole.regions=[newRegion(pole)];pole.bearing=37;pole.loadKN=3;
const saved={...SOILS.Medium};
try{
  const original=solvePole(pole),rows=profileFromBasis(prepareHeightProfile(pole),pole.bearing,pole.loadKN,false);
  SOILS.Medium.pressure0*=.01;SOILS.Medium.pressureGradient*=.01;
  const weak=solvePole(pole),weakRows=profileFromBasis(prepareHeightProfile(pole),pole.bearing,pole.loadKN,false);
  check('Soil strength change alters soil limit by the expected factor',Math.abs(weak.soilLimitKN/original.soilLimitKN-.01)<1e-12,{original:original.soilLimitKN,weak:weak.soilLimitKN});
  check('Specified and worst timber capacity profiles are independent of soil strength',rows.length===weakRows.length&&rows.every((r,i)=>r.capacityApplied===weakRows[i].capacityApplied&&r.capacityWorst===weakRows[i].capacityWorst));
  const ground=weakRows.reduce((a,b)=>Math.abs(a.z)<Math.abs(b.z)?a:b);
  check('Timber capacity remains above a weaker footing limit rather than being capped',ground.capacityApplied>weak.soilLimitKN&&weak.timberLimitKN===original.timberLimitKN&&weak.timberZ===original.timberZ,{sectionCapacity:ground.capacityApplied,soilLimit:weak.soilLimitKN});
}finally{Object.assign(SOILS.Medium,saved);}
writeFileSync('verification/results/p11-footing.json',JSON.stringify({scope:'Separate timber capacity and soil strength limits; soil stiffness is retained',checks},null,2));
console.log(`${checks.length} timber/footing independence checks passed.`);
