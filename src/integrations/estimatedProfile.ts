import {COUNTRIES, type PoleClassDefinition} from "../domain/countries.ts";
import type {PoleCase} from "../domain/model.ts";
import type {DiameterStation, GridPoleSnapshot} from "./types.ts";

export function estimatedProfile(pole: PoleCase, snapshot: GridPoleSnapshot, stations: DiameterStation[], length: number, embedment: number) {
  const points = [...stations].sort((a,b)=>a.heightM-b.heightM), first = points[0], last = points.at(-1)!;
  const top = length - embedment, warnings: string[] = [];
  const classes = COUNTRIES[pole.country ?? "NZ"].poleClasses.filter(c=>c.speciesIds.includes(pole.species));
  const sourceClass = snapshot.poleClass?.trim().toLowerCase() ?? "";
  let candidates: PoleClassDefinition[] = [];
  if (sourceClass) candidates = classes.filter(c=>c.id.toLowerCase()===sourceClass || c.label.toLowerCase()===sourceClass ||
    /^\d+\s*kn$/.test(sourceClass) && c.label.toLowerCase().endsWith(`/ ${sourceClass.replace(/\s*/g, "").replace("kn", " kn")}`) ||
    /^(?:class\s+)?(?:h\d|\d+)$/.test(sourceClass) && c.label.toLowerCase().startsWith(`class ${sourceClass.replace(/^class\s+/, "")} /`));
  else candidates = classes.filter(c=>c.id===pole.poleClass);
  const nominal = candidates.sort((a,b)=>Math.abs(a.lengthM-length)-Math.abs(b.lengthM-length))[0];
  let slope = 0;
  if (nominal) slope = (nominal.tipDiameterM - nominal.groundDiameterM) / (nominal.lengthM - nominal.embedmentM);
  else if (points.length > 1) {
    const meanZ = points.reduce((n,p)=>n+p.heightM,0)/points.length, meanD = points.reduce((n,p)=>n+p.diameterM,0)/points.length;
    slope = Math.min(0, points.reduce((n,p)=>n+(p.heightM-meanZ)*(p.diameterM-meanD),0)/points.reduce((n,p)=>n+(p.heightM-meanZ)**2,0));
  }
  const minimumSlope = Math.max(first.heightM > -embedment ? (first.diameterM-1.2)/(first.heightM+embedment) : -Infinity, top > last.heightM ? (.07-last.diameterM)/(top-last.heightM) : -Infinity);
  if (slope < minimumSlope) {slope = minimumSlope; warnings.push("Extrapolated taper was bounded to supported diameter limits; review estimated ends.");}
  if (!nominal && (points.length === 1 || slope === 0)) warnings.push("Measurements do not establish a decreasing taper; unmeasured ends use a cylindrical estimate.");
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
  const basis = nominal ? `Measured sections with nominal taper from ${nominal.label}; end diameters are estimates, not class minima.` : "Measured sections with bounded least-squares taper; unmeasured end diameters are estimates.";
  return {diameters, keys, basis, warnings};
}
