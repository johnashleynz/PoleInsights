import * as T from 'three';
import {imageTexture,soilTexture,random} from './materials.ts';

/** Display-only groundline patch: nominal 1 m diameter, 300 mm deep fade. */
export function groundPatch(poleRadius:number,render:()=>void){
  const group=new T.Group(),radius=Math.max(.5,poleRadius+.04);
  // Crop inside the photographed patch: its original outer pixels contain a fade.
  const grassMap=imageTexture('textures/grass-p03.png',render);grassMap.repeat.set(.48,.48);grassMap.offset.set(.26,.26);
  const grass=new T.MeshStandardMaterial({map:grassMap,color:'#ffffff',roughness:1,side:T.DoubleSide,depthWrite:true});
  const surface=new T.Mesh(new T.RingGeometry(Math.max(0,poleRadius-.012),radius,128,16),grass);surface.rotation.x=-Math.PI/2;surface.position.y=.004;group.add(surface);
  // Soft volume bounded by a shallow spherical cap (1 m diameter, 300 mm deep).
  // Thin horizontal samples fill the interior without a cylindrical side or hard rim.
  const depth=.3,sphereRadius=(radius*radius+depth*depth)/(2*depth),centre=sphereRadius-depth;
  const dirt=new T.MeshBasicMaterial({map:soilTexture(),color:'#c5a286',toneMapped:false,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide,forceSinglePass:true});
  dirt.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vSoil;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoil=position;');
    shader.fragmentShader='varying vec3 vSoil;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat outer=sqrt(max(0.00001,${(sphereRadius*sphereRadius).toFixed(7)}-pow(vSoil.y-${centre.toFixed(7)},2.0))); diffuseColor.a *= smoothstep(-0.30,-0.08,vSoil.y)*(1.0-smoothstep(0.6,0.98,length(vSoil.xz)/outer));`);
  };
  dirt.customProgramCacheKey=()=>`soil-volume-${radius}`;
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[],cols=96,rows=10;
  for(let layer=0;layer<32;layer++){
    const y=-depth+(layer+.5)*depth/32,outer=Math.sqrt(sphereRadius*sphereRadius-(y-centre)*(y-centre)),inner=poleRadius+.003;
    if(outer<=inner)continue;const base=vertices.length/3;
    for(let j=0;j<=rows;j++){const r=inner+(outer-inner)*j/rows;for(let k=0;k<=cols;k++){const a=2*Math.PI*k/cols,x=r*Math.cos(a),z=r*Math.sin(a);vertices.push(x,y,z);uvs.push(x/radius,z/radius);if(j<rows&&k<cols){const i=base+j*(cols+1)+k;indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);}}}
  }
  const volume=new T.BufferGeometry();volume.setAttribute('position',new T.Float32BufferAttribute(vertices,3));volume.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));volume.setIndex(indices);group.add(new T.Mesh(volume,dirt));
  const rnd=random(827),pos:number[]=[],col:number[]=[];
  for(let i=0;i<1800;i++){
    const r=(radius-.01)*Math.sqrt(rnd());if(r<Math.max(0,poleRadius-.008))continue;const a=rnd()*Math.PI*2,x=r*Math.cos(a),z=r*Math.sin(a),height=.012+rnd()*.025,w=.001+rnd()*.002,angle=rnd()*Math.PI*2,dx=Math.cos(angle)*w,dz=Math.sin(angle)*w,colour=new T.Color().setRGB(.07+rnd()*.045,.14+rnd()*.11,.025+rnd()*.035);
    pos.push(x-dx,.005,z-dz,x+dx,.005,z+dz,x+dx*3,height,z+dz*3);
    for(let k=0;k<3;k++)col.push(colour.r,colour.g,colour.b,1);
  }
  const blades=new T.BufferGeometry();blades.setAttribute('position',new T.Float32BufferAttribute(pos,3));blades.setAttribute('color',new T.Float32BufferAttribute(col,4));blades.computeVertexNormals();
  group.add(new T.Mesh(blades,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide,transparent:true,depthWrite:false})));
  return group;
}
