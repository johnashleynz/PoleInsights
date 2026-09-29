import {utilisationColour} from './utilisationPalette.ts';
export {utilisationColour} from './utilisationPalette.ts';
import type {SolidField} from '../analysis/solid/field.ts';
import {displayedStress} from '../analysis/solid/field.ts';
import {CanvasTexture,RepeatWrapping,SRGBColorSpace,Source} from 'three';
import {clamp,conditionAt,diameterAt,exteriorRadiusAt} from '../domain/model.ts';
import {defectAppearance,type Raster} from './defectAppearance.ts';
import type {PoleCase,ViewMode,StressDisplay} from '../domain/model.ts';
import {stationAt,stressAt,utilisationAt} from '../analysis/beam.ts';
import type {AnalysisResult} from '../analysis/beam.ts';

export function random(seed:number) {let t=seed;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return ((r^r>>>14)>>>0)/4294967296;};}
export function stressColour(value:number):[number,number,number] {
  const q=clamp(Math.abs(value)/35e6,0,1),a=[241,243,245],b=value<0?[38,107,129]:[178,58,44];
  return a.map((v,i)=>Math.round(v+(b[i]-v)*Math.pow(q,.65))) as [number,number,number];
}
const images=new Map<string,HTMLImageElement>();
/** Reuse the sawn-face asset, repainting the actual section's defect mask after load. */
export function withEndgrain(paint:(image?:HTMLImageElement)=>void){
  return withPhoto('textures/endgrain-p08.png',paint);
}
export function withPhoto(path:string,paint:(image?:HTMLImageElement)=>void){
  let img=images.get(path);
  if(!img){img=new Image();images.set(path,img);img.src=`${import.meta.env.BASE_URL}${path}`;}
  const source=img,apply=()=>paint(source);
  if(source.complete&&source.naturalWidth)apply();else {paint();source.addEventListener('load',apply,{once:true});}
  return()=>source.removeEventListener('load',apply);
}
export function imageTexture(path:string,onLoad:()=>void){
  const texture:import('three').Texture=fallbackWood();let img=images.get(path);
  if(!img){img=new Image();images.set(path,img);img.src=`${import.meta.env.BASE_URL}${path}`;}
  const source=img,apply=()=>{texture.image=source;texture.needsUpdate=true;onLoad();};
  if(source.complete&&source.naturalWidth)apply();else source.addEventListener('load',apply,{once:true});
  texture.addEventListener('dispose',()=>source.removeEventListener('load',apply));return texture;
}
export function poleTopTexture(p:PoleCase,z:number,view:ViewMode,result:AnalysisResult|null,display:StressDisplay,onLoad:()=>void,utilisationMax=1.5){
  const canvas=sectionCanvas(p,z,view,result,512,display,utilisationMax),texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
  if(view==='Stresses')return texture;
  let grain:HTMLImageElement|undefined,atlas:Raster|undefined;
  const apply=()=>{paintSection(canvas,p,z,view,result,display,grain,undefined,atlas,utilisationMax);texture.needsUpdate=true;onLoad();};
  const end=withPhoto('textures/endgrain-p08.png',image=>{grain=image;apply();}),defects=withPhoto('textures/defects-p08.png',image=>{if(image){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,512,512);atlas={width:512,height:512,data:ctx.getImageData(0,0,512,512).data};}apply();});
  texture.addEventListener('dispose',()=>{end();defects();});return texture;
}
let cachedWood:CanvasTexture|null=null;
let pineImage:HTMLImageElement|null=null;
export function woodTexture(onLoad:()=>void=()=>{}) {
  const texture:import('three').Texture=fallbackWood();
  if(!pineImage){pineImage=new Image();pineImage.src=`${import.meta.env.BASE_URL}textures/treated-pine-p02.png`;}
  const source=pineImage;
  const apply=()=>{texture.image=source;texture.needsUpdate=true;onLoad();};
  if(source.complete&&source.naturalWidth)apply();else source.addEventListener('load',apply,{once:true});
  texture.addEventListener('dispose',()=>source.removeEventListener('load',apply));
  return texture;
}
function fallbackWood() {
  if(cachedWood){const texture=cachedWood.clone();texture.source=new Source(cachedWood.image);return texture;}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=2048;
  const ctx=canvas.getContext('2d')!,data=ctx.createImageData(canvas.width,canvas.height),rnd=random(132);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const warp=x+3*Math.sin(y*.003+x*.03)+1.8*Math.sin(y*.013),grain=Math.sin(warp*.23)+.5*Math.sin(warp*.77)+.3*Math.sin(warp*2.7),coarse=Math.sin(x*.033+Math.sin(y*.002))*7,noise=(rnd()-.5)*14,t=grain*6+coarse+noise,i=(y*canvas.width+x)*4;
    data.data[i]=clamp(128+t,0,255);data.data[i+1]=clamp(136+t*.88,0,255);data.data[i+2]=clamp(126+t*.7,0,255);data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  for(let i=0;i<100;i++){
    const x=rnd()*512,y=rnd()*2048,len=40+rnd()*500;ctx.strokeStyle=`rgba(57,36,18,${.05+rnd()*.2})`;ctx.lineWidth=.3+rnd();ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+3,y+len*.3,x-2,y+len*.6,x+1,y+len);ctx.stroke();
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.wrapS=RepeatWrapping;texture.wrapT=RepeatWrapping;texture.anisotropy=8;cachedWood=texture.clone();texture.source=new Source(canvas);return texture;
}
export function sectionCanvas(p:PoleCase,z:number,view:ViewMode,result:AnalysisResult|null,size=512,display:StressDisplay='stress',utilisationMax=1.5) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  paintSection(canvas,p,z,view,result,display,undefined,undefined,undefined,utilisationMax);return canvas;
}
export function paintSection(canvas:HTMLCanvasElement,p:PoleCase,z:number,view:ViewMode,result:AnalysisResult|null,display:StressDisplay='stress',photo?:CanvasImageSource,solid?:SolidField|null,atlas?:Raster,utilisationMax=1.5) {
  const ctx=canvas.getContext('2d')!,size=canvas.width,R=diameterAt(p,z)/2,scale=size*.46/R,c=size/2,img=ctx.createImageData(size,size),rnd=random(871),station=result?stationAt(result,z):null;
  let base:Uint8ClampedArray|undefined;
  if(photo){ctx.clearRect(0,0,size,size);ctx.drawImage(photo,-size*.396,-size*.302,size*1.4,size*1.4);base=ctx.getImageData(0,0,size,size).data;}
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const x=(px-c)/scale,y=-(py-c)/scale,r=Math.hypot(x,y),i=(py*size+px)*4;if(r>R)continue;
    const a=Math.atan2(y,x),bearing=((Math.atan2(x,y)*180/Math.PI)+360)%360;if(r>exteriorRadiusAt(p,z,bearing))continue;
    const cond=conditionAt(p,x,y,z),noise=(rnd()-.5)*9;
    let rgb:[number,number,number];
    if(view==='Stresses'){
      if(cond.voided)continue;
      const value=displayedStress(p,station,x,y,z,display,solid);rgb=value===null?[215,219,222]:display==='utilisation'?utilisationColour(value,utilisationMax):stressColour(value);
    }else{
      const rr=Math.hypot(x+R*.085,y-R*.045),ring=(rr/R+Math.sin(a*3+rr*80)*.012+Math.sin(a*7)*.003)*32,late=Math.pow((1+Math.sin(ring*Math.PI*2))/2,10),lines=late*25,grain=2*Math.sin(px*.8+py*.09),edge=r>R*.965?24:0;
      rgb=[187-lines+noise+grain-edge,195-lines*.9+noise+grain-edge,178-lines*.8+noise-edge];
      if(base)rgb=[base[i],base[i+1],base[i+2]];
      rgb=defectAppearance(p,x,y,z,rgb,view,atlas) as [number,number,number];
    }
    img.data[i]=clamp(rgb[0],0,255);img.data[i+1]=clamp(rgb[1],0,255);img.data[i+2]=clamp(rgb[2],0,255);img.data[i+3]=255;
  }
  ctx.clearRect(0,0,size,size);ctx.putImageData(img,0,0);
  if(view==='Setup'){
    ctx.save();ctx.beginPath();ctx.arc(c,c,size*.455,0,Math.PI*2);ctx.clip();ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=.65;
    for(let i=-size;i<size*2;i+=7){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+size*.22,size);ctx.stroke();}ctx.restore();
  }
  return canvas;
}
export function soilTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!,rnd=random(447);ctx.fillStyle='#503626';ctx.fillRect(0,0,256,256);
  for(let i=0;i<11000;i++){const x=rnd()*256,y=rnd()*256;ctx.fillStyle=rnd()>.5?'rgba(19,11,5,.4)':'rgba(135,94,55,.3)';ctx.beginPath();ctx.ellipse(x,y,.5+rnd()*2,.5+rnd()*1.3,rnd()*Math.PI,0,Math.PI*2);ctx.fill();}const t=new CanvasTexture(c);t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(3,1);t.colorSpace=SRGBColorSpace;return t;
}

