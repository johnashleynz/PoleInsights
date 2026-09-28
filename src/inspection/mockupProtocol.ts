export type MockupKind='safe2climb'|'axonic';
export interface AcquisitionMessage {type:'pole-lab-acquisition-v1';token:string;kind:MockupKind;running:boolean;runId:string;heightMM:number|null}
export interface WaveControl {running:boolean;runId:string}
export function acquisitionMessage(value:unknown,token:string,kind:MockupKind):AcquisitionMessage|null {
 if(!value||typeof value!=='object')return null;
 const v=value as AcquisitionMessage;
 return v.type==='pole-lab-acquisition-v1'&&v.token===token&&v.kind===kind&&typeof v.running==='boolean'&&typeof v.runId==='string'&&v.runId.length<100&&(v.heightMM===null||typeof v.heightMM==='number'&&Number.isFinite(v.heightMM))?v:null;
}
