import {diameterAt} from '../domain/model.ts';
import type {PoleCase} from '../domain/model.ts';
import {defectAppearance,type Raster} from '../scene/defectAppearance.ts';
self.onmessage=async e=>{try{const {pole,woodURL,atlasURL}=e.data as {pole:PoleCase;woodURL:string;atlasURL:string},load=async(url:string)=>{const r=await fetch(url);if(!r.ok)throw Error('Texture unavailable');return createImageBitmap(await r.blob());},[wood,atlasImage]=await Promise.all([load(woodURL),load(atlasURL)]),w=512,h=2048,canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d')!;
 const tiles=Math.max(1,Math.ceil(pole.length/2));for(let i=0;i<tiles;i++)ctx.drawImage(wood,0,i*h/tiles,w,h/tiles);wood.close();
 const ac=new OffscreenCanvas(512,512),at=ac.getContext('2d')!;at.drawImage(atlasImage,0,0,512,512);atlasImage.close();const atlas:Raster={width:512,height:512,data:at.getImageData(0,0,512,512).data},image=ctx.getImageData(0,0,w,h);
 for(let py=0;py<h;py++){const z=pole.length-pole.embedment-py/(h-1)*pole.length;if(!pole.regions.some(r=>z>=r.zMin&&z<=r.zMax))continue;const R=diameterAt(pole,z)/2;for(let px=0;px<w;px++){const a=px/w*2*Math.PI,x=R*Math.cos(a),y=R*Math.sin(a),i=(py*w+px)*4,base=[image.data[i],image.data[i+1],image.data[i+2]],rgb=defectAppearance(pole,x,y,z,base,'Setup',atlas);for(let k=0;k<3;k++)image.data[i+k]=rgb[k];}}
 ctx.putImageData(image,0,0);const bitmap=await createImageBitmap(canvas,{imageOrientation:'flipY'});self.postMessage({bitmap},{transfer:[bitmap]});
 }catch(error){self.postMessage({error:String(error)});}};
