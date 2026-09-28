export type UnitSystem = 'metric' | 'imperial';

const M_TO_FT = 3.280839895013123;
const KN_TO_LBF = 224.80894387096;
const MPA_TO_KPSI = 0.14503773773021;
const KNM_TO_LBF_FT = 737.56214927727;

export const unitLabels = {
  metric: {poleLength:'m', smallLength:'mm', force:'kN', stress:'MPa', moment:'kN·m'},
  imperial: {poleLength:'ft', smallLength:'in', force:'lbf', stress:'kpsi', moment:'lbf·ft'},
} as const;

export function displayPoleLength(metres:number, system:UnitSystem){return system==='metric'?metres:metres*M_TO_FT;}
export function poleLengthFromDisplay(value:number, system:UnitSystem){return system==='metric'?value:value/M_TO_FT;}
export function displaySmallLength(metres:number, system:UnitSystem){return system==='metric'?metres*1000:metres*M_TO_FT*12;}
export function smallLengthFromDisplay(value:number, system:UnitSystem){return system==='metric'?value/1000:value/(M_TO_FT*12);}
export function displayForce(kN:number, system:UnitSystem){return system==='metric'?kN:kN*KN_TO_LBF;}
export function forceFromDisplay(value:number, system:UnitSystem){return system==='metric'?value:value/KN_TO_LBF;}
export function displayStress(mPa:number, system:UnitSystem){return system==='metric'?mPa:mPa*MPA_TO_KPSI;}
export function displayMoment(kNm:number, system:UnitSystem){return system==='metric'?kNm:kNm*KNM_TO_LBF_FT;}
export function formatFeetInches(metres:number,digits=1){const inches=metres*M_TO_FT*12,feet=Math.floor(inches/12),remaining=inches-feet*12;return `${feet} ft ${remaining.toFixed(digits)} in`;}
export function formatPoleLength(metres:number, system:UnitSystem, digits=2){return system==='metric'?`${metres.toFixed(digits)} m`:formatFeetInches(metres,Math.min(digits,2));}
export function formatSmallLength(metres:number, system:UnitSystem, digits=0){return `${displaySmallLength(metres,system).toFixed(digits)} ${unitLabels[system].smallLength}`;}
export function formatForce(kN:number, system:UnitSystem, digits=2){return `${displayForce(kN,system).toFixed(digits)} ${unitLabels[system].force}`;}
export function formatStress(mPa:number, system:UnitSystem, digits=1){return `${displayStress(mPa,system).toFixed(digits)} ${unitLabels[system].stress}`;}
export function formatMoment(kNm:number, system:UnitSystem, digits=2){return `${displayMoment(kNm,system).toFixed(digits)} ${unitLabels[system].moment}`;}

