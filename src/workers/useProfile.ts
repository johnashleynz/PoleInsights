import {useEffect,useRef,useState} from 'react';
import type {PoleCase} from '../domain/model.ts';
import type {ProfileRow} from '../analysis/heightProfile.ts';
const EMPTY:ProfileRow[]=[];
export function useProfile(pole:PoleCase){const worker=useRef<Worker|null>(null),sequence=useRef(0),[state,setState]=useState<{rows:ProfileRow[];key:string;error?:string}>({rows:[],key:''}),key=JSON.stringify(pole);
 useEffect(()=>{const w=new Worker(new URL('./profile.worker.ts',import.meta.url),{type:'module'});worker.current=w;return()=>{w.terminate();worker.current=null;};},[]);
 useEffect(()=>{const id=++sequence.current,w=worker.current!;w.onmessage=e=>{if(e.data.id===sequence.current)setState({rows:e.data.rows??[],key,error:e.data.error});};const timer=setTimeout(()=>w.postMessage({pole,id}),120);return()=>clearTimeout(timer);},[key]);
 return {rows:state.key===key?state.rows:EMPTY,pending:state.key!==key,error:state.key===key?state.error:undefined};
}
