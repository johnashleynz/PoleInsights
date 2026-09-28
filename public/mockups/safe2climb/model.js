import {OUTCOMES,latestScan,leanNeeded,scanInputs,hasIdPhoto} from './flow.js';
export const POLICY={id:'s2c-nz-prototype-2',guide:'EEA August 2016',status:'Prototype · 2025 edition and asset-owner rules require verification'};
export const INSPECTOR={id:'DEMO-LM-014',name:'Alex Morgan',authorisation:'Demo competency record — not verified'};
export const ASSETS=[
 {id:'165483C',material:'Wood',address:'River Road · Hamilton',species:'Radiata pine',height:11,circumference:980,bandaged:false,construction:'Timber',climbDesign:'',management:'',location:{lat:-37.787,lng:175.2793,source:'Demo asset register'}},
 {id:'165484C',material:'Concrete',address:'River Road · Hamilton',construction:'Prestressed',climbDesign:'',management:'',location:{lat:-37.7872,lng:175.2796,source:'Demo asset register'}},
 {id:'165485C',material:'Steel',address:'River Road · Hamilton',construction:'Embedded hollow',climbDesign:'',management:'',location:{lat:-37.7874,lng:175.2799,source:'Demo asset register'}},
 {id:'165486C',material:'Fibreglass',address:'River Road · Hamilton',construction:'Composite',climbDesign:'',management:'',location:{lat:-37.7876,lng:175.2802,source:'Demo asset register'}}
];
export const stamp=()=>new Date().toISOString();
export const uid=()=>globalThis.crypto.randomUUID();
export function event(r,type,data={}){if(r.signed)throw Error('Signed record is locked');r.events.push({sequence:r.events.length+1,id:uid(),at:stamp(),actor:INSPECTOR.id,type,data:structuredClone(data)});r.updated=stamp();}
export function createInspection(asset=ASSETS[0]){const r={id:uid(),asset:structuredClone(asset),work:'routine',marking:'',answers:{},photos:[],lean:[],scans:[],events:[],created:stamp(),updated:stamp(),inspector:{...INSPECTOR},policy:{...POLICY},stage:'pole',confirmed:false,signed:null};event(r,'inspection.started',{asset:r.asset.id,assetSource:'Demo Axonic register'});return r;}
export function configure(r,patch){if(!patch.asset?.id?.trim()||!['Wood','Concrete','Steel','Fibreglass','Unknown'].includes(patch.asset.material)||!['routine','load','storm'].includes(patch.work)||!['none','red','amber','unknown'].includes(patch.marking))throw Error('Confirm the pole, work and marking.');if(r.asset.id!==patch.asset.id||r.asset.material!==patch.asset.material){retireEvidence(r,'Pole identity or material changed');}event(r,'scope.confirmed',{before:{asset:r.asset,work:r.work,marking:r.marking},after:patch});r.answers={};Object.assign(r,patch);r.confirmed=true;r.stage='checks';}
export function updateScope(r,{asset,work,marking}){
 if(r.signed)throw Error('Signed record is locked');
 if(!['Wood','Concrete','Steel','Fibreglass','Unknown'].includes(asset.material)||!['routine','load','storm'].includes(work)||!['','none','red','amber','unknown'].includes(marking))throw Error('Check the pole details.');
 const before={asset:structuredClone(r.asset),work:r.work,marking:r.marking};
 const identityChanged=asset.id.trim()!==r.asset.id,materialChanged=asset.material!==r.asset.material;
 asset={...asset,id:asset.id.trim()};
 if(identityChanged){asset=structuredClone(ASSETS.find(a=>a.id===asset.id)||{id:asset.id,material:asset.material,construction:asset.material==='Steel'?'Embedded hollow':'',location:null});marking='';}
 else if(materialChanged){asset={id:asset.id,material:asset.material,address:r.asset.address,location:r.asset.location,construction:asset.material==='Steel'?'Embedded hollow':''};}
 if(JSON.stringify(before)===JSON.stringify({asset,work,marking}))return;
 if(identityChanged||materialChanged){retireEvidence(r,'Pole identity or material changed');r.answers={};r.showDecision=false;}
 else {if(work!==r.work){delete r.answers.below;delete r.answers.drill;delete r.answers.loading;}if(asset.construction!==r.asset.construction||!!asset.bandaged!==!!r.asset.bandaged)delete r.answers.material;}
 event(r,'scope.updated',{before,after:{asset,work,marking}});
 Object.assign(r,{asset,work,marking});r.confirmed=!!asset.id&&!!marking;r.stage='checks';
}
export function baseChecks(r){const m=r.asset.material;return [
 {id:'visual',title:'Pole & attachments',hint:'Inspect the full visible pole, all sides, crossarms, fittings, stays and conductors.',source:'EEA §6.1b, §6.6',help:'Look for damage, cracks, decay, loose hardware, unusual conductor tension, lean or bending. Repaired poles still need the full assessment.'},
 {id:'setting',title:'Pole setting',hint:'Check embedment, surrounding ground and signs of movement.',source:'EEA §6.1b(iv–vi)',help:'Check for erosion, recent excavation, subsidence, voids and soft ground. Take extra care on banks and uneven ground.'},
 {id:'deflection',title:'Movement',hint:'Assess unusual movement or sound using the approved work method.',source:'EEA §6.1c',help:'A push test is unsuitable where the pole is constrained in all directions. Record this explicitly; do not record a pass for a test that was not performed.'},
 m==='Wood'?{id:'material',title:'Clean base & sound timber',hint:'Clear the base, inspect the timber and complete the approved hammer test.',source:'EEA §6.3a',help:'Assess the whole test area, including above ground. The guide describes hammer coverage to at least 1.8 m and around the circumference. A decayed or necked diameter at or below 80% of the original requires the section 8 route (2016 source). UB1000 does not replace this check.'}:
 m==='Concrete'?{id:'material',title:'Concrete condition',hint:'Check for spalling, cracking, damage and rust staining.',source:'EEA §6.2',help:'Prestressed rust staining needs additional inspection. Damage that may affect strength requires the section 8 work method; a scan is not a substitute.'}:
 m==='Steel'?{id:'material',title:'Steel & base condition',hint:r.asset.construction==='Flanged'?'Check base, bolts, securing nuts and welds.':'Check base corrosion, remaining metal and damage.',source:'EEA §6.4',help:'Use the asset-owner method for this steel construction. Embedded hollow poles require assessment of remaining wall thickness. If it cannot be established, use the section 8 route.'}:
 {id:'material',title:'Composite condition',hint:'Check cracking, delamination, discolouration and UV damage.',source:'EEA §6.5',help:'Inspect attachment points and the full length, including stress cracking. Confirm the asset-owner management and climbing arrangements first.'}
 ];}
