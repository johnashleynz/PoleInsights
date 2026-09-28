/** Display-only processing of the simulated receiver displacement. No device calibration. */
export function signalEnvelope(trace:ArrayLike<number>,reference:ArrayLike<number>,duration:number,frequency:number){
 const n=trace.length;
 if(n<2||reference.length!==n||!Number.isFinite(duration)||duration<=0||!Number.isFinite(frequency)||frequency<=0)throw Error('Invalid signal dimensions or timing');
 const dt=duration/(n-1),half=Math.max(1,Math.min(n-1,Math.round(1/frequency/dt/2)));
 function rms(values:ArrayLike<number>){const result=new Float64Array(n);for(let i=0;i<n;i++){let sum=0,count=0;for(let j=Math.max(0,i-half);j<=Math.min(n-1,i+half);j++){if(!Number.isFinite(values[j]))throw Error('Non-finite signal');sum+=values[j]**2;count++;}result[i]=Math.sqrt(sum/count);}return result;}
 const actual=rms(trace),sound=rms(reference),scale=Math.max(...sound);
 const normalised=Float64Array.from(actual,v=>scale>0?v/scale:0),soundNormalised=Float64Array.from(sound,v=>scale>0?v/scale:0);
 const integral=(a:ArrayLike<number>)=>{let sum=0;for(let i=1;i<n;i++)sum+=(a[i-1]**2+a[i]**2)*dt/2;return sum;};
 const refIntegral=integral(reference),candidates=Array.from({length:n-2},(_,k)=>k+1).filter(i=>actual[i]>actual[i-1]&&actual[i]>=actual[i+1]).sort((a,b)=>actual[b]-actual[a]),peaks:number[]=[];
 for(const i of candidates){if(actual[i]>0&&peaks.every(j=>Math.abs(i-j)>2*half))peaks.push(i);if(peaks.length===2)break;}
 // Arrival uses the unsmoothed signal: centred RMS windows would introduce a pre-echo.
 const rawReferencePeak=Math.max(...Array.from(reference,Math.abs)),arrival=rawReferencePeak>0?Array.from(trace).findIndex(v=>Math.abs(v)>=.05*rawReferencePeak):-1;
 return {actual:normalised,reference:soundNormalised,peaks:peaks.sort((a,b)=>a-b),peakRatio:scale>0?Math.max(...actual)/scale:null,energyRatio:refIntegral>0?integral(trace)/refIntegral:null,arrivalSeconds:arrival>=0?arrival*dt:null,windowSeconds:(2*half+1)*dt,hasReference:scale>0};
}
