// Scan-first interaction simulator. No real adaptive voltage or strength model.
import {validateSettings,updatePoleDetails,takeMeasurement,measurementResult} from './domain.js';
export const SCAN_DURATION_MS=15000;
export const DEMO_SEQUENCE=['normal','deteriorated','inconclusive','poor','detailed'];
export function beginAcquisition(record,options={}){
  if(!record.connected)throw new Error('Connect the probe pair before measuring.');
  if(record.calibration!=='current-demo')throw new Error('Complete a demo block check before measuring.');
  if(record.asset.restriction)throw new Error('This pole has an existing restriction.');
  const settings={...record.settings,...options.settings};validateSettings(settings);
  const startVoltage=Number(settings.voltage);
  const fixtureKey=options.cycle?DEMO_SEQUENCE[record.measurements.filter(m=>m.demoCycle).length%DEMO_SEQUENCE.length]:undefined;
  // One explicit fixture shows automatic step-down. It is not a control policy.
  const finalVoltage=(fixtureKey||record.scenario)==='normal'&&startVoltage===70?40:startVoltage;
  return {startedAt:new Date().toISOString(),settings,startVoltage,finalVoltage,options:{...options,...(fixtureKey?{fixtureKey}:{})},finished:false};
}
export function finishAcquisition(record,session,input){
  if(session.finished)throw new Error('This scan is already saved.');
  let position,error=null;
  try{position=updatePoleDetails(record,input);}catch(e){error=e.message;}
  const m=takeMeasurement(record,{...session.options,...position,settings:{...session.settings,voltage:session.finalVoltage}});
  session.finished=true;
  if(session.options.repeatOf)m.repeatOf=session.options.repeatOf;
  m.startedAt=session.startedAt;m.voltageStart=session.startVoltage;m.voltageUsed=session.finalVoltage;
  m.voltageHistory=[{voltage:session.startVoltage,phase:'start',simulated:true},...(session.finalVoltage!==session.startVoltage?[{voltage:session.finalVoltage,phase:'automatic adjustment',simulated:true}]:[])];
  m.metadataPending=!!error;
  if(error){m.assetSnapshot=null;m.metadataError=error;}
  m.sizeMode=session.options.entrySizeMode||'circumference';
  m.enteredSize=Math.round(m.sizeMode==='diameter'?m.circumference/Math.PI:m.circumference);
  m.resultSnapshot=measurementResult(record,m);
  return m;
}
export function completeScanDetails(record,input){
  const position=updatePoleDetails(record,input),last=record.measurements.at(-1);
  if(last?.metadataPending){
    Object.assign(last,position,{assetSnapshot:{...record.asset},contextRevision:record.contextRevision||0,photoIds:(record.photos||[]).map(p=>p.id),metadataPending:false,metadataCompletedAt:new Date().toISOString()});
    delete last.metadataError;
    last.enteredSize=Math.round(last.sizeMode==='diameter'?last.circumference/Math.PI:last.circumference);
    last.resultSnapshot=measurementResult(record,last);
    record.history.unshift({time:last.metadataCompletedAt,type:'Scan details completed',text:`${last.id} · details supplied after signal capture; original signal and voltage retained.`});
  }
  return position;
}
