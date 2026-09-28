export interface FilmLabel {text?:string;side:'left'|'right';start:number;end:number;y?:number;cueTime?:number;word?:string}
/** Speech-derived windows; no fallback chapter timer. */
export function filmLabelPose(label:FilmLabel|undefined,t:number,duration:number){
 if(!label)return {x:32,y:178,side:'left' as const,alpha:0};
 const alpha=Math.max(0,Math.min(1,(t-label.start)/.25,(Math.min(label.end,duration)-t)/.4));
 return {x:label.side==='left'?32:492,y:label.y??178,side:label.side,alpha};
}
