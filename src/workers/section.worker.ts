import {paintSection} from '../scene/materials.ts';
import type {PoleCase,StressDisplay,ViewMode} from '../domain/model.ts';
import type {SolidField} from '../analysis/solid/field.ts';
import type {AnalysisResult} from '../analysis/beam.ts';
import type {Raster} from '../scene/defectAppearance.ts';
let config:{utilisationMax?:number;pole:PoleCase;result:AnalysisResult|null;solid?:SolidField|null;display:StressDisplay;view:ViewMode;photoURL:string;atlasURL:string}|null=null;
let photo:ImageBitmap|undefined,atlas:Raster|undefined,ready=Promise.resolve();
async function image(url:string){const response=await fetch(url);if(!response.ok)throw Error('Texture unavailable');return createImageBitmap(await response.blob());}
self.onmessage=async event=>{
 if(event.data.kind==='configure'){config=event.data;ready=(async()=>{if(config!.view==='Stresses')return;const assets=await Promise.allSettled([image(config!.photoURL),image(config!.atlasURL)]);if(assets[0].status==='fulfilled')photo=assets[0].value;if(assets[1].status==='fulfilled'){const source=assets[1].value,canvas=new OffscreenCanvas(512,512),ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0,512,512);atlas={width:512,height:512,data:ctx.getImageData(0,0,512,512).data};source.close();}})();return;}
 if(!config)return;await ready;const {z,size,id}=event.data;
 try{const canvas=new OffscreenCanvas(size,size);paintSection(canvas as unknown as HTMLCanvasElement,config.pole,z,config.view,config.result,config.display,photo,config.solid,atlas,config.utilisationMax);const pixels=canvas.getContext('2d')!.getImageData(0,0,size,size).data;self.postMessage({id,z,size,pixels},{transfer:[pixels.buffer]});}catch(error){self.postMessage({id,z,error:String(error)});}
};
