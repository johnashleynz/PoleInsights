/** Bounded exact-height cache. Never substitutes a nearby section or old case. */
export class SectionCache<T>{
 private frames=new Map<string,{value:T;bytes:number}>();bytes=0;
 readonly budget:number;
 constructor(budget=32*1024*1024){this.budget=budget;}
 key(z:number,size:number){return z.toFixed(6)+':'+size;}
 get(z:number,size:number){const k=this.key(z,size),hit=this.frames.get(k);if(!hit)return undefined;this.frames.delete(k);this.frames.set(k,hit);return hit.value;}
 has(z:number,size:number){return this.frames.has(this.key(z,size));}
 put(z:number,size:number,value:T){const k=this.key(z,size),old=this.frames.get(k);if(old)this.bytes-=old.bytes;this.frames.delete(k);const bytes=size*size*4;if(bytes>this.budget)return;this.frames.set(k,{value,bytes});this.bytes+=bytes;while(this.bytes>this.budget){const key=this.frames.keys().next().value!;this.bytes-=this.frames.get(key)!.bytes;this.frames.delete(key);}}
 clear(){this.frames.clear();this.bytes=0;}
 get count(){return this.frames.size;}
}
