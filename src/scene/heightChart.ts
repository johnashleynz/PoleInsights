import type {ProfileMetric,ProfileRow} from '../analysis/heightProfile.ts';
import {utilisationColour,stressColour} from './materials.ts';
export const chartLeft=(width:number)=>width-145;
export function profileLabel(rows:ProfileRow[],metric:ProfileMetric,z:number){const row=rows.reduce<ProfileRow|null>((best,r)=>!best||Math.abs(r.z-z)<Math.abs(best.z-z)?r:best,null);if(!row)return 'Updating…';const value=row[metric];return value===null?'No bending limit':metric.startsWith('capacity')?`${value.toFixed(2)} kN`:metric.startsWith('stress')?`${value.toFixed(2)} MPa`:`${Math.round(value*100)}%`;}
/** Capacity is a plain timber-limit line; stress/utilisation retain their colour fill. */
export function paintHeightChart(canvas:HTMLCanvasElement,w:number,h:number,project:(z:number)=>number,rows:ProfileRow[],metric:ProfileMetric,section:number,embedment:number,tip:number,sharedScale?:number,load=0,utilisationMax=1.5){
 const dpr=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const c=canvas.getContext('2d')!;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const x=chartLeft(w),width=94,capacity=metric.startsWith('capacity'),stress=metric.startsWith('stress'),values=rows.map(r=>r[metric]).filter((v):v is number=>v!==null&&Number.isFinite(v)),finite=values.filter(v=>v<1e6).sort((a,b)=>a-b),scale=sharedScale??(capacity?Math.max(1,Math.min(100,finite[Math.floor(finite.length*.8)]??10)):Math.max(1,...values)),top=project(tip),bottom=project(-embedment);
 if(Math.abs(top-bottom)<40)return;
 const zero=capacity?x:x+width,atValue=(v:number)=>zero+(capacity?1:-1)*width*Math.min(1,Math.max(0,v/scale));
 c.save();c.beginPath();c.rect(x,48,width,h-78);c.clip();
 if(!capacity){
 const gradient=c.createLinearGradient(zero,0,x,0);
 for(let i=0;i<=120;i++){const v=scale*i/120;gradient.addColorStop(i/120,`rgb(${(stress?stressColour(v*1e6):utilisationColour(Math.max(1e-8,v),utilisationMax)).join(',')})`);}
 // One horizontal colour field clipped to the area under the curve, independent of height.
 c.fillStyle=gradient;c.beginPath();let drawing=false,lastY=0;
 for(const row of rows){const v=row[metric];if(v===null){if(drawing){c.lineTo(zero,lastY);c.closePath();drawing=false;}continue;}const y=project(row.z);if(!drawing){c.moveTo(zero,y);drawing=true;}c.lineTo(atValue(v),y);lastY=y;}
 if(drawing){c.lineTo(zero,lastY);c.closePath();}c.fill();
 }
 if(!capacity&&!stress){c.setLineDash([3,3]);c.strokeStyle='#b46462';c.beginPath();c.moveTo(atValue(1),48);c.lineTo(atValue(1),h-30);c.stroke();c.setLineDash([]);}
 c.beginPath();let started=false;for(const row of rows){const v=row[metric];if(v===null){started=false;continue;}const xx=atValue(v),y=project(row.z);if(started)c.lineTo(xx,y);else{c.moveTo(xx,y);started=true;}}c.lineWidth=capacity?3:1;c.lineJoin='round';c.lineCap='round';c.strokeStyle=capacity?'#245c83':'#597c92';c.stroke();c.restore();
 const ends=[{z:tip,y:top},{z:-embedment,y:bottom}].filter(end=>end.y>=14&&end.y<=h-34);
 canvas.setAttribute('aria-label',`Height profile with one metre increments; pole tip ${Number(tip.toFixed(3))} m; pole butt ${Number((-embedment).toFixed(3))} m relative to groundline`);
 c.font='10px system-ui';c.strokeStyle='#a4b3bd';c.lineWidth=1;c.beginPath();c.moveTo(zero,Math.max(14,Math.min(top,bottom)));c.lineTo(zero,Math.min(h-30,Math.max(top,bottom)));c.stroke();
 for(let z=Math.ceil(-embedment);z<=tip;z++){const y=project(z);if(y<48||y>h-25||ends.some(end=>Math.abs(y-end.y)<13))continue;c.strokeStyle=z===0?'#506f60':'#c8d1d788';c.beginPath();c.moveTo(x,y);c.lineTo(x+width+4,y);c.stroke();c.fillStyle=z===0?'#334c40':'#627581';c.textAlign='left';c.fillText(z+' m',x+width+8,y+3);}
 for(const end of ends){c.strokeStyle='#617c8d';c.beginPath();c.moveTo(x,end.y);c.lineTo(x+width+4,end.y);c.stroke();c.fillStyle='#36566c';c.textAlign='left';c.font='10px system-ui';c.fillText(Number(end.z.toFixed(3))+' m',x+width+8,end.y+3,w-(x+width+8)-3);}
 const y=project(section);if(y>=48&&y<h-30){c.strokeStyle='#2c6d9c';c.beginPath();c.moveTo(x,y);c.lineTo(x+width,y);c.stroke();}
 c.textAlign='left';c.fillStyle='#496174';c.fillText(capacity?'0':stress?scale.toFixed(1)+' MPa':Math.round(scale*100)+'%',x,h-13);c.textAlign='right';c.fillText(capacity?scale.toFixed(1)+' kN':stress?'0':'0%',x+width,h-13);
 return {x,scale};
}
