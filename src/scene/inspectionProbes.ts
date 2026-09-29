import * as T from 'three';
import {PROBE_DIAMETER,PROBE_LENGTH,PROBE_OUTER_REACH,WAVE_GUIDE_EXPOSED,WAVE_GUIDE_LENGTH} from '../inspection/placeholder.ts';
/** Dimensioned UB1000 assembly. Distances are measured outward from the pole surface. */
export function makeProbePair(){
 const pair=new T.Group();pair.name='inspection-pair';
 for(let i=0;i<2;i++){
  const probe=new T.Group();
  const orange=new T.MeshStandardMaterial({color:'#ff6b0b',roughness:.28,metalness:.12}),rubber=new T.MeshStandardMaterial({color:'#282e32',roughness:.78}),steel=new T.MeshStandardMaterial({color:'#c8ced3',roughness:.24,metalness:.85}),plastic=new T.MeshStandardMaterial({color:'#535d64',roughness:.64});
  const cylinder=(r:number,start:number,end:number,mat:T.Material,segments=48,endRadius=r)=>{const mesh=new T.Mesh(new T.CylinderGeometry(endRadius,r,end-start,segments),mat);mesh.rotation.z=-Math.PI/2;mesh.position.x=(start+end)/2;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.drag='section';probe.add(mesh);};
  const guideStart=WAVE_GUIDE_EXPOSED-WAVE_GUIDE_LENGTH,tipStart=WAVE_GUIDE_EXPOSED,bodyStart=tipStart+.020,taperEnd=bodyStart+.005,capEnd=taperEnd+.010,orangeEnd=capEnd+.110;
  cylinder(.004,guideStart,WAVE_GUIDE_EXPOSED,steel,24);
  cylinder(.014,tipStart-.003,tipStart+.007,plastic,6);
  cylinder(.006,tipStart,bodyStart,steel,24);
  cylinder(.010,bodyStart,taperEnd,orange,48,PROBE_DIAMETER/2);
  cylinder(PROBE_DIAMETER/2,taperEnd,capEnd,orange);
  cylinder(PROBE_DIAMETER/2,capEnd,orangeEnd,orange);
  cylinder(PROBE_DIAMETER/2,orangeEnd,PROBE_OUTER_REACH,rubber);
  cylinder(PROBE_DIAMETER/2+.0003,orangeEnd-.001,orangeEnd+.002,steel);
  for(let k=0;k<8;k++)cylinder(PROBE_DIAMETER/2+.0005,orangeEnd+.006+k*.005,orangeEnd+.007+k*.005,rubber);
  const label=document.createElement('canvas');label.width=256;label.height=64;const c=label.getContext('2d')!;c.fillStyle='#ff6b0b';c.fillRect(0,0,256,64);c.fillStyle='#252a2b';c.font='600 31px sans-serif';c.textAlign='center';c.fillText('UB1000',128,42);const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  const badge=new T.Mesh(new T.PlaneGeometry(.072,.014),new T.MeshStandardMaterial({map,roughness:.4}));badge.position.set((capEnd+orangeEnd)/2,PROBE_DIAMETER/2+.0002,0);badge.rotation.x=-Math.PI/2;probe.add(badge);
  const pick=new T.Mesh(new T.CylinderGeometry(.0375,.0375,PROBE_OUTER_REACH-guideStart,16),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));pick.rotation.z=-Math.PI/2;pick.position.x=(PROBE_OUTER_REACH+guideStart)/2;pick.userData.drag='section';probe.add(pick);pair.add(probe);
 }
 return pair;
}
export function placeProbePair(pair:T.Object3D,radius:number,z:number,bearing:number,x=0,y=0){
 pair.position.set(x,z,-y);
 pair.children.forEach((probe,i)=>{const a=(bearing+i*180)*Math.PI/180;probe.position.set(radius*Math.sin(a),0,-radius*Math.cos(a));probe.rotation.y=Math.PI/2-a;});
}
/** Same physical dimensions in the end-on section, with a lit cylindrical finish. */
export function paintProbePair(c:CanvasRenderingContext2D,radius:number,scale:number,bearing:number){
 const centre=c.canvas.width/2;c.save();c.translate(centre,centre);c.rotate((bearing-90)*Math.PI/180);
 c.strokeStyle='#ee812f80';c.setLineDash([4,6]);c.lineWidth=1.5;c.beginPath();c.moveTo(-radius*scale,0);c.lineTo(radius*scale,0);c.stroke();c.setLineDash([]);
 for(let i=0;i<2;i++){c.save();if(i)c.rotate(Math.PI);c.translate(radius*scale,0);c.scale(scale,scale);
  c.shadowColor='#00000055';c.shadowBlur=6;c.shadowOffsetY=3;
  c.fillStyle='#b5bfc6';c.fillRect(-.020,-.004,.050,.008);c.fillStyle='#555e66';c.fillRect(.027,-.014,.010,.028);c.fillStyle='#c6cbd0';c.fillRect(.030,-.006,.020,.012);
  const paint=c.createLinearGradient(0,-.025,0,.025);paint.addColorStop(0,'#a63803');paint.addColorStop(.20,'#ff9a51');paint.addColorStop(.35,'#ffd4ad');paint.addColorStop(.52,'#ff7117');paint.addColorStop(1,'#b53d04');c.fillStyle=paint;c.beginPath();c.moveTo(.050,-.010);c.quadraticCurveTo(.052,-.022,.055,-.025);c.lineTo(.175,-.025);c.lineTo(.175,.025);c.lineTo(.055,.025);c.quadraticCurveTo(.052,.022,.050,.010);c.closePath();c.fill();
  const cap=c.createLinearGradient(0,-.025,0,.025);cap.addColorStop(0,'#20282f');cap.addColorStop(.30,'#626e76');cap.addColorStop(1,'#1d252a');c.fillStyle=cap;c.beginPath();c.roundRect(.175,-.025,.055,.050,.003);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.fillStyle='#c6cbd0';c.fillRect(.174,-.0248,.002,.0496);c.strokeStyle='#20262d';c.lineWidth=.0007;for(let j=0;j<8;j++){const x=.181+j*.005;c.beginPath();c.moveTo(x,-.023);c.lineTo(x,.023);c.stroke();}
  c.fillStyle='#3b271f';c.font='.009px sans-serif';c.textAlign='center';c.fillText('UB1000',.120,.003);c.restore();
 }
 c.restore();
}
