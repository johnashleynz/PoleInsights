import type {PoleCase} from "../domain/model.ts";

export const AR_END_BLEND_M = 0.3;
const cache = new WeakMap<PoleCase, {heightM: number; ar: number}[]>();
export function deconditioningSamples(p: PoleCase) {
  if (p.assetId !== undefined && p.assetId !== p.gridManager?.assetId) return [];
  const cached = cache.get(p);
  if (cached) return cached;
  const samples = new Map<number, number>();
  const inspection = p.gridManager?.inspections.find(s => s.id === p.gridManager?.selectedInspectionId);
  for (const r of inspection?.readings ?? []) {
    if (r.heightM === null || r.ar === null || !Number.isFinite(r.heightM) || !Number.isFinite(r.ar) || r.ar < 0 || r.heightM < -p.embedment || r.heightM > p.length - p.embedment) continue;
    const ar = Math.min(100, r.ar);
    samples.set(r.heightM, Math.min(samples.get(r.heightM) ?? 100, ar));
  }
  const result = [...samples].map(([heightM, ar]) => ({heightM, ar})).sort((a,b) => a.heightM-b.heightM).slice(0,64);
  cache.set(p, result);
  return result;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function arStrengthAt(p: PoleCase, z: number) {
  if (!p.arDeconditioning) return 1;
  const samples = deconditioningSamples(p), first = samples[0], last = samples.at(-1);
  if (!first || !last || z < -p.embedment || z > p.length-p.embedment) return 1;
  if (z < first.heightM) return 1 - (1-first.ar/100)*smooth(Math.max(0, 1-(first.heightM-z)/AR_END_BLEND_M));
  if (z > last.heightM) return 1 - (1-last.ar/100)*smooth(Math.max(0, 1-(z-last.heightM)/AR_END_BLEND_M));
  for (let i=1;i<samples.length;i++) if (z<=samples[i].heightM) {
    const a=samples[i-1],b=samples[i];
    return (a.ar+(b.ar-a.ar)*smooth((z-a.heightM)/(b.heightM-a.heightM)))/100;
  }
  return first.ar/100;
}
export function deconditioningHeights(p: PoleCase) {
  if (!p.arDeconditioning) return [];
  const samples=deconditioningSamples(p);
  if (!samples.length) return [];
  const ends=[Math.max(-p.embedment,samples[0].heightM-AR_END_BLEND_M),...samples.map(s=>s.heightM),Math.min(p.length-p.embedment,samples.at(-1)!.heightM+AR_END_BLEND_M)];
  return [...new Set(ends.flatMap((z,i)=>i ? [ends[i-1],(ends[i-1]+z)/2,z] : [z]))];
}
