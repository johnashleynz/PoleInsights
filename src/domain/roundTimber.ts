/** Owner-supplied NZS AS 1720.1:2022 (includes AS 1720.1:2010).
 * These are modified characteristic material references, not factored design
 * capacities or predicted mean breaking strengths. See docs/P22-REVIEW.md. */
export interface RoundOptions {density:'normal'|'high';preparation:'natural'|'peeled'|'shaved';steamed:boolean;midDiameterMM:number}
export interface RoundDefinition {country:'NZ'|'AU';group?:string;softwood?:boolean;groupSource?:string}
export const roundDefaults=(d:RoundDefinition):RoundOptions=>({density:'normal',preparation:d.country==='NZ'?'peeled':'natural',steamed:d.country==='NZ',midDiameterMM:250});
const grades:Record<string,{grade:string;E:number;fb:number}>={
 S1:{grade:'F34',E:21.5,fb:84},S2:{grade:'F27',E:18.5,fb:67},S3:{grade:'F22',E:16,fb:55},S4:{grade:'F17',E:14,fb:42},S5:{grade:'F14',E:12,fb:36},S6:{grade:'F11',E:10.5,fb:31},S7:{grade:'F8',E:9.1,fb:22}
};
export function roundValues(d:RoundDefinition,input?:RoundOptions){
 const o=input??roundDefaults(d);
 if(!['normal','high'].includes(o.density)||!['natural','peeled','shaved'].includes(o.preparation)||typeof o.steamed!=='boolean'||!Number.isFinite(o.midDiameterMM)||o.midDiameterMM<75||o.midDiameterMM>1200)return null;
 if(d.country==='NZ'){
  const base=o.density==='high'?{E:12.1,fb:52}:{E:8.7,fb:38};
  const k21=o.preparation==='shaved'?.8:o.preparation==='peeled'?.9:1;
  return {E:base.E*1e9*(o.preparation==='shaved'?.95:1)*(o.steamed?.95:1),bending:base.fb*1e6*k21*(o.steamed?.85:1),options:{...o},grade:o.density==='high'?'High density ≥450 kg/m³':'Normal density ≥350 kg/m³',factors:{preparation:k21,steaming:o.steamed?.85:1,immaturity:1},citation:'NZS AS 1720.1:2022 · ZZ6.2, Tables ZZ6.1–ZZ6.3',scope:'Unseasoned naturally round softwood, conditional on NZS 3605 pole quality and the selected outer-zone density. High density requires supplier evidence or the specified proof testing. Species within the same category share these values. Ground-contact timber is unseasoned at groundline. H4/H5/H6 treatment assumes steaming unless supplier data establish otherwise.'};
 }
 const base=grades[d.group??''];if(!base)return null;
 // Conservatively use the lower tabulated diameter band; no unsupported
 // interpolation rule is assumed between Table 6.2 diameter entries.
 const ds=[75,100,125,150,175,200,225,250],ks=d.softwood?[.70,.75,.80,.85,.90,.95,1,1]:[.80,.90,1,1,1,1,1,1];
 const index=Math.max(0,ds.reduce((best,v,i)=>o.midDiameterMM>=v?i:best,0)),k20=ks[index],k21=o.preparation==='shaved'?(d.softwood?.75:.85):1;
 return {E:base.E*1e9*k20*(o.preparation==='shaved'?.95:1),bending:base.fb*1e6*k20*k21*(o.steamed?.85:1),options:{...o},grade:d.group+' → '+base.grade,factors:{preparation:k21,steaming:o.steamed?.85:1,immaturity:k20},citation:'AS 1720.1:2010 · 6.2–6.4, Tables 6.1–6.3 and H2.1',scope:'Unseasoned round poles, conditional on AS 3818.11 grading and the stated species group. Diameter-dependent immaturity uses the lower tabulated band at actual pole mid-length. Adequate preservation is assumed for the full section. '+(d.groupSource??'Species group: Table H2.3 / H2.4.')};
}
