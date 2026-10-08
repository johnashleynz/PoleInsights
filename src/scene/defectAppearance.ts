import {conditionAt,defectDistance} from '../domain/model.ts';
import type {PoleCase,ViewMode} from '../domain/model.ts';
import {arStrengthAt} from '../integrations/deconditioning.ts';
export interface Raster {width:number;height:number;data:Uint8ClampedArray}
export function defectAppearance(p:PoleCase,x:number,y:number,z:number,base:number[],view:ViewMode,atlas?:Raster):number[]{
 const degradation=1-arStrengthAt(p,z);
 if(degradation>0)base=base.map((v,i)=>v*(1-degradation*.65)+[145,95,65][i]*degradation*.65);
 const cond=conditionAt(p,x,y,z);if(!cond.knot&&!cond.voided&&cond.severity===0)return base;
 const region=p.regions.find(r=>defectDistance(p,r,x,y,z)<=1&&(cond.voided?(r.kind==='void'||r.kind==='drilling'):cond.knot?r.kind==='knot':r.kind==='decay'));
 if(!region)return base;const q=Math.min(1,Math.max(0,defectDistance(p,region,x,y,z))),sh=region.shape;
 let u=x*8+.5,v=y*8+.5;
 if(sh.type!=='section-contours'&&region.decay?.pattern!=='shell'&&region.kind!=='drilling'){u=(x-sh.centreX)/(2*sh.radiusX)+.5;v=.5-(y-sh.centreY)/(2*sh.radiusY);}
 const tile=cond.knot?0:cond.voided?2:1;
 let rgb:number[];
 if(atlas){const size=atlas.width/2,ix=Math.floor(clamp01(u)*(.96*size)+.02*size)+(tile%2)*size,iy=Math.floor(clamp01(v)*(.96*atlas.height/2)+.02*atlas.height/2)+Math.floor(tile/2)*atlas.height/2,i=(Math.floor(iy)*atlas.width+Math.floor(ix))*4;rgb=[atlas.data[i],atlas.data[i+1],atlas.data[i+2]];}
 else {const fibre=Math.sin(x*730+Math.sin(y*103)*2)*5+Math.sin(y*912+x*80)*4;rgb=cond.knot?[103+fibre,68+fibre,37+fibre]:cond.voided?[43+fibre,32+fibre,22+fibre]:[120+fibre,78+fibre,45+fibre];}
 if(cond.drilled)return [42+q*35,31+q*29,22+q*22];
 if(cond.voided){const light=.18+.64*Math.pow(q,3);return rgb.map(v=>v*light);}
 if(cond.knot){const mix=Math.min(1,(1-q)*14);return base.map((v,k)=>v*(1-mix)+rgb[k]*mix);}
 // Incipient decay can be visually subtle. Innerview intentionally reveals the
 // prescribed condition; it is not a simulation of visible symptoms or a scan.
 const mix=view==='Innerview'?Math.min(.95,.18+cond.severity*.95):Math.min(.95,cond.severity**1.7);
 return base.map((v,k)=>v*(1-mix)+rgb[k]*mix);
}
function clamp01(v:number){return Math.min(.999999,Math.max(0,v));}