export function requiredChecks(r){const checks=baseChecks(r);if(r.asset.material==='Wood'&&(r.work!=='routine'||r.answers.material?.value==='uncertain'))checks.push({id:'below',title:'Below-ground inspection',hint:'Complete the approved excavation, inspection and probing procedure.',source:'EEA §5.4, §6.3b / Appendix C',help:'Use your approved procedure for stabilisation, excavation sequence, probing, backfill and compaction. The source has inconsistent depth wording between text and flowchart; this mockup does not prescribe excavation depth.'});
 if(r.asset.material==='Wood'&&r.answers.below?.value==='uncertain')checks.push({id:'drill',title:'Further timber investigation',hint:'Obtain asset-owner approval before drilling; otherwise use alternative access.',source:'EEA §6.3c',help:'Drilling is a last investigation step and needs asset-owner approval. Record its reference, the approved method and the result; restore test holes under that method.'});
 if(r.work!=='routine')checks.push({id:'loading',title:'Work & load changes',hint:'Confirm the work method, structural adequacy and affected adjacent poles.',source:'EEA §5.4, §12',help:'A sound pole inspection alone does not establish capacity for changed loading. Reference the job assessment and record that affected nearby poles have been assessed.'});return checks;}
export function answer(r,id,value,detail={}){if(!requiredChecks(r).some(c=>c.id===id))throw Error('This check is not applicable.');if(!['sound','defect','unable','uncertain','constrained'].includes(value)||value==='constrained'&&id!=='deflection'||value==='uncertain'&&!(r.asset.material==='Wood'&&['material','below'].includes(id)))throw Error('Invalid assessment.');if(['below','drill','loading'].includes(id)&&value==='sound'&&(!detail.reference?.trim()||!detail.approvedMethodAttested))throw Error('Record the approved method and assessment.');if(id==='material'&&r.asset.material==='Steel'&&r.asset.construction==='Embedded hollow'&&value==='sound'&&(!Number.isFinite(detail.wallThickness)||detail.wallThickness<=0||!detail.reference?.trim()||!detail.approvedMethodAttested))throw Error('Record the remaining wall and approved assessment.');event(r,'check.attested',{id,previous:r.answers[id]||null,value,...detail});r.answers[id]={id:uid(),value,at:stamp(),...detail};if(id==='material'){delete r.answers.below;delete r.answers.drill;}if(id==='below')delete r.answers.drill;}
export function issues(r){const out=[];const add=(id,title,instruction,source)=>out.push({id,title,instruction,source});
 if(r.marking==='red')add('red','Do not climb','Record an alternative access or support plan and contact the supervisor.','EEA §7b(iii), §8b');
 if(r.marking==='amber')add('amber','Marked pole — work method required','Use the section 8 route. Any added loading needs an engineering evaluation and an agreed work method.','EEA §7b(ii), §8a–b');
 if(r.marking==='unknown')add('marking','Confirm the pole marking','Refer the marking to the asset owner before selecting a climbing method.','EEA §6.1b');
 if(r.asset.material==='Unknown')add('material-unknown','Confirm pole material','Identify the construction and applicable asset-owner procedure.','Prototype gate');
 if(r.asset.material==='Fibreglass'&&(!r.asset.management?.trim()||!r.asset.climbDesign?.trim()))add('frp','Check climbing arrangements','Record the asset-owner management reference and evidence that this pole is designed for climbing, or use alternative access.','EEA §6.5, §11 / Appendix C');
 if(r.asset.material==='Steel'&&!r.asset.climbDesign?.trim())add('steel','Check steel access arrangements','Confirm the climbing-design reference. A management record alone does not establish climbing design; otherwise use alternative access or a support plan.','EEA §6.4a, §11');
 if(r.asset.material==='Wood'&&r.asset.bandaged)add('bandage','Apply the bandaged-pole procedure','Verify the bandage, service life, management record and effective movement assessment under the asset-owner method. This prototype routes this case for review.','EEA §6.3d');
 if(r.asset.material==='Steel'&&r.asset.construction==='Railway iron')add('rail','Apply the asset-owner access procedure','Railway iron requires a specific asset-owner access determination. Record the method through the alternative-access route.','EEA §6.4c');
 for(const check of requiredChecks(r)){const a=r.answers[check.id];if(!a)continue;
 if(a.value==='defect'||a.value==='unable')add(check.id,check.title+' — '+(a.value==='defect'?'concern found':'unable to assess'),'Do not continue with an unsupported climb. Record the concern and the agreed next action.',check.source);
 if(a.value==='uncertain'){
 const resolved=check.id==='material'?(r.answers.below?.value==='sound'||r.answers.drill?.value==='sound'):check.id==='below'?r.answers.drill?.value==='sound':false;
 if(!resolved)add(check.id,check.title+' — investigation required',check.id==='material'?'Complete the below-ground investigation or record alternative access.':check.id==='below'?'Record an approved further investigation or alternative access.':'Refer the uncertain assessment to the supervisor.',check.source);
 }
 }
 const latest=latestScan(r);
 if(latest&&latest.quality!=='accepted')add('scan-'+latest.id,OUTCOMES[latest.quality],latest.quality==='repeat'?'Move the probes 100 mm higher and collect the retest.':'Do not climb. Record the next action and refer the concern.','Demo UB1000 outcome');
 if(leanNeeded(r)&&!r.lean.some(l=>l.photoId&&l.points))add('lean-required','Capture pole lean','Take the pole photograph and mark its base and top.','Operator concern');

 return out;}
