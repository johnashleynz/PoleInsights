const SAMPLE='https://linesmarts.com/wp-content/uploads/2022/04/poles5_full-2048x819.jpg';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let camera=null;
export function openCamera({category,assetId,onUse}){
 if(camera?.open)return;
 camera=document.createElement('dialog');camera.className='axonic-camera';document.body.append(camera);
 let captured=false;
 const dispose=()=>{camera.close();camera.remove();camera=null;};
 const render=()=>{camera.innerHTML=`<div class="camera-top"><button type="button" data-camera="cancel" aria-label="Cancel photo">‹</button><span>${esc(category==='Pole ID'?'Pole ID photo':category==='Pole lean'?'Pole lean photo':category==='Whole pole'?'Whole pole photo':'Photo observation')}</span></div><div class="camera-view"><img src="${SAMPLE}" alt="Demo camera view of a pole">${category==='Pole ID'?`<div class="id-plaque"><small>DEMO POLE ID</small><b>${esc(assetId)}</b></div>`:''}<div class="camera-guide" aria-hidden="true"></div><span class="camera-demo">Demo camera · sample image</span></div><p class="camera-instruction">${captured?'Check the photo before saving.':category==='Pole ID'?'Frame the pole ID so it is readable.':['Pole lean','Whole pole'].includes(category)?'Keep the whole pole in view.':'Frame the area you want to record.'}</p><div class="camera-controls">${captured?'<button class="camera-retake" type="button" data-camera="retake">Retake</button><button class="flat green" type="button" data-camera="use">Use photo</button>':'<button class="camera-shutter" type="button" data-camera="shutter" aria-label="Take photo"><span></span></button>'}</div>`;};
 camera.addEventListener('click',e=>{const a=e.target.closest('[data-camera]')?.dataset.camera;if(a==='cancel')dispose();if(a==='shutter'){captured=true;render();}if(a==='retake'){captured=false;render();}if(a==='use'){dispose();onUse({url:SAMPLE,assetId,category,mode:'demo-photo',source:'LineSmarts public website; simulated camera',description:category==='Pole ID'?'Demo pole ID photograph':'Demonstration utility poles photograph',...(category==='Pole ID'?{idPlaque:assetId}: {})});}});
 camera.addEventListener('cancel',e=>{e.preventDefault();dispose();});
 render();camera.showModal();
}
