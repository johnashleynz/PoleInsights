import * as T from 'three';
import {PROBE_LENGTH,PROBE_DIAMETER} from '../inspection/placeholder.ts';
/** Photo-referenced cylindrical placeholder. Total contact-to-cap length is 160 mm. */
export function makeProbePair(){
 const pair=new T.Group();pair.name='inspection-pair';
 for(let i=0;i<2;i++){
  const probe=new T.Group();
  const orange=new T.MeshStandardMaterial({color:'#ff6b0b',roughness:.28,metalness:.12}),rubber=new T.MeshStandardMaterial({color:'#282e32',roughness:.78}),steel=new T.MeshStandardMaterial({color:'#c8ced3',roughness:.24,metalness:.85});
  const cylinder=(r:number,start:number,end:number,mat:T.Material,segments=48)=>{const mesh=new T.Mesh(new T.CylinderGeometry(r,r,end-start,segments),mat);mesh.rotation.z=-Math.PI/2;mesh.position.x=(start+end)/2;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.drag='section';probe.add(mesh);};
  cylinder(.004,0,.020,steel);cylinder(.014,.020,.032,steel,6);cylinder(PROBE_DIAMETER/2,.032,.132,orange);cylinder(.0295,.132,PROBE_LENGTH,rubber);cylinder(.0298,.030,.033,steel);
  for(let k=0;k<6;k++)cylinder(.0301,.135+k*.003,.136+k*.003,rubber);
  const label=document.createElement('canvas');label.width=256;label.height=64;const c=label.getContext('2d')!;c.fillStyle='#ff6b0b';c.fillRect(0,0,256,64);c.fillStyle='#252a2b';c.font='600 31px sans-serif';c.textAlign='center';c.fillText('UB1000',128,42);const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  const badge=new T.Mesh(new T.PlaneGeometry(.063,.016),new T.MeshStandardMaterial({map,roughness:.4}));badge.position.set(.082,.0298,0);badge.rotation.x=-Math.PI/2;probe.add(badge);
  const pick=new T.Mesh(new T.CylinderGeometry(.045,.045,PROBE_LENGTH,16),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));pick.rotation.z=-Math.PI/2;pick.position.x=PROBE_LENGTH/2;pick.userData.drag='section';probe.add(pick);pair.add(probe);
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
  c.fillStyle='#b5bfc6';c.fillRect(0,-.004,.024,.008);c.fillStyle='#555e66';c.fillRect(.02,-.014,.014,.028);
  const paint=c.createLinearGradient(0,-.03,0,.03);paint.addColorStop(0,'#a63803');paint.addColorStop(.20,'#ff9a51');paint.addColorStop(.35,'#ffd4ad');paint.addColorStop(.52,'#ff7117');paint.addColorStop(1,'#b53d04');c.fillStyle=paint;c.beginPath();c.roundRect(.032,-.030,.10,.06,.004);c.fill();
  const cap=c.createLinearGradient(0,-.03,0,.03);cap.addColorStop(0,'#20282f');cap.addColorStop(.30,'#626e76');cap.addColorStop(1,'#1d252a');c.fillStyle=cap;c.beginPath();c.roundRect(.132,-.0295,.028,.059,.004);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.fillStyle='#c6cbd0';c.fillRect(.03,-.029,.003,.058);c.strokeStyle='#20262d';c.lineWidth=.0007;for(let j=0;j<6;j++){c.beginPath();c.moveTo(.136+j*.003,-.027);c.lineTo(.136+j*.003,.027);c.stroke();}
  c.fillStyle='#3b271f';c.font='.010px sans-serif';c.textAlign='center';c.fillText('UB1000',.082,.003);c.restore();
 }
 c.restore();
}
