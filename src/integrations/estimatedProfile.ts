import {COUNTRIES, type PoleClassDefinition} from "../domain/countries.ts";
import type {PoleCase} from "../domain/model.ts";
import type {DiameterStation, GridPoleSnapshot} from "./types.ts";

export function nominalPoleClass(pole: PoleCase, snapshot: GridPoleSnapshot, length: number) {
  const classes = COUNTRIES[pole.country ?? "NZ"].poleClasses.filter(c=>c.speciesIds.includes(pole.species));
  const sourceClass = snapshot.poleClass?.trim().toLowerCase() ?? "";
  let candidates: PoleClassDefinition[] = [];
  const us = /^(?:class\s*)?(h[1-6]|\d+)(?:\s*\/\s*(\d+(?:\.\d+)?)\s*(?:ft|')?)?$/.exec(sourceClass);
  const nz = /^(\d+(?:\.\d+)?)\s*kn(?:\s*\/\s*(\d+(?:\.\d+)?)\s*m)?$/.exec(sourceClass);
  if (sourceClass) candidates = classes.filter(c=>c.id.toLowerCase()===sourceClass || c.label.toLowerCase()===sourceClass ||
    pole.country !== 'US' && nz && c.label.toLowerCase().endsWith(`/ ${nz[1]} kn`) && (!nz[2] || Math.abs(c.lengthM-Number(nz[2]))<1e-6) ||
    pole.country === 'US' && us && c.label.toLowerCase().startsWith(`class ${us[1]} /`) && (!us[2] || Math.abs(c.lengthM-Number(us[2])*.3048)<1e-6));
  else candidates = classes.filter(c=>c.id===pole.poleClass);
  return candidates.filter(c=>Math.abs(c.lengthM-length)<(pole.country==='US' ? .3048/2 : .26)).sort((a,b)=>Math.abs(a.lengthM-length)-Math.abs(b.lengthM-length))[0];
}

export function gridClassLengthLabel(pole: PoleCase, snapshot: GridPoleSnapshot) {
  const length = snapshot.lengthM ?? snapshot.poleLengthM ?? snapshot.heightAglM;
  const value = snapshot.poleClass?.trim();
  if (!value) return 'Unknown';
  if (pole.country === 'US') {
    const match = /^(?:class\s*)?(h[1-6]|\d+)(?:\s*\/\s*(\d+(?:\.\d+)?)\s*(?:ft|')?)?$/i.exec(value);
    return match ? `Class ${match[1].toUpperCase()}/${match[2] ?? (length == null ? '?' : Number((length/.3048).toFixed(2)))}` : value;
  }
  const match = /^(\d+(?:\.\d+)?)\s*kn(?:\s*\/\s*(\d+(?:\.\d+)?)\s*m)?$/i.exec(value);
  return match ? `${match[1]} kN / ${match[2] ?? (length == null ? '?' : Number(length.toFixed(2)))} m` : value;
}

export function estimatedProfile(pole: PoleCase, snapshot: GridPoleSnapshot, stations: DiameterStation[], length: number, embedment: number) {
  const points = [...stations].sort((a,b)=>a.heightM-b.heightM), first = points[0], last = points.at(-1)!;
  const top = length - embedment, warnings: string[] = [];
  const nominal = nominalPoleClass(pole, snapshot, length);
  if (nominal) {
    const slope = (nominal.tipDiameterM-nominal.buttDiameterM)/nominal.lengthM;
    const butt = Math.min(1.2, Math.max(nominal.buttDiameterM, first.diameterM-slope*(first.heightM+embedment)));
    const tip = Math.max(.07, Math.min(nominal.tipDiameterM, last.diameterM));
    if (butt > nominal.buttDiameterM+1e-9 || tip < nominal.tipDiameterM-1e-9) warnings.push('Measured sections conflict with nominal end taper; estimated ends adjusted to avoid an artificial bulge. Review source units and class.');
    const anchors = new Map<number,number>([[-embedment,butt],[top,tip]]);
    for (const p of points) anchors.set(p.heightM,p.diameterM);
    const profile = [...anchors].sort((a,b)=>a[0]-b[0]);
    let ground = profile[0][1];
    for (let i=1;i<profile.length;i++) if (0<=profile[i][0]) {
      const [a,b] = [profile[i-1],profile[i]];
      ground = a[1]+(b[1]-a[1])*(0-a[0])/(b[0]-a[0]);break;
    }
    if (points.some((p,i)=>i>0 && p.diameterM>points[i-1].diameterM+1e-9)) warnings.push('Measured diameters increase with height; measurements retained. Review source units and pole shape.');
    const heights = {butt:-embedment,ground:0,tip:top};
    const keys = (Object.keys(heights) as (keyof typeof heights)[]).filter(key=>!points.some(p=>p.heightM===heights[key]));
    return {diameters:{butt:anchors.get(-embedment)!,ground,tip:anchors.get(top)!}, keys,
      basis:`Measured sections with nominal end dimensions from ${nominal.label}. ${nominal.source} Incompatible ends may be adjusted with a warning; no class compliance is implied.`, warnings};
  }
  let slope = 0;
  if (points.length > 1) {
    const meanZ = points.reduce((n,p)=>n+p.heightM,0)/points.length, meanD = points.reduce((n,p)=>n+p.diameterM,0)/points.length;
    slope = Math.min(0, points.reduce((n,p)=>n+(p.heightM-meanZ)*(p.diameterM-meanD),0)/points.reduce((n,p)=>n+(p.heightM-meanZ)**2,0));
  }
  const minimumSlope = Math.max(first.heightM > -embedment ? (first.diameterM-1.2)/(first.heightM+embedment) : -Infinity, top > last.heightM ? (.07-last.diameterM)/(top-last.heightM) : -Infinity);
  if (slope < minimumSlope) {slope = minimumSlope; warnings.push("Extrapolated taper was bounded to supported diameter limits; review estimated ends.");}
  if (points.length === 1 || slope === 0) warnings.push("No applicable class/length dimensions and measurements do not establish a decreasing taper; unmeasured ends use a cylindrical estimate.");
  if (points.some((p,i)=>i>0 && p.diameterM>points[i-1].diameterM+1e-9)) warnings.push("Measured diameters increase with height; measurements retained. Review source units and pole shape.");
  function at(z: number) {
    if (z<=first.heightM) return first.diameterM+slope*(z-first.heightM);
    if (z>=last.heightM) return last.diameterM+slope*(z-last.heightM);
    const i=points.findIndex(p=>p.heightM>=z), a=points[i-1],b=points[i];
    return a.diameterM+(b.diameterM-a.diameterM)*(z-a.heightM)/(b.heightM-a.heightM);
  }
  const heights = {butt:-embedment,ground:0,tip:top};
  const diameters = {butt:at(heights.butt),ground:at(0),tip:at(top)};
  const keys = (Object.keys(heights) as (keyof typeof heights)[]).filter(key=>!points.some(p=>p.heightM===heights[key]));
  const basis = "Measured sections with bounded least-squares taper; unmeasured end diameters are estimates.";
  return {diameters, keys, basis, warnings};
}
