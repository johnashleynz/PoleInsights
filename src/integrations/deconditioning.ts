import type {PoleCase} from "../domain/model.ts";

export const AR_END_BLEND_M = 0.3;
const cache = new WeakMap<PoleCase, {heightM: number; ar: number | null}[]>();
export function deconditioningProfile(p: PoleCase) {
  if (p.assetId !== undefined && p.assetId !== p.gridManager?.assetId) return [];
  const cached = cache.get(p);
  if (cached) return cached;
  const samples = new Map<number, number | null>();
  const inspection = p.gridManager?.inspections.find(s => s.id === p.gridManager?.selectedInspectionId);
  for (const r of inspection?.readings ?? []) {
    if (r.heightM === null || !Number.isFinite(r.heightM) || r.heightM < -p.embedment || r.heightM > p.length - p.embedment) continue;
    if (r.ar === null || !Number.isFinite(r.ar) || r.ar < 0) {
      if (!samples.has(r.heightM)) samples.set(r.heightM, null);
      continue;
    }
    const ar = Math.min(100, r.ar);
    samples.set(r.heightM, Math.min(samples.get(r.heightM) ?? 100, ar));
  }
  const result = [...samples].map(([heightM, ar]) => ({heightM, ar})).sort((a,b) => a.heightM-b.heightM).slice(0,64);
  cache.set(p, result);
  return result;
}
export function deconditioningSamples(p: PoleCase) {
  return deconditioningProfile(p).filter((s): s is {heightM: number; ar: number} => s.ar !== null);
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function arStrengthAt(p: PoleCase, z: number) {
  if (!p.arDeconditioning) return 1;
  const samples = deconditioningProfile(p), first = samples[0], last = samples.at(-1);
  if (!first || !last || z < -p.embedment || z > p.length-p.embedment) return 1;
  if (z < first.heightM) return first.ar === null ? 1 : 1 - (1-first.ar/100)*smooth(Math.max(0, 1-(first.heightM-z)/AR_END_BLEND_M));
  if (z > last.heightM) return last.ar === null ? 1 : 1 - (1-last.ar/100)*smooth(Math.max(0, 1-(z-last.heightM)/AR_END_BLEND_M));
  for (let i=1;i<samples.length;i++) if (z<=samples[i].heightM) {
    const a=samples[i-1],b=samples[i];
    // Unknown soundings terminate a zone; do not interpolate an AR through them.
    const blend = Math.min(AR_END_BLEND_M, b.heightM-a.heightM);
    if (a.ar === null) return b.ar === null ? 1 : 1-(1-b.ar/100)*smooth(Math.max(0,1-(b.heightM-z)/blend));
    if (b.ar === null) return 1-(1-a.ar/100)*smooth(Math.max(0,1-(z-a.heightM)/blend));
    return (a.ar+(b.ar-a.ar)*smooth((z-a.heightM)/(b.heightM-a.heightM)))/100;
  }
  return first.ar === null ? 1 : first.ar/100;
}
export function deconditioningHeights(p: PoleCase) {
  if (!p.arDeconditioning) return [];
  const samples=deconditioningProfile(p);
  if (!samples.length) return [];
  const ends=[...samples.flatMap((s,i)=>[Math.max(samples[i-1]?.heightM ?? -p.embedment,s.heightM-AR_END_BLEND_M),s.heightM,Math.min(samples[i+1]?.heightM ?? p.length-p.embedment,s.heightM+AR_END_BLEND_M)])].sort((a,b)=>a-b);
  return [...new Set(ends.flatMap((z,i)=>i ? [ends[i-1],(ends[i-1]+z)/2,z] : [z]))];
}
