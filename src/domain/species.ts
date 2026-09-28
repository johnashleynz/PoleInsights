import {roundDefaults,roundValues,type RoundDefinition,type RoundOptions} from './roundTimber.ts';
/** Pole data are versioned references, not species-wide breaking strengths.
 * Fb is a bending criterion, never an invented direct tension/compression value. */
export type PoleMaterial = {E:number;source?:string} & (
  {basis:'illustrative';tension:number;compression:number;bending?:never} |
  {basis:'pole-reference'|'user-bending';bending:number;referenceId?:string;round?:RoundOptions;tension?:never;compression?:never}
);
export interface PoleSpecies {id:string;name:string;regions:string;botanical:string;group?:string;round?:RoundDefinition;reference?:{id:string;E:number;bending:number;title:string;url:string;scope:string}}
const ansi='https://woodpoles.org/wp-content/uploads/TB_Pole_MOE.pdf';
const us=(id:string,name:string,botanical:string,E:number,bending:number,scope='') : PoleSpecies=>({id,name,botanical,regions:'US',reference:{id:'ansi-o5.1-2022-'+id,E:E*1e9,bending:bending*1e6,title:'ANSI O5.1-2022 · Table 1, p.13',url:ansi,scope:'Mean groundline pole bending fibre strength (COV 0.20) and mean MOE; Table 1 verified against the supplied ANSI standard. Conditioning, pole class, dimensions and standard adjustments must match the pole. No design factors or height adjustments applied. '+scope}});
const au=(id:string,name:string,botanical:string,group?:string):PoleSpecies=>({id,name,botanical,regions:'Australia',group});
export const SPECIES_REGIONS=['New Zealand','Australia','UK','US'];
export function speciesForRegion(region:string){return SPECIES.filter(s=>s.regions===region);}
export const SPECIES:PoleSpecies[]=[
 {id:'radiata-pine',name:'Radiata pine',botanical:'Pinus radiata',regions:'New Zealand'},
 {id:'douglas-fir-nz',name:'Douglas fir · NZ grown',botanical:'Pseudotsuga menziesii',regions:'New Zealand'},
 {id:'european-larch-nz',name:'European larch · NZ grown',botanical:'Larix decidua',regions:'New Zealand'},
 au('southern-pine-australia','Southern plantation pines','Pinus elliottii / caribaea hybrids'),
 au('hoop-pine','Hoop pine','Araucaria cunninghamii','S6'),
 au('radiata-pine-australia','Radiata pine · Australian grown','Pinus radiata','S6'),
 au('slash-pine-australia','Slash pine','Pinus elliottii','S5'),
 au('coast-grey-box','Coast grey box','Eucalyptus moluccana','S1'),
 au('maritime-pine','Maritime pine','Pinus pinaster'),
 au('grey-ironbark','Grey ironbark','Eucalyptus paniculata / drepanophylla','S1'),
 au('grey-gum','Grey gum','Eucalyptus punctata / propinqua','S1'),
 au('spotted-gum','Spotted gum','Corymbia maculata / citriodora','S2'),
 au('blackbutt','Blackbutt','Eucalyptus pilularis','S2'),
 au('tallowwood','Tallowwood','Eucalyptus microcorys','S2'),
 au('gympie-messmate','Gympie messmate','Eucalyptus cloeziana','S2'),
 au('grey-box','Grey box','Eucalyptus moluccana / woollsiana','S2'),
 au('red-ironbark','Red ironbark','Eucalyptus sideroxylon','S2'),
 au('narrow-leaved-red-ironbark','Narrow-leaved red ironbark','Eucalyptus crebra','S2'),
 au('forest-red-gum','Forest red gum','Eucalyptus tereticornis','S3'),
 au('jarrah','Jarrah','Eucalyptus marginata','S4'),
 {id:'scots-pine',name:'Scots pine',botanical:'Pinus sylvestris',regions:'UK',reference:{id:'scanpole-spas3-2022',E:9.433e9,bending:37.1e6,title:'Scanpole SPAS3 · BS EN 14229:2010 declaration',url:'https://www.scanpole.com/files/sites/3/2025/01/spas_ilseng_declaration-of-performance_2023.pdf',scope:'Declared MOR and MOE for untreated Northern / North-Eastern European Scots pine, Ilseng production. Supplier-specific reference, not a universal UK grade. Match treatment and the supplied declaration before using it.'}},
 {id:'douglas-fir-europe',name:'Douglas fir · European',botanical:'Pseudotsuga menziesii',regions:'UK',reference:{id:'scanpole-spbbh4-2022',E:10.795e9,bending:34.1e6,title:'Scanpole SPBBH4 · BS EN 14229:2010 declaration',url:'https://www.scanpole.com/files/sites/6/2025/01/bbhltd_declaration-of-performance_2023.pdf',scope:'Declared mean MOR and MOE for creosote-treated coastal Douglas fir grown in Germany. Supplier-specific reference, not a characteristic value or universal UK grade.'}},
 us('douglas-fir-coastal','Douglas fir · coastal','Pseudotsuga menziesii',16.40,55.2,'Through-bored poles need a 5% Fb reduction; select the separate through-bored reference below.'),
 us('western-larch','Western larch','Larix occidentalis',18.27,57.9),
 us('southern-pine','Southern pine group','Pinus spp.',14.68,55.2),
 us('western-red-cedar','Western red cedar','Thuja plicata',9.86,41.4),
 us('lodgepole-pine','Lodgepole pine','Pinus contorta',11.44,45.5),
 us('red-pine','Red / Norway pine','Pinus resinosa',10.13,45.5),
];
// NZ softwood categories are conditional on pole grade/density, not species averages.
for(const s of SPECIES){
 if(s.regions==='New Zealand')s.round={country:'NZ',softwood:true};
 if(s.regions==='Australia'&&s.group&&s.id!=='grey-box')s.round={country:'AU',group:s.group,softwood:['radiata-pine-australia','hoop-pine','slash-pine-australia'].includes(s.id),groupSource:['grey-gum','gympie-messmate','red-ironbark','forest-red-gum'].includes(s.id)?'Species group from DTM Timber pole supply table; numeric grade mapping and properties from the supplied standard.':'Species group: AS 1720.1 Table H2.3 / H2.4.'};
 if(s.round){const v=roundValues(s.round)!;s.reference={id:'round-1720-v1-'+s.id,E:v.E,bending:v.bending,title:v.citation,url:s.round.country==='NZ'?'https://natlib.govt.nz/records/52113199':'https://store.standards.org.au/product/as-1720-1-2010',scope:v.scope};}
}
export function speciesById(id:string){return SPECIES.find(s=>s.id===id);}
export function referenceMaterial(s:PoleSpecies,throughBored=false,options?:RoundOptions):PoleMaterial|null {
 const r=s.reference;if(!r)return null;
 if(s.round){const v=roundValues(s.round,options);if(!v)return null;return {basis:'pole-reference',E:v.E,bending:v.bending,referenceId:r.id+':'+JSON.stringify(v.options),round:v.options,source:v.citation+' · '+v.grade+' · '+v.options.preparation+' · '+(v.options.steamed?'steamed':'unsteamed')+' · modified characteristic bending reference'};}
 const bored=throughBored&&s.id==='douglas-fir-coastal';return {basis:'pole-reference',E:r.E,bending:bored?52.44e6:r.bending,referenceId:r.id+(bored?'-through-bored':''),source:r.title+(bored?' · through-bored, 5% reduction':'')};
}
export {roundDefaults,roundValues,type RoundOptions};
/** Signed longitudinal beam bending check. Defect factors remain illustrative. */
export function bendingResistance(m:PoleMaterial,stress:number,c:{tension:number;compression:number}) {const factor=stress>=0?c.tension:c.compression;return (m.basis==='illustrative'?(stress>=0?m.tension:m.compression):m.bending)*factor;}
export function soundStrength(m:PoleMaterial){return m.basis==='illustrative'?m.tension:m.bending;}
export function materialDescription(m:PoleMaterial){return m.basis==='illustrative'?`Teaching values · E ${(m.E/1e9).toFixed(2)} GPa · tension ${(m.tension/1e6).toFixed(1)} / compression ${(m.compression/1e6).toFixed(1)} MPa`:`${m.basis==='user-bending'?'User-entered':'Published reference'} · E ${(m.E/1e9).toFixed(3)} GPa · bending ${(m.bending/1e6).toFixed(2)} MPa`;}
export function materialErrors(species:string,m:PoleMaterial):string[]{
 if(!speciesById(species))return ['Select a supported pole species.'];
 if(!m||!Number.isFinite(m.E)||m.E<=0)return ['Enter a positive stiffness.'];
 if(m.basis==='illustrative')return species==='radiata-pine'&&[m.tension,m.compression].every(v=>Number.isFinite(v)&&v>0)?[]:['The legacy teaching material belongs to radiata pine.'];
 if(m.E>100e9)return ['Enter a stiffness up to 100 GPa.'];
 if(!['pole-reference','user-bending'].includes(m.basis)||!Number.isFinite(m.bending)||m.bending<=0||m.bending>300e6)return ['Enter a bending reference between 0 and 300 MPa.'];
 if(typeof m.source!=='string'||!m.source.trim()||m.source.length>500)return ['Record the source and basis of the material values.'];
 if(m.basis==='user-bending'&&m.round)return ['Custom values cannot retain a standard-derived property configuration.'];
 if(m.basis==='pole-reference'){const s=speciesById(species)!;if(!!s.round!==!!m.round)return ['Standard pole properties require their matching preparation and density settings.'];const matches=[referenceMaterial(s,false,m.round),referenceMaterial(s,true,m.round)].some(r=>r&&r.basis!=='illustrative'&&r.referenceId===m.referenceId&&r.E===m.E&&r.bending===m.bending);if(!matches)return ['Published properties do not match their reference. Save edited values as user-entered data.'];}
 return [];
}
