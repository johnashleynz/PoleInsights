import {writeFileSync} from 'node:fs';
import {signalEnvelope} from '../src/inspection/signalEnvelope.ts';
const checks=[];function check(name,pass){checks.push({name,pass});if(!pass)throw Error(name);}
const ref=Float64Array.from({length:201},(_,i)=>i<40||i>160?0:Math.sin(2*Math.PI*(i-40)/20));
const data=signalEnvelope(ref,ref,.001,10000);
check('Sound matches reference envelope',data.actual.every((v,i)=>v===data.reference[i]));
check('Sound peak ratio is one',data.peakRatio===1);
check('Sound energy ratio is one',data.energyRatio===1);
const half=signalEnvelope(ref.map(v=>v*.5),ref,.001,10000);
check('Half amplitude remains half, not self-normalised',Math.abs(half.peakRatio-.5)<1e-12);
check('Half amplitude has quarter energy proxy',Math.abs(half.energyRatio-.25)<1e-12);
const twice=signalEnvelope(ref.map(v=>v*2),ref,.001,10000);
check('Interference above sound scale is retained',twice.peakRatio===2&&twice.energyRatio===4);
check('Envelope non-negative and finite',data.actual.every(v=>v>=0&&Number.isFinite(v)));
check('Arrival is raw threshold sample, not RMS pre-echo',Math.abs(data.arrivalSeconds-41*.001/200)<1e-12);
const zero=signalEnvelope(new Float64Array(201),ref,.001,10000);
check('No received signal: no arrival and zero proxies',zero.arrivalSeconds===null&&zero.peakRatio===0&&zero.energyRatio===0&&zero.peaks.length===0);
const noRef=signalEnvelope(ref,new Float64Array(201),.001,10000);
check('Missing reference is unavailable, not valid percentage',noRef.peakRatio===null&&noRef.energyRatio===null&&!noRef.hasReference);
const pair=Float64Array.from({length:201},(_,i)=>Math.exp(-(((i-50)/8)**2))+.7*Math.exp(-(((i-145)/8)**2))),peaks=signalEnvelope(pair,pair,.001,20000).peaks;
check('Two separated envelope peaks found',peaks.length===2&&Math.abs(peaks[0]-50)<=1&&Math.abs(peaks[1]-145)<=1);
for(const [name,args] of [['length',[[1],[1],1,1]],['mismatch',[[1,2],[1],1,1]],['duration',[[1,2],[1,2],0,1]],['frequency',[[1,2],[1,2],1,0]],['nonfinite',[[1,NaN],[1,2],1,1]]]){let threw=false;try{signalEnvelope(...args);}catch{threw=true;}check(`Reject invalid ${name}`,threw);}
writeFileSync('verification/results/p24.json',JSON.stringify({checks,scope:'Display-only RMS envelope and signal statistics, not UB1000 calibration.'},null,2));console.log(`P24: ${checks.length} signal display checks passed.`);
