import assert from 'node:assert/strict';
import {normalizeGridPole, createGridManagerHandler, gridManagerMiddleware} from '../server/gridManager.ts';
import {defaultCase, diameterAt, validateCase, normaliseCase} from '../src/domain/model.ts';
import {applyGridInspection, overrideReadingUnit, validGridSnapshot} from '../src/integrations/geometry.ts';
import {axonicUrl, readPreferences, preferencesKey} from '../src/integrations/preferences.ts';
import {structuralKey, resetHistoryOnGeometry} from '../src/analysis/nonlinear.ts';
import {solvePole} from '../src/analysis/beam.ts';
import {onRequest} from '../functions/api/grid-manager/[[path]].ts';
import {groupReadingsByHeight, placeHeightLabels} from '../src/integrations/readingGroups.ts';
import {poleTagTone} from '../src/integrations/poleTag.ts';
import {matchGridSpecies} from '../src/integrations/speciesMatch.ts';
import {arStrengthAt,deconditioningSamples,AR_END_BLEND_M} from '../src/integrations/deconditioning.ts';
import {conditionAt} from '../src/domain/model.ts';
import {prepareHeightProfile,profileFromBasis} from '../src/analysis/heightProfile.ts';
import {defectAppearance} from '../src/scene/defectAppearance.ts';

