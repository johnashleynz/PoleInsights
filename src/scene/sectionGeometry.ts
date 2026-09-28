import {diameterAt} from '../domain/model.ts';
import type {PoleCase} from '../domain/model.ts';

export const sectionGroundRadius=(p:PoleCase)=>Math.max(.5,diameterAt(p,0)/2+.04);

/** A fixed physical scale shared by every height, including unusual reverse tapers. */
export function sectionReferenceRadius(p:PoleCase,ground=false){
  return Math.max(ground?sectionGroundRadius(p):0,...[-p.embedment,0,p.length-p.embedment].map(z=>diameterAt(p,z)/2));
}

/** Highest visible side surface below the cut in an orthographic end-on view. */
export function sideHeightAt(p:PoleCase,cut:number,r:number):number|null{
  const levels=[-p.embedment,...(cut>0?[0]:[]),cut];
  let height:number|null=null;
  for(let i=0;i<levels.length-1;i++){
    const a=levels[i],b=levels[i+1],ra=diameterAt(p,a)/2,rb=diameterAt(p,b)/2;
    if(ra<=rb||r<rb||r>ra)continue;
    height=a+(b-a)*(ra-r)/(ra-rb);
  }
  return height;
}
