import {connectPhone} from '../phoneBridge.js';
const device=document.querySelector('.device'),space=document.querySelector('.device-space');
if(device&&space){
  const fit=()=>{const scale=Math.max(.05,Math.min(1,(innerWidth-20)/430,(innerHeight-42)/910));device.style.setProperty('--device-scale',scale);space.style.width=430*scale+'px';space.style.height=910*scale+'px';};
  addEventListener('resize',fit);fit();
}


connectPhone();
