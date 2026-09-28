import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {defaultCase,newRegion,normaliseCase,safeAssetFilePart,validateCase,drillingBounds} from '../src/domain/model.ts';
import {solvePole,sectionProperties} from '../src/analysis/beam.ts';
import {COUNTRIES,applyEmbedmentHeuristic,matchPoleClass} from '../src/domain/countries.ts';
import {displayForce,forceFromDisplay,displayPoleLength,poleLengthFromDisplay,displaySmallLength,smallLengthFromDisplay,displayStress,unitLabels} from '../src/domain/units.ts';
import {resolveBreakState} from '../src/domain/break.ts';

const root=path.resolve(import.meta.dirname,'..'),checks=[];
function check(id,name,fn){try{fn();checks.push({id,name,pass:true});}catch(error){checks.push({id,name,pass:false,error:error instanceof Error?error.message:String(error)});}}
const near=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

check('FR-001','asset ID storage, validation and safe export name',()=>{const p=defaultCase();p.assetId='Pole / 42: North';assert.equal(validateCase(p).length,0);assert.equal(safeAssetFilePart(p.assetId),'Pole-42-North');p.assetId='x'.repeat(256);assert.ok(validateCase(p).some(x=>x.includes('Asset ID')));});
check('FR-002','reference calculator units round-trip through SI',()=>{near(poleLengthFromDisplay(displayPoleLength(10.5,'imperial'),'imperial'),10.5);near(smallLengthFromDisplay(displaySmallLength(.305,'imperial'),'imperial'),.305);near(forceFromDisplay(displayForce(8,'imperial'),'imperial'),8);near(displayForce(8,'imperial'),1798.47155096768,1e-8);near(displayStress(27.5,'imperial'),3.988537788,1e-6);assert.deepEqual([unitLabels.imperial.force,unitLabels.imperial.stress],['lbf','kpsi']);});
check('FR-003','country defaults and embedment heuristics',()=>{near(applyEmbedmentHeuristic(12,'NZ'),2);near(applyEmbedmentHeuristic(12,'US'),1.8096);assert.equal(COUNTRIES.US.defaultUnits,'imperial');});
check('FR-004','supplied Goldpine and ANSI pole class tables',()=>{const nz=COUNTRIES.NZ.poleClasses.find(x=>x.id==='nz-goldpine-12m-12kn');assert.ok(nz);near(nz.groundDiameterM,.345);near(nz.tipDiameterM,.265);const us=COUNTRIES.US.poleClasses.find(x=>x.id==='us-ansi-1-40ft');assert.ok(us);near(us.tipDiameterM,27*.0254/Math.PI);assert.equal(matchPoleClass('NZ','radiata-pine',12,.35)?.id,nz.id);});
check('FR-005','Pole Insights names current user-facing surfaces',()=>{assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/Pole Insights P27 DEV/);assert.match(fs.readFileSync(path.join(root,'src/ui/App.tsx'),'utf8'),/P27 DEV/);});
check('FR-006','load application height changes structural response',()=>{const high=defaultCase(),low=structuredClone(high);high.loadHeight=high.length-high.embedment;low.loadHeight=3;const a=solvePole(high,20),b=solvePole(low,20);assert.ok(b.tipMovement<a.tipMovement);assert.ok(b.limitKN>a.limitKN);});
check('FR-007','Detect visibility persists and filters related UI',()=>{const p=normaliseCase({...defaultCase(),showDetect:false}),app=fs.readFileSync(path.join(root,'src/ui/App.tsx'),'utf8'),videos=fs.readFileSync(path.join(root,'src/lessons/VideoLibrary.tsx'),'utf8');assert.equal(p.showDetect,false);assert.equal(normaliseCase({...defaultCase(),showDetect:undefined}).showDetect,true);assert.match(app,/showDetect=\{p\.showDetect !== false\}/);assert.match(videos,/showDetect \? films : films\.filter/);});
check('FR-008','isolated Cloudflare staging command exists',()=>{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));assert.match(pkg.scripts['deploy:staging'],/pole-insights-staging/);assert.doesNotMatch(pkg.scripts['deploy:staging'],/production/i);});
check('FR-009','below-ground inspection range is represented and valid',()=>{const p=defaultCase();assert.ok(-p.embedment<0);assert.equal(validateCase(p).length,0);assert.match(fs.readFileSync(path.join(root,'src/ui/DetectSection.tsx'),'utf8'),/-pole\.embedment/);});
check('FR-010','chipping removes section material and validates facets',()=>{const p=defaultCase(),base=sectionProperties(p,.3),chip=newRegion(p,'chipping');p.regions=[chip];const reduced=sectionProperties(p,.3);assert.ok(reduced.area<base.area);chip.chipping.facets=5;assert.ok(validateCase(p).some(x=>x.includes('Chipping')));chip.chipping.facets=8;assert.equal(validateCase(p).length,0);});
check('FR-011','angled drilling spans intersected heights and removes material',()=>{const p=defaultCase(),drill=newRegion(p,'drilling');drill.drilling.inclination=45;drill.drilling.entryHeight=.8;Object.assign(drill,drillingBounds(drill.drilling));p.regions=[drill];assert.ok(drill.zMin<.8&&drill.zMax>.79);assert.ok(sectionProperties(p,.75).area<sectionProperties({...p,regions:[]},.75).area);assert.equal(validateCase(p).length,0);});
check('FR-012','illustrative break threshold defaults to 200 percent',()=>{const p=defaultCase(),result=solvePole(p,20),state=resolveBreakState(p,result);near(state.forceKN,result.limitKN*2);assert.equal(state.basis,'illustrative');p.loadKN=state.forceKN;assert.equal(resolveBreakState(p,result).active,true);});
check('FR-013','paired observed break values override demonstration values',()=>{const p=defaultCase(),result=solvePole(p,20);p.actualBreakForceKN=3;p.actualBreakHeight=.4;p.loadKN=3;assert.deepEqual(resolveBreakState(p,result),{active:true,forceKN:3,heightM:.4,basis:'observed'});});

const failed=checks.filter(x=>!x.pass);console.log(JSON.stringify({passed:checks.length-failed.length,failed},null,2));
if(failed.length)process.exitCode=1;