export function readiness(r){const outstanding=requiredChecks(r).filter(c=>!r.answers[c.id]);if(!hasIdPhoto(r))outstanding.unshift({id:'pole-id-photo',title:'Pole ID photo'});if(r.asset.material==='Wood'&&!latestScan(r))outstanding.push({id:'ub1000',title:'UB1000 measurement'});const blocks=issues(r);return {outstanding,issues:blocks,complete:r.confirmed&&outstanding.length===0&&blocks.length===0};}
export function sign(r,{decision,attestation,reference='',contact=''}){const state=readiness(r);if(!hasIdPhoto(r))throw Error('Take a photo of the pole ID before saving.');if(!r.confirmed)throw Error('Enter the pole ID and select the pole tag before saving.');if(!attestation)throw Error('Confirm your assessment before saving.');if(decision==='climb'&&!state.complete)throw Error('Resolve the outstanding checks before recording a climb decision.');if(!['climb','alternative','stop'].includes(decision))throw Error('Choose a work decision.');if(decision!=='climb'&&reference.trim().length<3)throw Error('Record the next action or approved work-method reference.');
 event(r,'inspection.signed',{decision,reference,contact,attestation,issues:state.issues.map(i=>i.id),outstanding:state.outstanding.map(i=>i.id)});
 r.signed={at:stamp(),by:INSPECTOR.id,decision,reference,contact,attestation,outcome:state.complete?'Checks complete':'Action required',notification:decision==='climb'?'Not requested':'Pending — no notification sent'};r.stage='record';return structuredClone(r);}
