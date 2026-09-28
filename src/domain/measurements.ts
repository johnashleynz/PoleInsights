export type GirthMode='diameter'|'circumference';
export const measurementMM=(diameter:number|null,mode:GirthMode)=>diameter===null?null:diameter*1000*(mode==='circumference'?Math.PI:1);
export const diameterFromMM=(value:number|null,mode:GirthMode)=>value===null?null:value/1000/(mode==='circumference'?Math.PI:1);
