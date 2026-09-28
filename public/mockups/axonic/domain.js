// This module is a deterministic scenario simulator, not a UB1000 algorithm.
export const VERSION = 'demo-0.1';
export const FREQUENCIES = [37, 48, 50, 68, 73];
export const SCENARIOS = {
  normal: { label:'Normal pole', asset:'165482c', note:'A usable groundline reading with no demo deterioration indication.', capacity:9.2, range:[7.4,11.0], fibre:47.8, fibreRange:[38.5,57.2], reference:10 },
  deteriorated: { label:'Deteriorated pole', asset:'165483c', note:'A usable reading with a deterioration indication. Engineering review follows.', capacity:3.6, range:[2.1,5.1], fibre:18.7, fibreRange:[10.9,26.5], reference:10 },
  inconclusive: { label:'Inconclusive · additional reading', asset:'165484c', note:'A usable signal with an uncertain interpretation. A second plane is requested.', capacity:6.1, range:[3.5,8.8], fibre:31.7, fibreRange:[18.2,45.8], reference:10 },
  poor: { label:'Poor signal · repeat', asset:'165485c', note:'The first reading is rejected. A repeat succeeds; both attempts remain in history.', capacity:8.8, range:[6.7,10.9], fibre:45.8, fibreRange:[34.8,56.7], reference:10 },
  detailed: { label:'Detailed engineering assessment', asset:'165486c', note:'Three illustrative measurements with directional differences and a governing section.', capacity:6.8, range:[4.7,8.8], fibre:35.4, fibreRange:[24.4,45.8], reference:10 }
};
export const DEFAULT_SETTINGS = { frequency:50, voltage:70, gain:'High', txCount:8, cycles:1, correction:1.08, group:'BA / BB', units:'metric' };
export function parsePoleInputs(input) {
  const poleId=input.poleId===undefined?undefined:String(input.poleId).trim();
  if(poleId!==undefined&&(!poleId||poleId.length>64))throw new Error('Enter a pole ID between 1 and 64 characters.');
  const length=Number(input.length),height=Number(input.poleHeight),species=String(input.species||'').trim();
  const planeHeight=Number(input.scanHeight),direction=Number(input.direction),size=Number(input.size);
  if(!Number.isFinite(length)||length<=0||length>60)throw new Error('Enter a pole length greater than 0 and no more than 60 m.');
  if(!Number.isFinite(height)||height<=0||height>length)throw new Error('Height above ground must be greater than 0 and no greater than pole length.');
  if(!species||species.length>80)throw new Error('Choose or enter a pole species.');
  if(!['circumference','diameter'].includes(input.sizeMode))throw new Error('Choose circumference or diameter.');
  const circumference=Math.round((input.sizeMode==='diameter'?size*Math.PI:size)*10)/10;
  if(!Number.isFinite(size)||size<=0||circumference<300||circumference>1800)throw new Error('For this demo enter circumference 300–1800 mm, or equivalent diameter 95.5–572.9 mm.');
  if(String(input.scanHeight??'').trim()===''||!Number.isFinite(planeHeight)||planeHeight< -1000||planeHeight>3000)throw new Error('Enter a scan height between −1000 and 3000 mm.');
  if(![0,90].includes(direction))throw new Error('Choose direction A or B.');
  return {asset:{length,height,species,...(poleId===undefined?{}:{id:poleId})},position:{height:planeHeight,direction,circumference}};
}
export function updatePoleDetails(record,input) {
  const parsed=parsePoleInputs(input);
  const next={...record.asset,...parsed.asset,...(parsed.position.height===0?{circumference:parsed.position.circumference}:{})};
  if(JSON.stringify(next)!==JSON.stringify(record.asset)){
    record.asset=next;record.contextRevision=(record.contextRevision||0)+1;
    record.history.unshift({time:new Date().toISOString(),type:'Pole details updated',text:`${next.species} · length ${next.length} m · above ground ${next.height} m · GL circumference ${next.circumference} mm. Earlier scans retain their original context.`});
  }
  return parsed.position;
}
export function newRecord(scenario='normal') {
  if (!SCENARIOS[scenario]) throw new Error('Unknown demo scenario');
  const spec=SCENARIOS[scenario];
  const record={ scenario, asset:{ id:spec.asset, source:'Axonic demo fixture', location:'Demonstration work package · New Zealand', species:'Radiata pine', treatment:'CCA', length:12, height:9.6, circumference:940, class:'12 m / 10 kN', year:1996, lean:1.2, workType:'Routine maintenance', inspection:'Existing pre-climb checks held in Axonic (assumed)', restriction:null }, measurements:[], history:[], next:1, created:new Date().toISOString(), settings:{...DEFAULT_SETTINGS}, connected:true, calibration:'current-demo', calibrationEvents:[], research:[], reviewRequested:false };
  if (scenario==='detailed') {
    for (const [height,direction] of [[0,0],[0,90],[300,0]]) takeMeasurement(record,{height,direction});
  }
  return record;
}
export function outcome(record) {
  if (record.asset.restriction) return 'restricted';
  if (!record.measurements.length) return record.concern?'review':'ready';
  const last=record.measurements.at(-1);
  if (last.quality==='rejected') return 'repeat';
  if(last.metadataPending)return 'details';
  if((last.contextRevision||0)!==(record.contextRevision||0))return 'ready';
  if(last.demoOutcome)return record.concern&&last.demoOutcome==='clear'?'review':last.demoOutcome;
  const accepted=record.measurements.filter(m=>m.quality==='accepted');
  if (!accepted.length) return 'repeat';
  if (record.scenario==='inconclusive') return accepted.length<2?'additional':'review';
  if (record.concern) return 'review';
  if (['deteriorated','detailed'].includes(record.scenario)) return 'review';
  return 'clear';
}
export function takeMeasurement(record, options={}) {
  if (!record.connected) throw new Error('Connect the probe pair before measuring.');
  if (record.calibration!=='current-demo') throw new Error('Complete a demo block check before measuring.');
  if (record.asset.restriction) throw new Error('This demo asset has an existing restriction.');
  const settings={...record.settings, ...options.settings};
  validateSettings(settings);
  const additional=outcome(record)==='additional';
  const previous=outcome(record)==='repeat'?record.measurements.at(-1):null;
  const height=Number(options.height??previous?.height??(additional?300:0));
  const direction=Number(options.direction??previous?.direction??(additional?90:0));
  const circumference=Number(options.circumference??previous?.circumference??(additional?925:record.asset.circumference));
  if (!Number.isFinite(height)||height< -1000||height>3000) throw new Error('Use a measurement height between −1000 and 3000 mm.');
  if (![0,90].includes(direction)) throw new Error('Choose direction A or B.');
  if (!Number.isFinite(circumference)||circumference<300||circumference>1800) throw new Error('Use a circumference between 300 and 1800 mm for this demo.');
  const fixture=options.fixtureKey||record.scenario;
  if(!SCENARIOS[fixture])throw new Error('Unknown measurement fixture.');
  const rejected=fixture==='poor'&&(options.fixtureKey!==undefined||record.measurements.length===0);
  const index=record.next++;
  const m={id:`M${String(index).padStart(2,'0')}`,height,direction,circumference,time:new Date().toISOString(),quality:rejected?'rejected':'accepted',reason:rejected?'No stable arrival identified; repeat after checking probe contact.':'Demo acquisition accepted',tof:rejected?null:([ 'deteriorated','inconclusive'].includes(fixture)?412:326)+index*9,snr:rejected?7:31+index,peakEnergy:rejected?null:(fixture==='deteriorated'?820:5200)-index*120,attenuation:rejected?null:(fixture==='deteriorated'?0.087:0.043)+index*0.001,settings,calibrationId:record.calibrationEvents.at(-1)?.id||'CAL-DEMO-01',firmware:'3.13.0-59 · reference',algorithm:VERSION,source:'synthetic fixture',included:!rejected};
  m.assetSnapshot={...record.asset};m.contextRevision=record.contextRevision||0;m.photoIds=(record.photos||[]).map(p=>p.id);
  if(options.fixtureKey){m.fixtureKey=fixture;m.demoCycle=true;m.demoOutcome=fixture==='poor'?'repeat':fixture==='inconclusive'?'additional':fixture==='normal'?'clear':'review';}
  record.measurements.push(m);
  record.history.unshift({time:m.time,type:rejected?'Reading rejected':'Reading captured',text:`${m.id} · ${height===0?'Groundline':`${height} mm AGL`} · direction ${direction===0?'A':'B'} · ${rejected?'retained for audit':'automatically assessed'}`});
  return m;
}
export function engineeringResult(record) {
  if (record.asset.restriction) return null;
  if(record.measurements.length&&(record.measurements.at(-1).contextRevision||0)!==(record.contextRevision||0))return null;
  if(record.measurements.at(-1)?.demoCycle)return measurementResult(record,record.measurements.at(-1));
  const accepted=record.measurements.filter(m=>m.quality==='accepted'&&m.included);
  if (!accepted.length||['repeat','additional','ready','details'].includes(outcome(record))) return null;
  const spec=SCENARIOS[record.scenario];
  return {...spec,strengthLossPercent:Math.round((1-spec.capacity/spec.reference)*100),strengthLossBasis:'Loss relative to demo reference capacity; not fibre-strength loss or a validated algorithm',percent:Math.round(spec.capacity/spec.reference*100),governing:record.scenario==='detailed'?accepted.find(m=>m.height===0&&m.direction===90)?.id||accepted[0].id:accepted[0].id,provenance:'Illustrative scenario values; not calculated from ultrasound',validated:false};
}
// Per-measurement result, independent of later scans or edits to the pole form.
export function measurementResult(record,m){
  if(!m||m.metadataPending||m.quality==='rejected')return null;
  if(m.demoOutcome==='additional')return null;
  if(m.resultSnapshot)return {...m.resultSnapshot};
  const key=m.fixtureKey||record.scenario,spec=SCENARIOS[key];
  if(key==='inconclusive'&&!m.demoCycle&&record.measurements.slice(0,record.measurements.indexOf(m)+1).filter(x=>x.quality==='accepted').length<2)return null;
  return {...spec,strengthLossPercent:Math.round((1-spec.capacity/spec.reference)*100),strengthLossBasis:'Demo reference capacity',percent:Math.round(spec.capacity/spec.reference*100),governing:m.id,provenance:'Illustrative per-scan fixture; not calculated from ultrasound',validated:false};
}
export function measurementSummary(record){
  const results=record.measurements.filter(m=>m.quality==='accepted'&&m.included!==false).map(m=>measurementResult(record,m)).filter(r=>r&&Number.isFinite(r.capacity)&&Number.isFinite(r.strengthLossPercent));
  if(!results.length)return null;
  return {minimumCapacity:Math.min(...results.map(r=>r.capacity)),maximumStrengthLoss:Math.max(...results.map(r=>r.strengthLossPercent)),count:results.length};
}
export function updateMeasurementGeometry(record,id,input){
  const m=record.measurements.find(m=>m.id===id);
  if(!m)throw new Error('Measurement not found.');
  const height=Number(input.scanHeight),size=Number(input.size),mode=input.sizeMode;
  if(String(input.scanHeight??'').trim()===''||!Number.isFinite(height)||height< -1000||height>3000)throw new Error('Enter a scan height between −1000 and 3000 mm.');
  if(!['circumference','diameter'].includes(mode))throw new Error('Choose circumference or diameter.');
  const c=input.canonicalCircumference??(mode==='diameter'?size*Math.PI:size);
  const circumference=Math.round(Number(c)*10)/10;
  if(String(input.size??'').trim()===''||!Number.isFinite(size)||size<=0||!Number.isFinite(circumference)||circumference<300||circumference>1800)throw new Error('Enter circumference 300–1800 mm, or the equivalent diameter.');
  const before={height:m.height,circumference:m.circumference,sizeMode:m.sizeMode||'circumference'},after={height,circumference,sizeMode:mode};
  if(JSON.stringify(before)===JSON.stringify(after))return m;
  const geometryChanged=before.height!==height||before.circumference!==circumference;
  m.originalGeometry??={...before};
  Object.assign(m,after,{enteredSize:Math.round(mode==='diameter'?circumference/Math.PI:circumference)});
  const time=new Date().toISOString();
  (m.geometryRevisions??=[]).push({time,before,after});
  if(geometryChanged){
    // Refresh the existing fixture result. No geometry-to-strength model is established.
    delete m.resultSnapshot;m.resultSnapshot=measurementResult(record,m);
    m.resultRefresh={time,inputs:{height,circumference},mode:'fixed demo fixture; geometry model not implemented',validated:false};
  }
  record.history.unshift({time,type:'Measurement details edited',text:`${id} · ${before.height} → ${height} mm height · ${before.circumference} → ${circumference} mm circumference.`,measurementId:id,before,after});
  return m;
}
export function validateSettings(s) {
  if (!FREQUENCIES.includes(Number(s.frequency))) throw new Error('Choose one of the five research analysis bands.');
  if (![40,70].includes(Number(s.voltage))||!['High','Low'].includes(s.gain)) throw new Error('Choose a supported demo acquisition preset.');
  if (![4,8,16].includes(Number(s.txCount))||![1,2,4].includes(Number(s.cycles))) throw new Error('Choose a supported demo Tx setting.');
  if (!Number.isFinite(Number(s.correction))||s.correction<0.25||s.correction>4) throw new Error('Correction factor must be between 0.25 and 4 for this demonstration.');
  if (!['BA / BB','HA / HB'].includes(s.group)) throw new Error('Choose a demo probe pair.');
  return s;
}
export function makeWaveform(m, normalised=false, frequency=50) {
  // Synthetic waveform for inspection only. No energy/strength inference is performed.
  const scale=m.quality==='rejected'?0.11:Math.min(1,(m.peakEnergy||4000)/5400);
  const correction=normalised?Number(m.settings.correction):1;
  return Array.from({length:200},(_,i)=>{
    const t=i*5; const noise=(Math.sin(i*3.73)+Math.cos(i*1.71))*0.023;
    const envelope=Math.exp(-(((t-330)/80)**2))*scale+Math.exp(-(((t-580)/135)**2))*scale*0.64;
    return {x:t,y:(Math.sin(t*frequency/190)*envelope+noise)*correction};
  });
}
export function frequencySeries(record, frequencies=FREQUENCIES) {
  if (!frequencies.length||frequencies.some(f=>!FREQUENCIES.includes(f))) throw new Error('Select at least one supported analysis band.');
  const m=record.measurements.findLast(m=>m.quality==='accepted');
  if (!m) throw new Error('Capture a usable demo measurement first.');
  return frequencies.map(frequency=>{const i=FREQUENCIES.indexOf(frequency);return {frequency,rawEnergy:Math.round(m.peakEnergy*(0.74+0.035*i)),normalisedEnergy:Math.round(m.peakEnergy*(0.74+0.035*i)*record.settings.correction),snr:27+i*2,measurement:m.id,settings:{...record.settings},source:'synthetic spectral demonstration'};});
}
export function exportRecord(record) { return {schema:'innerview-demo/1',demo:true,engineeringValidated:false,climbAuthorisation:false,axonicSync:'not implemented',record,result:engineeringResult(record)}; }
