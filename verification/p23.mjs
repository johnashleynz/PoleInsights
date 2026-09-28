import {readFileSync,readdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {acquisitionMessage} from '../src/inspection/mockupProtocol.ts';
const checks=[];function check(name,pass){checks.push({name,pass});if(!pass)throw Error(name);}
const good={type:'pole-lab-acquisition-v1',token:'session',kind:'axonic',running:true,runId:'document:1',heightMM:300};
check('Valid acquisition accepted',!!acquisitionMessage(good,'session','axonic'));
for(const [name,value] of Object.entries({token:{...good,token:'old'},kind:{...good,kind:'safe2climb'},type:{...good,type:'other'},boolean:{...good,running:'true'},height:{...good,heightMM:NaN},run:{...good,runId:3},null:null}))check(`Reject invalid ${name}`,!acquisitionMessage(value,'session','axonic'));
check('Idle with no scan height accepted',!!acquisitionMessage({...good,running:false,heightMM:null},'session','axonic'));
const bridge=readFileSync('public/mockups/labBridge.js','utf8').replaceAll('export ','');
function environment(embedded){
 const messages=[],listeners={},elements=[],timers=[];
 const host={postMessage:(data,origin)=>messages.push({data:{...data},origin})};
 const win={addEventListener:(type,fn)=>listeners[type]=fn};win.parent=embedded?host:win;win.opener=embedded?null:host;
 const context=vm.createContext({window:win,location:{search:'?labSession=session&labApp=axonic&pole=%7B%22id%22%3A%22Lab-A%22%7D',origin:'http://lab.test'},URLSearchParams,crypto:{randomUUID:()=> 'doc'},document:{createElement:()=>({}),head:{append:e=>elements.push(e)},body:{prepend:e=>elements.push(e)}},setInterval:fn=>(timers.push(fn),1),clearInterval:()=>{},Number,JSON});
 vm.runInContext(bridge,context);return {context,messages,listeners,elements,timers};
}
for(const embedded of [false,true]){
 const e=environment(embedded),run=code=>vm.runInContext(code,e.context),last=()=>e.messages.at(-1).data;
 run('connectLab()');check(`${embedded?'Frame':'Popup'} initial idle`,last().running===false);
 run('publishScan(true,420)');const first=last().runId;check('Starts at requested section',last().running&&last().heightMM===420);
 run('publishScan(true)');check('Render heartbeat does not restart or lose height',last().runId===first&&last().heightMM===420);
 run('publishScan(false)');check('Scan completion pauses',last().running===false);
 run('publishScan(true,520)');check('Retest has new run and height',last().runId!==first&&last().heightMM===520);
 e.timers[0]();check('Heartbeat retains scan state',last().running&&last().heightMM===520);
 e.listeners.pagehide();check('Leaving mockup stops animation',!last().running);
 check('Messages use exact origin',e.messages.every(m=>m.origin==='http://lab.test'));
 check('No added workflow banner',e.elements.length===0);
}
for(const kind of ['axonic','safe2climb']){
 const base=resolve('public/mockups',kind),files=readdirSync(base);
 check(`${kind} no service-worker bundle`,!files.includes('sw.js'));
 for(const file of files.filter(f=>f.endsWith('.js'))){
  const path=resolve(base,file),text=readFileSync(path,'utf8');
  check(`${kind}/${file} isolated storage and no SW registration`,!text.includes('localStorage')&&!text.includes('serviceWorker.register'));
  for(const match of text.matchAll(/from\s+['"](\.[^'"]+)['"]/g))check(`${kind}/${file} import ${match[1]} exists`,existsSync(resolve(dirname(path),match[1])));
 }
 const app=readFileSync(resolve(base,'app.js'),'utf8');
 check(`${kind} actual acquisition hook`,app.includes(kind==='axonic'?'publishScan(true,Number(poleInput().scanHeight))':'publishScan(true,inputs.scanHeight)'));
}
writeFileSync('verification/results/p23.json',JSON.stringify({checks,scope:'Workflow playback transport and bundle integrity; not UB1000 calibration or safety validation.'},null,2));
console.log(`P23: ${checks.length} integration checks passed.`);
