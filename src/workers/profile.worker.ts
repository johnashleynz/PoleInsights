import {yielding,solveNonlinearPole} from '../analysis/nonlinear.ts';
import {stationAt} from '../analysis/beam.ts';
import {prepareHeightProfile,profileFromBasis,type DirectionBasis} from '../analysis/heightProfile.ts';
let key='',basis:DirectionBasis[]=[];
self.onmessage=e=>{const {pole,id}=e.data;try{const k=JSON.stringify({...pole,loadKN:1,bearing:0,soilHistory:undefined,soilResponse:undefined});if(k!==key){basis=prepareHeightProfile(pole);key=k;}let rows=profileFromBasis(basis,pole.bearing,pole.loadKN,false);if(yielding(pole)){const r=solveNonlinearPole(pole);rows=rows.map(row=>{const s=stationAt(r,row.z);return {...row,stressApplied:Math.max(Math.abs(s.stressMin),Math.abs(s.stressMax))/1e6,usageApplied:s.usage};});}self.postMessage({id,rows});}catch(error){self.postMessage({id,error:error instanceof Error?error.message:'Profile unavailable'});}};
