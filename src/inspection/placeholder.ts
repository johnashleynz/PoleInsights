import {soundStrength} from '../domain/species.ts';
import {conditionAt,diameterAt,type PoleCase} from '../domain/model.ts';
export const PROBE_BODY_LENGTH=.180;
export const PROBE_TIP_LENGTH=.020;
export const PROBE_LENGTH=PROBE_BODY_LENGTH+PROBE_TIP_LENGTH;
export const PROBE_DIAMETER=.050;
export const WAVE_GUIDE_LENGTH=.050;
export const WAVE_GUIDE_EXPOSED=.030;
export const PROBE_OUTER_REACH=WAVE_GUIDE_EXPOSED+PROBE_LENGTH;
/** Explicit sandbox truth summary, NOT ultrasonic inference or a UB1000 calibration.
 * Equal-area samples integrate the existing illustrative longitudinal strength factors.
 * Remaining-fibre mean excludes voids. Capacity proxy includes missing material at zero.
 * This area-strength proxy is not a bending capacity or a Remaining Strength Value. */
export function placeholderAssessment(p:PoleCase,z:number){
 const R=diameterAt(p,z)/2,nr=48,na=96;let wood=0,strength=0;
 for(let i=0;i<nr;i++){const r=R*Math.sqrt((i+.5)/nr);for(let j=0;j<na;j++){const a=(j+.5)*Math.PI*2/na,c=conditionAt(p,r*Math.cos(a),r*Math.sin(a),z);if(!c.voided){wood++;strength+=c.strength;}}}
 return {basis:'sandbox-placeholder-v1',fibreStrength:wood?strength/wood:null,fibreStrengthMPa:wood?strength/wood*soundStrength(p.material)/1e6:null,soundReferenceMPa:soundStrength(p.material)/1e6,capacityReduction:1-strength/(nr*na),woodRemaining:wood/(nr*na),height:z};
}
