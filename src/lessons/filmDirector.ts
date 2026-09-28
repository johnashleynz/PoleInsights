export type FilmMotion='reveal'|'orbit'|'push'|'sweep'|'orbitDetail'|'topDetail';
export type Shot={id:string;framing:string;start:number;arrive:number;cueTime:number;cueWord:string;moveDuration:number;easing:string};
export const ease=(t:number)=>{t=Math.max(0,Math.min(1,t));return 1-(1-t)**3;};
export function easing(t:number,kind:string){t=Math.max(0,Math.min(1,t));return kind==='easeInOutQuad'?(t<.5?2*t*t:1-(-2*t+2)**2/2):ease(t);}
export function framingPose(name:string,z:number,centre:[number,number]=[0,0]){
 let angle=-.4,distance=22,height=3.7,elevation=1.2,x=0,y=0;
 if(name==='detail'||name==='section'){distance=5.3;height=z+.15;elevation=1;angle=-.45;x=centre[0];y=centre[1];}
 if(name==='tip'||name==='tipnorth'){distance=4.8;height=9.15;elevation=.65;x=.65;angle=-.45;}
 if(name==='tipnorth'){angle=-1.15;x=.1;y=-.3;}
 return {position:[x+Math.sin(angle)*distance,height+elevation,y+Math.cos(angle)*distance],target:[x,height,y],source:'director'};
}
/** Word-cued moves finish before speech; all intervening frames have a constant pose. */
export function directedPose(shots:Shot[]|undefined,t:number,z:number,centre:[number,number]=[0,0]){
 if(!shots?.length)return framingPose('whole',z,centre);
 let pose=framingPose(shots[0].framing,z,centre);
 for(const s of shots.slice(1)){
  if(t<s.start)break;const next=framingPose(s.framing,z,centre);
  if(t<s.arrive&&s.moveDuration){const q=easing((t-s.start)/(s.arrive-s.start),s.easing);return {position:pose.position.map((v,i)=>v+(next.position[i]-v)*q),target:pose.target.map((v,i)=>v+(next.target[i]-v)*q),source:'director'};}
  pose=next;
 }
 return pose;
}
export function filmPose(motion:FilmMotion,_t:number,z:number,centre:[number,number]=[0,0]){return framingPose(['push','orbitDetail','topDetail'].includes(motion)?'detail':'whole',z,centre);}
