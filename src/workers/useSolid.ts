import {yielding,loadPath} from '../analysis/nonlinear.ts';
import {useEffect,useRef,useState} from 'react';
import type {PoleCase} from '../domain/model.ts';
import type {SolidField} from '../analysis/solid/field.ts';
interface Job {result:SolidField|null;error:string|null}
export function useSolid(cases:PoleCase[],enabled:boolean,resolution:string){
 const seq=useRef(0),unitCases=cases.map(p=>yielding(p)&&p.regions.some(r=>r.kind==='drilling')?{...p,soilHistory:loadPath(p)}:{...p,loadKN:1,soilHistory:undefined}),key=JSON.stringify([unitCases,resolution]),[state,setState]=useState<{key:string;pending:boolean;jobs:Job[]}>({key:'',pending:false,jobs:[]});
 useEffect(()=>{const id=++seq.current;if(!enabled)return;if(state.key===key&&!state.pending&&state.jobs.length)return;let worker:Worker|null=null;setState({key,pending:true,jobs:[]});const timer=setTimeout(()=>{worker=new Worker(new URL('./solid.worker.ts',import.meta.url),{type:'module'});worker.onmessage=e=>{if(seq.current===e.data.id)setState({key,pending:false,jobs:e.data.results});};worker.onerror=()=>{if(seq.current===id)setState({key,pending:false,jobs:cases.map(()=>({result:null,error:'Detailed calculation could not finish. Try the initial mesh.'}))});};worker.postMessage({id,cases:unitCases,resolution});},180);return()=>{clearTimeout(timer);worker?.terminate();};},[key,enabled]);
 return enabled&&state.key===key?state:{key,pending:enabled,jobs:[] as Job[]};
}
