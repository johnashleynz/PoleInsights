export const utilisationStops:[number,[number,number,number]][]=[[0,[39,153,83]],[.4,[45,116,214]],[.6,[247,220,48]],[.8,[242,143,38]],[1,[215,42,42]]];
/** Fixed thresholds up to 100%; only the red-to-purple overrun range adapts. */
export function utilisationColour(value:number,maximum=1.5):[number,number,number]{
 if(!Number.isFinite(value))return [202,210,216];
 const stops:[number,[number,number,number]][]=[...utilisationStops,[Math.max(1.000001,maximum),[74,16,105]]],v=Math.max(0,value);
 for(let i=1;i<stops.length;i++){const [end,b]=stops[i],[start,a]=stops[i-1];if(v<=end){const t=(v-start)/(end-start);return a.map((n,k)=>Math.round(n+(b[k]-n)*t)) as [number,number,number];}}
 return [74,16,105];
}
