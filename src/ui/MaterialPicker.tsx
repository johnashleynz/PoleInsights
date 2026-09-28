import {useEffect,useState} from 'react';
import type {PoleCase} from '../domain/model.ts';
import {MATERIAL} from '../domain/model.ts';
import {SPECIES_REGIONS,speciesForRegion,speciesById,referenceMaterial,materialErrors,roundDefaults,roundValues,type RoundOptions,type PoleMaterial} from '../domain/species.ts';
import './material.css';

export default function MaterialPicker({pole,onChange}:{pole:PoleCase;onChange:(value:Pick<PoleCase,'species'|'material'>)=>void}){
 const [id,setId]=useState(pole.species),[mode,setMode]=useState('custom'),[E,setE]=useState(''),[fb,setFb]=useState(''),[ft,setFt]=useState(''),[fc,setFc]=useState(''),[source,setSource]=useState(''),[bored,setBored]=useState(false),[open,setOpen]=useState(false),[round,setRound]=useState<RoundOptions|undefined>();
 function populate(speciesId:string,m:PoleMaterial){
  setRound(m.basis==='pole-reference'?m.round:undefined);setId(speciesId);setMode(m.basis==='illustrative'?'teaching':m.basis==='pole-reference'?'published':'custom');
  setE(String(m.E/1e9));setFb(m.basis==='illustrative'?'':String(m.bending/1e6));setFt(m.basis==='illustrative'?String(m.tension/1e6):'');setFc(m.basis==='illustrative'?String(m.compression/1e6):'');setSource(m.source??'');setBored(m.basis==='pole-reference'&&!!m.referenceId?.endsWith('-through-bored'));
 }
 useEffect(()=>populate(pole.species,pole.material),[pole.species,pole.material]);
 const species=speciesById(id)!,pending=id!==pole.species;
 const m:PoleMaterial|null=mode==='teaching'?{basis:'illustrative',E:Number(E)*1e9,tension:Number(ft)*1e6,compression:Number(fc)*1e6}:mode==='published'?referenceMaterial(species,bored,round):{basis:'user-bending',E:Number(E)*1e9,bending:Number(fb)*1e6,source};
 const errors=m?materialErrors(id,m):['Choose a property basis.'];
 function choose(next:string){
  if(next===pole.species&&pole.material.basis!=='illustrative'){populate(pole.species,pole.material);return;}
  const s=speciesById(next)!,preset=referenceMaterial(s)??(next==='radiata-pine'?{...MATERIAL}:null);
  if(preset){populate(next,preset);onChange({species:next,material:preset});}
  else {setId(next);setMode('custom');setE('');setFb('');setSource('');setBored(false);setOpen(true);}
 }
 function basis(next:string){
  setMode(next);if(next==='published'&&species.round)setRound(roundDefaults(species.round));
  if(next==='teaching')populate(id,{...MATERIAL});
  if(next==='custom'&&m){setE(String(m.E/1e9));setFb(m.basis==='illustrative'?'':String(m.bending/1e6));setSource(m.source??'');}
 }
 function number(label:string,value:string,set:(v:string)=>void,unit:string,max:number){return <label className="number-field"><span>{label}</span><div><input aria-label={label} type="number" min="0.1" max={max} step="0.1" value={value} onChange={e=>set(e.target.value)}/><small>{unit}</small></div></label>;}
 return <div className="material-picker">
  <label className="select-field">Species<select aria-label="Species" value={id} onChange={e=>choose(e.target.value)}>{SPECIES_REGIONS.map(region=><optgroup label={region} key={region}>{speciesForRegion(region).map(s=><option value={s.id} key={s.id}>{s.name}{!s.reference&&s.id!=='radiata-pine'?' · enter properties':''}</option>)}</optgroup>)}</select></label>
  {pending&&<p className="material-pending" role="status">Enter properties to use {species.name}. Results still show {speciesById(pole.species)?.name}. <button className="inline-info" onClick={()=>{populate(pole.species,pole.material);setOpen(false);}}>Cancel</button></p>}
  <details className="material-properties" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>Properties{pending?' · values needed':''}</summary><div className="material-draft">
   <label className="select-field">Property basis<select aria-label="Property basis" value={mode} onChange={e=>basis(e.target.value)}>{id==='radiata-pine'&&<option value="teaching">Illustrative example</option>}{species.reference&&<option value="published">Published pole reference</option>}<option value="custom">Known pole / test data</option></select></label>
   {mode==='published'&&species.round&&<div className="round-properties">
   {species.round.country==='NZ'&&<label className="select-field">Pole density category<select aria-label="Pole density category" value={(round??roundDefaults(species.round)).density} onChange={e=>setRound({...roundDefaults(species.round!),...round,density:e.target.value as RoundOptions['density']})}><option value="normal">Normal · outer zone ≥350 kg/m³</option><option value="high">High · outer zone ≥450 kg/m³</option></select></label>}
   <label className="select-field">Pole preparation<select aria-label="Pole preparation" value={(round??roundDefaults(species.round)).preparation} onChange={e=>setRound({...roundDefaults(species.round!),...round,preparation:e.target.value as RoundOptions['preparation']})}><option value="natural">Hand peeled / hydraulic debarked</option>{species.round.country==='NZ'&&<option value="peeled">Machine peeled · follows contours</option>}<option value="shaved">Machine shaved · smooth form</option></select></label>
   <label className="check-row"><input type="checkbox" checked={(round??roundDefaults(species.round)).steamed} onChange={e=>setRound({...roundDefaults(species.round!),...round,steamed:e.target.checked})}/>Steamed for treatment</label>
   <p className="field-note">{roundValues(species.round,round)?.grade} · unseasoned. {species.round.country==='NZ'?'The same density category gives the same reference values across qualifying softwoods.':'Immaturity adjustment follows the pole mid-length diameter automatically.'}</p>
   <p className="field-note">Modified characteristic bending reference. Capacity factor, load-duration and other design factors are not applied; this is not a mean test-failure prediction.</p>
  </div>}
  {mode==='published'&&species.reference&&<><p className="material-numbers">E {((m?.E??species.reference.E)/1e9).toFixed(3)} GPa · bending {((m?.basis!=='illustrative'?m?.bending:0)??0)/1e6} MPa</p><p className="field-note">{species.reference.scope}</p><a href={species.reference.url} target="_blank" rel="noreferrer">Read property source</a>{id==='douglas-fir-coastal'&&<label className="check-row"><input type="checkbox" checked={bored} onChange={e=>{setBored(e.target.checked);onChange({species:id,material:referenceMaterial(species,e.target.checked)!});}}/>Through-bored before treatment</label>}<button className="inline-info" onClick={()=>basis('custom')}>Edit these values</button></>}
   {mode!=='published'&&<>{number('Stiffness E',E,setE,'GPa',100)}{mode==='teaching'?<>{number('Tension strength',ft,setFt,'MPa',300)}{number('Compression strength',fc,setFc,'MPa',300)}<p className="field-note">Illustrative material; no specified pole grade.</p></>:<>{number('Bending reference',fb,setFb,'MPa',300)}<label className="select-field">Source / grade / condition<input aria-label="Material data source" maxLength={500} value={source} onChange={e=>setSource(e.target.value)} placeholder="e.g. batch test report, mean MOR, wet"/></label><p className="field-note">{species.group&&species.group+' group reported by DTM Timber. '}Use values for the actual pole grade, treatment and moisture condition.{!species.reference&&' Verified pole properties are not yet supplied for this species; values from overseas-grown trees are not substituted.'}</p></>}</>}
   <button className="apply-material" disabled={errors.length>0} onClick={()=>{if(m&&!errors.length)onChange({species:id,material:m});}}>Apply material</button>
   {errors.length>0&&<small className="field-note">{mode==='custom'?'Enter stiffness, bending strength and its source.':'Enter positive material properties.'}</small>}
   <details><summary>Choosing values for a test prediction</summary><p>Stiffness changes movement; strength changes timber capacity and utilisation. A soil-governed first limit can remain similar. Compare the timber bending limit separately.</p><p>Use representative full-pole test data and match the test fixture. A characteristic or designated code value is not the mean breaking strength of an individual pole. Grade values may already include knots; avoid counting the same defect twice.</p><p>NZ/Australia: AS 1720.1 / NZS AS 1720.1 round timber and the applicable overhead-line standard. US: ANSI O5.1 properties and ASTM D1036 static pole testing. UK: BS EN 14229 and the supplier declaration.</p></details>
  </div></details>
 </div>;
}
