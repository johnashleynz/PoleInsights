import {yielding,loadPath} from '../analysis/nonlinear.ts';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {PoleCase} from '../domain/model.ts';
import type {AnalysisResult} from '../analysis/beam.ts';
import {scaleUnitResult} from '../analysis/beam.ts';
export interface Job {result:AnalysisResult|null;error:string|null}
export function useAnalysis(cases:PoleCase[]) {
  const sequence=useRef(0),worker=useRef<Worker|null>(null),unitCases=cases.map(p=>yielding(p)?{...p,soilHistory:loadPath(p)}:{...p,loadKN:1}),key=JSON.stringify(unitCases),loads=cases.map(p=>p.loadKN).join(',');
  const [state,setState]=useState<{key:string;pending:boolean;jobs:Job[]}>({key:'',pending:true,jobs:[]});
  useEffect(()=>{
    const id=++sequence.current;
    setState(old=>({...old,pending:true}));
    const timer=setTimeout(()=>{
      worker.current?.terminate();
      const w=new Worker(new URL('./analysis.worker.ts',import.meta.url),{type:'module'});worker.current=w;
      w.onmessage=event=>{if(event.data.id!==sequence.current)return;setState({key,pending:false,jobs:event.data.results});};
      w.onerror=()=>{if(id===sequence.current)setState({key,pending:false,jobs:cases.map(()=>({result:null,error:'The calculation worker could not run. Reload to try again.'}))});};
      w.postMessage({id,cases:unitCases});
    },90);
    return ()=>{clearTimeout(timer);worker.current?.terminate();};
  },[key]);
  // Never show the previous case's result as a result for current inputs.
  const jobs=useMemo(()=>state.key===key?state.jobs.map((job,i)=>({...job,result:job.result?(job.result.nonlinear?job.result:scaleUnitResult(job.result,cases[i].loadKN)):null})):cases.map(()=>({result:null,error:null})),[state,key,loads]);
  return {pending:state.pending||state.key!==key,jobs};
}
