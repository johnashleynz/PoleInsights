import type {PoleCase,ViewMode,StressDisplay} from '../domain/model.ts';
import {diameterAt,conditionAt} from '../domain/model.ts';
import type {AnalysisResult} from '../analysis/beam.ts';
import type {SolidField} from '../analysis/solid/field.ts';
import {paintSection} from './materials.ts';
import {sectionReferenceRadius,sectionGroundRadius} from './sectionGeometry.ts';

/** End-on projection of the remaining pole. The cut uses the actual solved field;
 * the surrounding annulus is the visible tapered exterior, never a stress map. */
export function paintTaperedSection(canvas:HTMLCanvasElement,p:PoleCase,z:number,view:ViewMode,result:AnalysisResult|null,display:StressDisplay,photo?:HTMLImageElement,wood?:HTMLImageElement,solid?:SolidField|null,ground=false,grass?:HTMLImageElement,cut?:HTMLCanvasElement,preview=false,zoom=1){
  const ctx=canvas.getContext('2d')!,size=canvas.width,c=size/2,ref=sectionReferenceRadius(p,ground)/zoom,scale=size*.46/ref,R=diameterAt(p,z)/2,butt=diameterAt(p,-p.embedment)/2,grassRadius=sectionGroundRadius(p);
  ctx.clearRect(0,0,size,size);
  if(ground&&z>0){ctx.save();ctx.beginPath();ctx.arc(c,c,grassRadius*scale,0,Math.PI*2);ctx.clip();ctx.fillStyle='#537a32';ctx.fillRect(0,0,size,size);if(grass)ctx.drawImage(grass,grass.naturalWidth*.26,grass.naturalHeight*.26,grass.naturalWidth*.48,grass.naturalHeight*.48,c-grassRadius*scale,c-grassRadius*scale,2*grassRadius*scale,2*grassRadius*scale);ctx.restore();}
  const image=ctx.getImageData(0,0,size,size);
  let bark:Uint8ClampedArray|undefined;
  if(wood){const sample=document.createElement('canvas');sample.width=256;sample.height=512;const sc=sample.getContext('2d')!;sc.drawImage(wood,0,0,256,512);bark=sc.getImageData(0,0,256,512).data;}
  const levels=[-p.embedment,...(z>0?[0]:[]),z],sides=levels.slice(1).map((b,i)=>({a:levels[i],b,ra:diameterAt(p,levels[i])/2,rb:diameterAt(p,b)/2})),outer=Math.max(R,...sides.map(s=>s.ra));
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const x=(px-c)/scale,y=(c-py)/scale,r=Math.hypot(x,y);if(r<=R||r>outer)continue;
    let h:number|null=null;for(const side of sides)if(side.ra>side.rb&&r>=side.rb&&r<=side.ra)h=side.a+(side.b-side.a)*(side.ra-r)/(side.ra-side.rb);if(h===null||(ground&&z>0&&h<0))continue;
    const a=Math.atan2(y,x),u=Math.floor((a+Math.PI)/(2*Math.PI)*255),v=Math.min(511,Math.floor((h+p.embedment)/p.length*511)),j=(v*256+u)*4,i=(py*size+px)*4;
    const shade=.64+.20*Math.cos(a-2.3),cond=conditionAt(p,x,y,h);
    for(let k=0;k<3;k++)image.data[i+k]=(bark?bark[j+k]:[146,151,135][k])*shade*(1-cond.severity*.35);
    image.data[i+3]=view!=='Stresses'?255:80;
  }
  ctx.clearRect(0,0,size,size);ctx.putImageData(image,0,0);
  const face=cut??document.createElement('canvas');if(!cut){face.width=face.height=preview?64:Math.max(64,Math.round(size*R/ref));paintSection(face,p,z,view,result,display,photo,solid);}
  const ratio=R/ref;ctx.drawImage(face,c*(1-ratio),c*(1-ratio),size*ratio,size*ratio);
  // The butt circumference stays at its true radius as the cut moves.
  ctx.strokeStyle='rgba(71,83,88,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(c,c,butt*scale,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(34,46,51,.55)';ctx.beginPath();ctx.arc(c,c,R*scale,0,Math.PI*2);ctx.stroke();
}