let passed = 0;
assert.equal(poleTagTone('OK'),'green');assert.equal(poleTagTone('Red Tag'),'red');assert.equal(poleTagTone('Reinspect in 5 Years'),'yellow');assert.equal(poleTagTone('Pole Not Found'),'neutral');assert.equal(poleTagTone('Custom customer assessment'),'neutral');assert.equal(poleTagTone(null),'neutral');
async function check(name, fn) {await fn(); passed++; console.log(`PASS ${name}`);}
const raw = {Id:1495480, CustomerPoleId:'165482', Species:'Southern Yellow Pine', PoleClass:'6 kN', InstallYear:1993, LastSurvey:'2026-08-18T10:51:00Z', LastPoleStructureTag:'OK', PoleInspectionUB1000s:[
 {Id:1, ServiceRequestId:10, HeightAgl:50, PoleCircumference:'1000', UnitType:'mm', Ar:74, ServiceRequest:{Id:10, UtcCalendarDateTime:'2026-08-18T10:51:00Z', PoleTag:'OK', InspectorInitials:'JAA', PoleStructureInspectionVisual:{Length:11, LengthUnit:'m', InspectionDate:'2026-08-18T10:51:00Z'}}},
 {Id:2, ServiceRequestId:10, HeightAgl:600, PoleCircumference:'950', UnitType:'mm', Ar:75},
 {Id:3, ServiceRequestId:9, HeightAgl:24, PoleCircumference:'40', UnitType:'inches', Ar:60, ServiceRequest:{Id:9, UtcCalendarDateTime:'2025-08-18T10:51:00Z', PoleTag:'Reinspect in 5 years'}},
]};
await check('Species soft matching and AGL apply without circumference samples',()=>{
 assert.equal(matchGridSpecies('Western Red Cedar','US').id,'western-red-cedar');assert.equal(matchGridSpecies('Western red ceder','US').id,'western-red-cedar');assert.equal(matchGridSpecies('Pinus radiata','AU').id,'radiata-pine-australia');assert.equal(matchGridSpecies('Southern Yellow Pine','US').id,'southern-pine');assert.equal(matchGridSpecies('Pine','US'),null);assert.equal(matchGridSpecies('Unknown tree','US'),null);
 const p={...defaultCase(),country:'US',unitSystem:'imperial'},s=normalizeGridPole({...raw,Species:'Western Red Cedar',Height_M:16.76,PoleInspectionUB1000s:[]},'CH031617V2');s.lengthM=null;s.heightAglM=16.76;const imported={...p,...applyGridInspection(p,s,null)};
 assert.equal(imported.species,'western-red-cedar');assert.equal(imported.material.referenceId,'ansi-o5.1-2022-western-red-cedar');assert.ok(Math.abs(imported.length-imported.embedment-16.76)<1e-10);assert.equal(imported.geometryEstimates.length,true);assert.equal(validateCase(imported).length,0);
 const custom={...imported,material:{basis:'user-bending',E:9e9,bending:35e6,source:'Test report'}};assert.deepEqual({...custom,...applyGridInspection(custom,s,null)}.material,custom.material);
 assert.equal(applyGridInspection(p,{...s,species:'Unknown tree'},null).species,undefined);
});
await check('Latest SR, explicit metric/imperial units and verbatim tags',()=>{const s=normalizeGridPole(raw,'165482'); assert.equal(s.selectedInspectionId,'10'); assert.equal(s.inspections[1].tag,'Reinspect in 5 years'); assert.equal(s.inspections[0].readings[0].heightM,.05); assert.equal(s.inspections[1].readings[0].circumferenceM,1.016); assert.ok(Math.abs(s.inspections[1].readings[0].heightM-.6096)<1e-12); assert.equal(s.lengthM,11); assert.equal(s.inspections[0].readings[0].rsm,null); assert.ok(validGridSnapshot(s));});
await check('Unknown codes and NaN do not fabricate dimensions or results',()=>{const s=normalizeGridPole({...raw,PoleInspectionUB1000s:[{Id:4,HeightAgl:50,PoleCircumference:'NaN',UnitType:'0',Ar:'NaN'}]},'165482'); assert.equal(s.inspections[0].readings[0].heightM,null); assert.equal(s.inspections[0].readings[0].ar,null); assert.ok(s.warnings.some(x=>x.includes('Unmapped'))); const mapped=normalizeGridPole({...raw,PoleInspectionUB1000s:[{Id:4,HeightAgl:50,PoleCircumference:1000,UnitType:'0',RSM:89}]},'165482',{GRID_MANAGER_UNIT_MAP:'{"0":"mm"}',GRID_MANAGER_RSM_FIELD:'RSM'}); assert.equal(mapped.inspections[0].readings[0].heightM,.05); assert.equal(mapped.inspections[0].readings[0].rsm,89);});
await check('Actual stations are shared by geometry and beam mesh',()=>{const s=normalizeGridPole(raw,'165482'), p=defaultCase(); const imported={...p,...applyGridInspection(p,s,'10')}; assert.equal(validateCase(imported).length,0); assert.ok(Math.abs(diameterAt(imported,.05)-1/Math.PI)<1e-12); assert.ok(Math.abs(diameterAt(imported,.6)-.95/Math.PI)<1e-12); assert.ok(Math.abs(diameterAt(imported,.325)-.975/Math.PI)<1e-12); const result=solvePole({...imported,soil:'Fixed'}); assert.ok(result.stations.some(q=>Math.abs(q.z-.05)<1e-8)); assert.ok(result.stations.some(q=>Math.abs(q.z-.6)<1e-8));});
await check('Malformed snapshots and station geometry are rejected on JSON import',()=>{const p=defaultCase(); assert.ok(validateCase({...p,gridManager:{source:'grid-manager'}}).length); assert.ok(validateCase({...p,diameterStations:[{heightM:50,diameterM:.3,inspectionId:'x',readingId:'y'}]}).length); assert.ok(!validGridSnapshot({...normalizeGridPole(raw,'165482'),inspections:[null]})); const s=normalizeGridPole(raw,'165482'), imported={...p,axonic:{profile:'ussteel',assetId:'kewatin255'},...applyGridInspection(p,s,'10')}; const roundtrip=normaliseCase(JSON.parse(JSON.stringify(imported))); assert.equal(roundtrip.axonic.profile,'ussteel'); assert.equal(roundtrip.gridManager.poleId,'1495480'); assert.deepEqual(roundtrip.diameterStations,imported.diameterStations);});
await check('Implausible dimensions are withheld; valid repeat measurements remain preserved',()=>{
 const s=normalizeGridPole({...raw,PoleInspectionUB1000s:[{Id:7,ServiceRequestId:10,HeightAgl:300,PoleCircumference:790,UnitType:'inches'}]},'165482'),p=defaultCase();
 assert.equal(applyGridInspection(p,s,'10').diameterStations,undefined);
 const repeated=structuredClone(raw);repeated.PoleInspectionUB1000s.push({...repeated.PoleInspectionUB1000s[0],Id:8});
 const applied=applyGridInspection(p,normalizeGridPole(repeated,'165482'),'10');
 assert.equal(applied.diameterStations.length,2);assert.ok(!applied.gridManager.warnings.some(w=>w.includes('repeated test height')));
 assert.equal(applied.gridManager.inspections[0].readings.length,3);
 repeated.PoleInspectionUB1000s.at(-1).PoleCircumference='1100';
 const conflicting=applyGridInspection(p,normalizeGridPole(repeated,'165482'),'10');
 assert.ok(conflicting.gridManager.warnings.some(w=>w.includes('circumference differs')));
 assert.equal(conflicting.diameterStations[0].diameterM,1/Math.PI);
});
await check('Metadata does not reset physical ground history',()=>{const p={...defaultCase(),soilHistory:[[1000,0]]}; const q={...p,axonic:{profile:'ussteel',assetId:'kewatin255'},gridManager:normalizeGridPole(raw,'165482')}; assert.equal(structuralKey(p),structuralKey(q)); assert.deepEqual(resetHistoryOnGeometry(p,q).soilHistory,p.soilHistory); assert.deepEqual(resetHistoryOnGeometry(p,{...q,...applyGridInspection(q,q.gridManager,'10')}).soilHistory,[]);});
await check('Profiles contain no prepopulated organisations and links encode asset IDs',()=>{globalThis.localStorage={getItem:()=>null}; assert.deepEqual(readPreferences().recentProfiles,[]); assert.equal(axonicUrl('ussteel','kewatin255'),'axonic://ussteel/kewatin255'); assert.equal(axonicUrl('axonic_com','Pole / 42'),'axonic://axonic_com/Pole%20%2F%2042'); assert.equal(axonicUrl('../unsafe','x'),null); globalThis.localStorage={getItem:k=>k===preferencesKey?JSON.stringify({detect:false,axonic:true,lastProfile:'ussteel',recentProfiles:['ussteel','../unsafe']}):null}; assert.equal(readPreferences().detect,false); assert.deepEqual(readPreferences().recentProfiles,['ussteel']); delete globalThis.localStorage;});
await check('OAuth query, exact OData escaping, internal record URL and no secret response',async()=>{const calls=[],config={GRID_MANAGER_CLIENT_ID:'test-client',GRID_MANAGER_CLIENT_SECRET:'test-secret'};const handler=createGridManagerHandler(config,async(url,options)=>{calls.push({url:new URL(url),options});return Response.json(calls.length===1?{access_token:'test-token',expires_in:3600}:{value:[raw]});}); const response=await handler(new Request('http://127.0.0.1/api/grid-manager/pole?assetId=O%27Brien')); const body=await response.text(),data=JSON.parse(body);assert.equal(response.status,200);assert.equal(calls[0].options.method,'POST');assert.equal(calls[0].url.searchParams.get('client_secret'),'test-secret');assert.ok(calls[1].url.searchParams.get('$filter').includes("eq 'O''Brien'"));assert.equal(calls[1].options.headers.Authorization,'Bearer test-token');assert.equal(data.recordUrl,'https://app.innerviewinsights.com/pole/1495480');assert.ok(!body.includes('test-secret')&&!body.includes('test-token')); await handler(new Request('http://127.0.0.1/api/grid-manager/connect'));assert.equal(calls.length,3);});
await check('No match, ambiguous poles, pagination and missing credentials are explicit',async()=>{for(const [value,status]of[[{value:[]},404],[{value:[raw,raw]},409],[{value:[{...raw,'PoleInspectionUB1000s@odata.nextLink':'https://example.com'}]},422]]){const h=createGridManagerHandler({GRID_MANAGER_BEARER_TOKEN:'test'},async()=>Response.json(value));assert.equal((await h(new Request('http://127.0.0.1/api/grid-manager/pole?assetId=165482'))).status,status);} const h=createGridManagerHandler({});assert.equal((await h(new Request('http://127.0.0.1/api/grid-manager/connect'))).status,503);assert.equal((await h(new Request('http://127.0.0.1/api/grid-manager/connect',{method:'POST'}))).status,405);});
await check('Local requests reject cross-origin access',async()=>{const m=gridManagerMiddleware({GRID_MANAGER_BEARER_TOKEN:'test'}); const res={statusCode:0,end(){}};await m({url:'/api/grid-manager/connect',method:'GET',headers:{host:'127.0.0.1:5192',origin:'https://evil.example'}},res,()=>{throw Error('Unexpected passthrough');});assert.equal(res.statusCode,403);});
await check('Cloudflare routes fail closed without Access configuration or JWT',async()=>{assert.equal((await onRequest({request:new Request('https://pole-insights.pages.dev/api/grid-manager/connect'),env:{}})).status,503);const env={GRID_MANAGER_ACCESS_TEAM_DOMAIN:'example.cloudflareaccess.com',GRID_MANAGER_ACCESS_AUD:'test'};assert.equal((await onRequest({request:new Request('https://pole-insights.pages.dev/api/grid-manager/connect'),env})).status,401);assert.equal((await onRequest({request:new Request('https://pole-insights.pages.dev/api/grid-manager/connect',{headers:{'Cf-Access-Jwt-Assertion':'invalid'}}),env})).status,401);});
await check('Per-reading unit corrections preserve originals and never affect adjacent readings',()=>{const s=normalizeGridPole({...raw,PoleInspectionUB1000s:[{Id:7,ServiceRequestId:10,HeightAgl:300,PoleCircumference:790,UnitType:'inches'},{Id:8,ServiceRequestId:10,HeightAgl:600,PoleCircumference:1000,UnitType:'mm'}]},'165482');const corrected=overrideReadingUnit(s,'7','mm');assert.equal(corrected.inspections[0].readings[0].heightM,.3);assert.equal(corrected.inspections[0].readings[0].circumferenceM,.79);assert.equal(corrected.inspections[0].readings[0].rawUnit,'inches');assert.equal(corrected.inspections[0].readings[1].heightM,.6);const restored=overrideReadingUnit(corrected,'7',undefined);assert.ok(Math.abs(restored.inspections[0].readings[0].heightM-7.62)<1e-12);assert.equal(restored.inspections[0].readings[0].rawHeight,'300');assert.ok(validGridSnapshot(JSON.parse(JSON.stringify(corrected))));});
await check('Confirmed AGL height sets total length and combines consistently with survey length',()=>{const p=defaultCase(),s=normalizeGridPole({...raw,Height_M:9.1},'165482'),combined=applyGridInspection(p,s,'10');assert.ok(Math.abs(combined.embedment-1.9)<1e-12);assert.equal(combined.length,11);assert.equal(combined.loadHeight,9.1);const aglOnly=applyGridInspection(p,{...s,lengthM:null},'10');assert.equal(aglOnly.embedment,p.embedment);assert.ok(Math.abs(aglOnly.length-10.9)<1e-12);const invalid=applyGridInspection(p,{...s,lengthM:8},'10');assert.equal(invalid.length,undefined);assert.ok(invalid.gridManager.warnings.some(w=>w.includes('inconsistent')));const imperial=normalizeGridPole({...raw,Height_Ft:30},'165482');assert.ok(Math.abs(imperial.heightAglM-9.144)<1e-12);});
await check('Verified Metric and Imperial labels convert independently within one inspection',()=>{
 const s=normalizeGridPole({Id:42,PoleInspectionUB1000s:[
  {Id:1,ServiceRequestId:10,HeightAgl:50,PoleCircumference:1020,UnitType:'Metric',Ar:84},
  {Id:2,ServiceRequestId:10,HeightAgl:3,PoleCircumference:36,UnitType:'Imperial',Ar:62},
 ]},'synthetic-mixed');
 const [metric,imperial]=s.inspections[0].readings;
 assert.equal(metric.heightM,.05);assert.equal(metric.circumferenceM,1.02);
 assert.ok(Math.abs(imperial.heightM-.0762)<1e-12);assert.ok(Math.abs(imperial.circumferenceM-.9144)<1e-12);
 assert.equal(imperial.rawUnit,'Imperial');assert.ok(!s.warnings.some(w=>w.includes('Unmapped')));
 const applied=applyGridInspection(defaultCase(),s,'10');assert.equal(applied.diameterStations.length,2);
});
await check('One annotation per height preserves AR ranges and raw reading counts',()=>{
 const s=normalizeGridPole({...raw,PoleInspectionUB1000s:[
  {Id:1,ServiceRequestId:10,HeightAgl:50,PoleCircumference:980,UnitType:'Metric',Ar:78},
  {Id:2,ServiceRequestId:10,HeightAgl:50,PoleCircumference:980,UnitType:'Metric',Ar:82},
  {Id:3,ServiceRequestId:10,HeightAgl:50,PoleCircumference:980,UnitType:'Metric',Ar:'NaN'},
  {Id:4,ServiceRequestId:10,HeightAgl:600,PoleCircumference:980,UnitType:'Metric',Ar:85},
 ]},'synthetic-repeat');
 const groups=groupReadingsByHeight(s.inspections[0].readings);
 assert.equal(groups.length,2);assert.equal(groups[0].arSummary,'78-82');
 assert.equal(groups[0].count,3);assert.equal(groups[0].missingAr,1);
 assert.equal(groups[1].arSummary,'85');assert.equal(s.inspections[0].readings.length,4);
 const p=defaultCase(),imported={...p,...applyGridInspection(p,s,'10')};
 for(const height of [.05,.6])assert.ok(Math.abs(diameterAt(imported,height)-.98/Math.PI)<1e-12);
 assert.ok(Math.abs(diameterAt(imported,.325)-.98/Math.PI)<1e-12);
});
await check('Shared asset identity normalises old independent Axonic IDs',()=>{
 const p=normaliseCase({...defaultCase(),assetId:'canonical',axonic:{profile:'demo',assetId:'legacy'}});
 assert.equal(p.axonic.assetId,'canonical');assert.equal(axonicUrl(p.axonic.profile,p.assetId),'axonic://demo/canonical');
 assert.equal(normaliseCase({...defaultCase(),assetId:'',axonic:{profile:'demo',assetId:'legacy'}}).assetId,'legacy');
});
await check('Height labels align where possible and pack densely without overlap',()=>{
 assert.deepEqual(placeHeightLabels([100,200],40,400),[100,200]);
 const dense=placeHeightLabels([100,105,110],40,400);assert.deepEqual(dense,[70,105,140]);
 const edge=placeHeightLabels([42,45,48],40,400);assert.equal(edge[0],40);assert.ok(edge.every((y,i)=>!i||y-edge[i-1]>=35));
});
await check('Measured end extrapolation removes mismatched anchors and preserves sampled sections',()=>{
 const readings=[50,300,600,900,1200].map((height,i)=>({Id:i,ServiceRequestId:10,HeightAgl:height,PoleCircumference:980,UnitType:'Metric',Ar:83}));
 const s=normalizeGridPole({Id:42,Height_M:9,PoleInspectionUB1000s:readings},'repeat');
 const p=defaultCase(),imported={...p,...applyGridInspection(p,s,'10')};
 assert.equal(validateCase(imported).length,0);
 for(const height of [-imported.embedment,0,.05,.6,1.2,9])assert.ok(Math.abs(diameterAt(imported,height)-.98/Math.PI)<1e-12);
 assert.deepEqual(imported.geometryEstimates.diameters,['butt','ground','tip']);assert.equal(imported.geometryEstimates.length,true);
 const saved=normaliseCase(JSON.parse(JSON.stringify(imported)));assert.deepEqual(saved.geometryEstimates,imported.geometryEstimates);
 const legacy={...imported,geometryEstimates:undefined,diameters:p.diameters};assert.ok(Math.abs(normaliseCase(legacy).diameters.ground-.98/Math.PI)<1e-12);
});
await check('Supported nominal taper anchors to measurements, otherwise fitted taper is bounded',()=>{
 const p={...defaultCase(),country:'NZ',species:'radiata-pine'},s=normalizeGridPole({Id:42,PoleClass:'6 kN',Height_M:8.2,PoleInspectionUB1000s:[{Id:1,ServiceRequestId:10,HeightAgl:600,PoleCircumference:980,UnitType:'Metric'}]},'class');
 const imported={...p,...applyGridInspection(p,s,'10')};assert.ok(imported.geometryEstimates.basis.includes('nominal taper'));
 assert.ok(imported.diameters.butt>imported.diameters.ground&&imported.diameters.ground>imported.diameters.tip);
 assert.ok(Math.abs(diameterAt(imported,.6)-.98/Math.PI)<1e-12);
 const descending=normalizeGridPole({Id:42,PoleInspectionUB1000s:[{Id:1,ServiceRequestId:10,HeightAgl:50,PoleCircumference:1000,UnitType:'Metric'},{Id:2,ServiceRequestId:10,HeightAgl:600,PoleCircumference:950,UnitType:'Metric'}]},'fit');
 const fitted={...p,...applyGridInspection(p,descending,'10')};assert.equal(validateCase(fitted).length,0);
 assert.ok(fitted.diameters.butt>=fitted.diameters.ground&&fitted.diameters.ground>=fitted.diameters.tip);
 assert.ok(!fitted.geometryEstimates.basis.includes('nominal'));
});
await check('Optional AR deconditioning blends uniformly and changes strength/capacity, not stiffness',()=>{
 const snapshot=normalizeGridPole({Id:99,PoleInspectionUB1000s:[{Id:1,ServiceRequestId:1,HeightAgl:0,Ar:65,UnitType:'Metric'},{Id:2,ServiceRequestId:1,HeightAgl:1200,Ar:65,UnitType:'Metric'},{Id:3,ServiceRequestId:1,HeightAgl:1200,Ar:80,UnitType:'Metric'}]},'AR-pole');
 const base={...defaultCase(),diameters:{butt:.32,ground:.32,tip:.32},assetId:'AR-pole',regions:[],soil:'Fixed',gridManager:snapshot},active={...base,arDeconditioning:true};
 assert.equal(arStrengthAt(base,.6),1);assert.equal(arStrengthAt(active,0),.65);assert.equal(arStrengthAt(active,.6),.65);assert.equal(deconditioningSamples(active).length,2);
 for(const [x,y] of [[0,0],[.05,0],[0,.05]]){const c=conditionAt(active,x,y,.6);assert.equal(c.tension,.65);assert.equal(c.compression,.65);assert.equal(c.e,1);assert.equal(c.voided,false);}
 assert.ok(Math.abs(arStrengthAt(active,1.2+AR_END_BLEND_M/2)-.825)<1e-12);assert.equal(arStrengthAt(active,1.2+AR_END_BLEND_M),1);
 const s=solvePole(base),d=solvePole(active);assert.ok(Math.abs(d.tipMovement/s.tipMovement-1)<1e-6);assert.ok(Math.abs(d.timberLimitKN/s.timberLimitKN-.65)<1e-5);
 const zone=d.stations.find(q=>q.z===.6);assert.ok(zone);const profiles=profileFromBasis(prepareHeightProfile(active),active.bearing,1,false);assert.ok(profiles.find(q=>Math.abs(q.z-.6)<1e-6).capacityApplied>0);
 assert.notDeepEqual(defectAppearance(active,0,0,.6,[180,180,180],'Setup'),[180,180,180]);
 assert.deepEqual(normaliseCase(JSON.parse(JSON.stringify(active))).arDeconditioning,true);assert.equal(arStrengthAt({...active,assetId:'different'},.6),1);assert.equal(arStrengthAt(defaultCase(),.6),1);
 assert.notEqual(structuralKey(active),structuralKey({...active,gridManager:{...snapshot,inspections:snapshot.inspections.map(s=>({...s,readings:s.readings.map(r=>({...r,ar:70}))}))}}));
 const zero={...active,gridManager:{...snapshot,inspections:snapshot.inspections.map(s=>({...s,readings:s.readings.map(r=>({...r,ar:0}))}))}};assert.equal(conditionAt(zero,0,0,.6).strength,0);assert.equal(solvePole(zero).timberLimitKN,0);assert.ok(solvePole({...zero,loadKN:0}).stations.every(s=>!Number.isNaN(s.usage)));
 const varied={...active,gridManager:{...snapshot,inspections:snapshot.inspections.map(s=>({...s,readings:[{...s.readings[0],heightM:.3,ar:60},{...s.readings[0],heightM:.9,ar:80},{...s.readings[0],heightM:.6,ar:null}]}))}};assert.ok(Math.abs(arStrengthAt(varied,.6)-.7)<1e-12);
});
console.log(`${passed} system integration checks passed including unit corrections and AGL dimensions.`);
