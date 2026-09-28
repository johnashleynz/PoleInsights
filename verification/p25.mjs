import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {acquisitionMessage} from '../src/inspection/mockupProtocol.ts';
const checks=[];
function check(name,pass){checks.push({name,pass});if(!pass)throw Error(name);}
const relay=readFileSync('public/mockups/phoneBridge.js','utf8').replaceAll('export ','');
const bridge=readFileSync('public/mockups/labBridge.js','utf8').replaceAll('export ','');
for(const kind of ['axonic','safe2climb'])for(const embedded of [false,true]){
 const label=`${kind} ${embedded?'embedded':'popup'}`,messages=[],listeners={},childListeners={},timers=[];
 const host={postMessage:(data,origin)=>messages.push({data,origin})},child={};
 const frame={contentWindow:child},win={addEventListener:(type,fn)=>listeners[type]=fn};
 win.parent=embedded?host:win;win.opener=embedded?null:host;
 const pole={id:'Lab-B',species:'Radiata pine',scanHeight:600,circumference:1040};
 const search='?'+new URLSearchParams({labSession:'secret',labApp:kind,pole:JSON.stringify(pole),ignored:'discard'});
 const context=vm.createContext({window:win,location:{search,origin:'http://lab.test',href:`http://lab.test/mockups/${kind}/phone.html${search}`},document:{querySelector:()=>frame},URL,URLSearchParams,Number});
 vm.runInContext(relay+'\nconnectPhone();',context);
 const url=new URL(frame.src);
 check(`${label}: fixed local child, correct entry route`,url.pathname===`/mockups/${kind}/index.html`&&url.hash===(kind==='axonic'?'#analyser/summary':'#capture'));
 check(`${label}: launch snapshot and session forwarded exactly`,url.searchParams.get('pole')===JSON.stringify(pole)&&url.searchParams.get('labSession')==='secret'&&url.searchParams.get('labApp')===kind&&!url.searchParams.has('ignored'));
 const receive=(data,origin='http://lab.test',source=child)=>listeners.message({data,origin,source});
 const good={type:'pole-lab-acquisition-v1',token:'secret',kind,running:true,runId:'doc:1',heightMM:600};
 for(const [name,event] of Object.entries({origin:()=>receive(good,'http://other.test'),source:()=>receive(good,undefined,{}),token:()=>receive({...good,token:'old'}),app:()=>receive({...good,kind:'unknown'}),type:()=>receive({...good,type:'other'}),running:()=>receive({...good,running:'true'}),run:()=>receive({...good,runId:3}),longRun:()=>receive({...good,runId:'x'.repeat(100)}),height:()=>receive({...good,heightMM:Infinity}),null:()=>receive(null)})){
  const before=messages.length;event();check(`${label}: relay rejects ${name}`,messages.length===before);
 }
 const childWin={parent:{postMessage:(data,origin)=>receive(data,origin)},addEventListener:(type,fn)=>childListeners[type]=fn};
 const childContext=vm.createContext({window:childWin,location:{search:url.search,origin:url.origin},URLSearchParams,crypto:{randomUUID:()=> 'child-doc'},setInterval:fn=>(timers.push(fn),1),clearInterval:()=>{},Number,JSON});
 vm.runInContext(bridge,childContext);
 const run=code=>vm.runInContext(code,childContext),last=()=>messages.at(-1).data;
 run('connectLab()');check(`${label}: real child idle crosses wrapper`,last().running===false&&last().heightMM===null);
 run('publishScan(true,600)');const first=last().runId;
 check(`${label}: real capture reaches lab validator`,!!acquisitionMessage(last(),'secret',kind)&&last().running&&last().heightMM===600);
 timers[0]();check(`${label}: heartbeat preserves scan identity`,last().runId===first&&last().running);
 run('publishScan(false)');check(`${label}: completion pauses`,!last().running);
 run('publishScan(true,700)');check(`${label}: retest keeps new identity and height`,last().runId!==first&&last().heightMM===700);
 childListeners.pagehide();check(`${label}: inner app exit pauses`,!last().running);
 run('publishScan(true,800)');listeners.pagehide();check(`${label}: wrapper exit pauses`,!last().running);
 check(`${label}: exact outgoing origin`,messages.every(m=>m.origin==='http://lab.test'));
}
for(const kind of ['axonic','safe2climb']){
 const html=readFileSync(`public/mockups/${kind}/phone.html`,'utf8'),js=readFileSync(`public/mockups/${kind}/phone.js`,'utf8');
 check(`${kind}: phone chrome restored`,['Samsung Galaxy S21 Ultra','camera-hole','android-status','android-nav','width:430px;height:910px','width:412px;height:892px'].every(s=>html.includes(s)));
 check(`${kind}: one launcher, no premature child`,!html.includes('pop-out')&&!html.includes('src="./index.html')&&!js.includes('window.open'));
 for(const [width,height] of [[478,910],[356,700],[280,400],[700,280]]){
  const styles={},space={style:{}},events={};
  const c=vm.createContext({document:{querySelector:s=>s==='.device'?{style:{setProperty:(k,v)=>styles[k]=v}}:space},innerWidth:width,innerHeight:height,Math,addEventListener:(k,fn)=>events[k]=fn,connectPhone:()=>{}});
  vm.runInContext(js.replace(/^import .*;\r?\n/,''),c);
  check(`${kind}: phone fits ${width}x${height}`,parseFloat(space.style.width)<=width&&parseFloat(space.style.height)+32<=height&&styles['--device-scale']>0);
 }
}
writeFileSync('verification/results/p25.json',JSON.stringify({checks,scope:'Phone wrapper transport, hostile message rejection, launch metadata and responsive fit. Not UB1000 inference or device certification.'},null,2)+'\n');
console.log(`P25: ${checks.length} checks passed.`);
