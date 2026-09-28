import {conditionAt,type PoleCase} from '../../domain/model.ts';
import type {SolidField} from './field.ts';
import {inLocalZone} from './field.ts';
import {recoverCurvedTensor} from './curvedRecovery.ts';
import {fibreAxisAt,fibreStresses} from './material.ts';
export interface SolidAssessment {status:'preliminary';capacityQualified:false;sampleCount:number;governing:{mode:string;ratioAtUnitLoad:number;point:number[]}|null;peaks:Record<string,{paAtUnitLoad:number;point:number[]}>;unassessed:string[];basis:string}
/** Interior element samples, not a claimed converged surface peak. No empirical
 * smoothing or stress addition. Shear strength is unavailable, rather than invented. */
export function assessSolid(p:PoleCase,field:SolidField):SolidAssessment{
 const result:SolidAssessment={status:'preliminary',capacityQualified:false,sampleCount:0,governing:null,peaks:{},unassessed:['Shear strength criterion','Splitting and interface fracture','Wall instability','Ultimate failure','Physical knot/decay calibration'],basis:'Element-interior maximum-stress screening. Along-fibre references use the case tension/compression values; across-fibre references use the existing illustrative 0.05 / 0.25 ratios. These ratios are assumptions, not approved pole data. No solid capacity is issued.'};
 if(p.material.basis!=='illustrative'){result.unassessed.unshift('Direct fibre tension/compression strengths');result.basis='Elastic solid stress components only. The case provides a pole bending reference, not direct fibre tension/compression strengths; normal-stress ratios and solid capacity are unassessed.';}
 if(!field.curved)return result;
 for(let i=0;i<field.elements;i++){const c=field.curved.coefficients,o=i*60,point=[0,1,2].map(k=>{const at=o+k*10;return c[at]+.25*(c[at+1]+c[at+2]+c[at+3])+.0625*(c[at+4]+c[at+5]+c[at+6]+c[at+7]+c[at+8]+c[at+9]);});
  if(!inLocalZone(p,field,point[2]))continue;const condition=conditionAt(p,...point as [number,number,number]);if(condition.voided)continue;
  const s=recoverCurvedTensor(field.curved,i,...point as [number,number,number],[.25,.25,.25]);if(!s)continue;const f=fibreStresses(s,fibreAxisAt(p,...point as [number,number,number])),factor=1-.95*condition.severity;result.sampleCount++;
  for(const [name,value] of Object.entries({poleAxis:s[2],longitudinal:f.longitudinal,transverse:f.transverse,shear:f.shear})){if(!result.peaks[name]||Math.abs(value)>Math.abs(result.peaks[name].paAtUnitLoad))result.peaks[name]={paAtUnitLoad:value,point};}
  if(p.material.basis!=='illustrative')continue;
  for(const [mode,value,strength] of [['Fibre tension',Math.max(0,f.longitudinal),p.material.tension],['Fibre compression',Math.max(0,-f.longitudinal),p.material.compression],['Across-fibre tension',Math.max(0,f.transverseMax),p.material.tension*.05],['Across-fibre compression',Math.max(0,-f.transverseMin),p.material.compression*.25]] as const){const ratio=value/(strength*factor);if(!result.governing||ratio>result.governing.ratioAtUnitLoad)result.governing={mode,ratioAtUnitLoad:ratio,point};}
 }
 return result;
}
