// User-requested website-photo shortcut. No camera permission or file picker.
export const DEMO_PHOTO='https://innerviewinsights.com/wp-content/uploads/2026/04/IMG_7231.jpg';
export function installPhotos({getRecord,save,render,openDialog,esc,toast,preserveDraft}){
 let loading=false;
 document.addEventListener('click',async e=>{
  const thumbnail=e.target.closest('[data-photo]');
  if(thumbnail){const p=getRecord().photos?.find(x=>x.id===thumbnail.dataset.photo);if(p)openDialog('Demo pole photo','<img class="photo-full" src="'+esc(p.data)+'" alt="Pole photograph"><p>Website demonstration image · not a photograph of this demo asset.</p><a href="https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/" target="_blank" rel="noreferrer">Photo source: InnerView Insights / PowerNet</a>');return;}
  if(e.target.closest('[data-action]')?.dataset.action!=='photo'||loading)return;
  preserveDraft();const target=getRecord();loading=true;
  const button=e.target.closest('button');button.disabled=true;button.setAttribute('aria-busy','true');
  try{
   await new Promise((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>reject(new Error('Photo could not load. Check internet access and try again.')),12000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(new Error('Website photo unavailable. Tap Take photo to retry.'));};img.src=DEMO_PHOTO;});
   if(target!==getRecord())return;
   const photo={id:'PHOTO-INNERVIEW-DEMO',name:'InnerView Insights / PowerNet pole photograph',data:DEMO_PHOTO,time:new Date().toISOString(),source:'InnerView Insights / PowerNet website demo',sourceUrl:'https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/',isSiteEvidence:false};
   target.photos=[...(target.photos||[]).filter(p=>p.id!==photo.id&&p.id!=='PHOTO-WEBSITE-DEMO'),photo].slice(-3);
   target.history.unshift({time:photo.time,type:'Demo photo added',text:'Public InnerView Insights / PowerNet website image; not field evidence.'});
   save();if(target===getRecord()){preserveDraft();render();}
  }catch(error){toast(error.message);}finally{loading=false;button.disabled=false;button.removeAttribute('aria-busy');}
 });
}
