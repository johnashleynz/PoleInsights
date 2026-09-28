// User-selected smooth illustrative envelope, presented as a single Signal curve.
// This is a synthetic progress animation, never a threshold or acquired signal.
export function referencePath(width=308,origin=24,baseline=77,scale=43){
 return Array.from({length:160},(_,i)=>{const t=i/159*1000,y=.85*Math.exp(-(((t-340)/105)**2))+.52*Math.exp(-(((t-585)/130)**2));return(i?'L':'M')+(origin+i/159*width).toFixed(1)+','+(baseline-y*scale).toFixed(1);}).join(' ');
}
export function scanAnimation(){
 return '<section class="acquisition-animation" aria-label="Acquisition animation"><div class="animation-title"><strong>Acquiring signal</strong><span>Demo animation</span></div><svg viewBox="0 0 354 160" role="img" aria-label="Animated signal"><path d="M24 20V126H332 M24 77H332 M101 20V126 M178 20V126 M255 20V126" class="animation-grid"/><path id="live-wave" d="M24 77H332" fill="none" stroke="#e3d748" stroke-width="1.8"/><path id="live-sweep" d="M24 20V126" stroke="#ffffff50" stroke-width="1"/><text x="24" y="146">0</text><text x="290" y="146">1000 μs</text></svg><div class="animation-legend single-signal"><span>Signal</span></div><div class="scan-progress"><span id="scan-progress-fill"></span></div></section>';
}
export function animateScan(elapsed,total){
 const svg=document.querySelector('.acquisition-animation svg');if(!svg)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,phase=reduced?1:(elapsed%3000)/3000;
 const points=Array.from({length:220},(_,i)=>{const x=i/219,t=x*1000,envelope=.9*Math.exp(-(((t-340)/95)**2))+.52*Math.exp(-(((t-585)/135)**2));const amp=envelope*43;return(i?'L':'M')+(24+x*308).toFixed(1)+','+(77-(x<=phase?amp:0)).toFixed(1);}).join(' ');
 svg.querySelector('#live-wave').setAttribute('d',points);const x=24+phase*308;svg.querySelector('#live-sweep').setAttribute('d','M'+x+' 20V126');
 document.querySelector('#scan-progress-fill').style.width=Math.min(100,elapsed/total*100)+'%';
}
