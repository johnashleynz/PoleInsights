import type {AnalysisResult} from '../analysis/beam.ts';
/** Existing whole-pole timber reference. Never derive bending capacity from the acoustic/area proxy. */
export function inspectionCapacity(result:AnalysisResult|null,bearing:number){
 if(!result||!Number.isFinite(result.timberLimitKN)||result.timberLimitKN<0)return null;
 return {capacityKN:result.timberLimitKN,governingHeight:result.timberZ,bearing:((bearing%360)+360)%360,
  basis:'whole-pole-elastic-timber-reference-v1',excludesSoilLimit:true,nonlinearFailure:false};
}
