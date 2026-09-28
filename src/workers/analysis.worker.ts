import {solveNonlinearPole} from '../analysis/nonlinear.ts';
import type {PoleCase} from '../domain/model.ts';
self.onmessage=(event:MessageEvent<{id:number;cases:PoleCase[]}>)=>{
  const {id,cases}=event.data;
  const results=cases.map(p=>{try{return {result:solveNonlinearPole(p),error:null};}catch(e){return {result:null,error:e instanceof Error?e.message:'Analysis did not complete.'};}});
  self.postMessage({id,results});
};