export function scanRecord(r,quality='accepted',repeatOf=null,inputs=null){
 if(r.signed)throw Error('Signed record is locked');
 if(r.asset.material!=='Wood')throw Error('UB1000 timber capture is not applicable to this material.');
 if(!OUTCOMES[quality])throw Error('Invalid fixture');
 const previous=latestScan(r);
 if(previous&&(previous.quality!=='repeat'||repeatOf!==previous.id))throw Error('A single UB1000 result is already recorded. Only the requested retest can be captured.');
 if(!previous&&repeatOf)throw Error('Original measurement missing');
 if(!inputs)throw Error('Confirm the required measurement inputs.');
 const validated=scanInputs(r,{species:inputs.species,size:inputs.circumference,sizeMode:'circumference',scanHeight:inputs.scanHeight});
 const scan={id:uid(),at:stamp(),kind:'ub1000.acquisition',assetId:r.asset.id,...validated,voltageUsed:40,quality,outcome:OUTCOMES[quality],repeatOf,deviceId:'DEMO-UB1000-014',calibration:'Demo current',algorithm:'Fixture only — no safety threshold',signal:[0,.04,.12,.6,1,.45,.2,.06,0]};
 r.scans.push(scan);event(r,'measurement.captured',scan);return scan;
}

export function envelope(r){return {schema:'axonic.inspection/0.1-prototype',application:'Safe2Climb',assetRef:r.asset.id,inspectionId:r.id,record:structuredClone(r),destination:'Shared Axonic/Safe backend (adapter not connected)',delivery:'local-only'};}

export function retireEvidence(r,reason){if(r.signed)throw Error('Signed record is locked');const prior={asset:structuredClone(r.asset),photos:r.photos,lean:r.lean,scans:r.scans,reason,at:stamp()};r.retiredEvidence??=[];if(r.photos.length||r.lean.length||r.scans.length){r.retiredEvidence.push(prior);event(r,'evidence.retired',prior);}r.photos=[];r.lean=[];r.scans=[];delete r.ubInputs;}
