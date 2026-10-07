import type { PoleCase } from "../domain/model.ts";
import type { DiameterStation, GridPoleSnapshot } from "./types.ts";
import {estimatedProfile} from "./estimatedProfile.ts";

export function applyGridInspection(pole: PoleCase, snapshot: GridPoleSnapshot, inspectionId: string | null): Partial<PoleCase> {
  const selected = snapshot.inspections.find(s => s.id === inspectionId);
  const agl = snapshot.heightAglM ?? null;
  const length = snapshot.lengthM ?? (agl !== null ? agl + pole.embedment : null);
  const embedment = snapshot.lengthM !== null && agl !== null ? snapshot.lengthM - agl : pole.embedment;
  const lengthValid = length !== null && Number.isFinite(length) && length >= 3 && length <= 30 && embedment >= .4 && length > embedment + 1;
  const top = lengthValid ? length - embedment : pole.length - pole.embedment;
  const stations: DiameterStation[] = [], sourceWarnings = snapshot.sourceWarnings ?? snapshot.warnings, warnings = [...sourceWarnings];
  if (length !== null && !lengthValid) warnings.push("Source length/AGL height is inconsistent or outside the supported model range; existing length and embedment retained.");
  for (const r of selected?.readings ?? []) {
    if (stations.length >= 64) {warnings.push("Only the first 64 usable circumference stations are applied in this MVP."); break;}
    if (r.heightM === null || r.circumferenceM === null) continue;
    const diameterM = r.circumferenceM / Math.PI;
    if (!Number.isFinite(r.heightM) || r.heightM < -(lengthValid ? embedment : pole.embedment) || r.heightM > top || diameterM < .07 || diameterM > 1.2) {warnings.push(`Reading ${r.id}: dimension is outside the supported pole geometry; not applied.`); continue;}
    const existing = stations.find(s => s.heightM === r.heightM);
    if (existing) {
      if (Math.abs(existing.diameterM - diameterM) > 1e-9) warnings.push(`Reading ${r.id}: circumference differs at a repeated test height; first circumference retained for geometry. All assessment results preserved.`);
      continue;
    }
    stations.push({heightM: r.heightM, diameterM, inspectionId: selected!.id, readingId: r.id});
  }
  const clearPriorStations = !stations.length && pole.gridManager?.poleId === snapshot.poleId && pole.diameterStations?.every(s => s.inspectionId === inspectionId);
  if (!stations.length) warnings.push(clearPriorStations ? "No usable circumference stations in this inspection; entered diameter profile restored." : "No usable circumference stations in this inspection; existing diameter profile retained.");
  const offsetFromTip = pole.length - pole.embedment - (pole.loadHeight ?? pole.length - pole.embedment);
  const profile = stations.length ? estimatedProfile(pole, snapshot, stations, lengthValid ? length! : pole.length, lengthValid ? embedment : pole.embedment) : null;
  if (profile) warnings.push(...profile.warnings);
  return {assetId: snapshot.assetId, gridManager: {...snapshot, sourceWarnings, selectedInspectionId: inspectionId, warnings: [...new Set(warnings)]}, ...(profile ? {diameters: profile.diameters, geometryEstimates: {diameters: profile.keys, length: lengthValid && snapshot.lengthM === null, embedment: !(snapshot.lengthM !== null && agl !== null), basis: profile.basis}} : {}), ...(stations.length ? {diameterStations: stations.sort((a, b) => a.heightM - b.heightM)} : clearPriorStations ? {diameterStations: undefined} : {}), ...(lengthValid ? {length, embedment, loadHeight: Math.max(0, top - offsetFromTip)} : {})};
}

export function overrideReadingUnit(snapshot: GridPoleSnapshot, readingId: string, unit: "mm" | "in" | undefined): GridPoleSnapshot {
  const convert = (raw: string | null, scale: number) => raw !== null && raw.trim() !== "" && Number.isFinite(Number(raw)) ? Number(raw) * scale : null;
  return {...snapshot, inspections: snapshot.inspections.map(s => s.id !== snapshot.selectedInspectionId ? s : {...s, readings: s.readings.map(r => {
    if (r.id !== readingId) return r;
    const recordedHeightM = r.recordedHeightM === undefined ? r.heightM : r.recordedHeightM;
    const recordedCircumferenceM = r.recordedCircumferenceM === undefined ? r.circumferenceM : r.recordedCircumferenceM;
    const scale = unit === "in" ? .0254 : .001;
    return {...r, recordedHeightM, recordedCircumferenceM, unitOverride: unit, heightM: unit ? convert(r.rawHeight, scale) : recordedHeightM, circumferenceM: unit ? convert(r.rawCircumference, scale) : recordedCircumferenceM};
  })})};
}

export function validGridSnapshot(value: unknown): value is GridPoleSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as GridPoleSnapshot;
  const optionalText = (s: unknown) => s === null || typeof s === "string" && s.length <= 2048;
  const optionalNumber = (s: unknown) => s === null || typeof s === "number" && Number.isFinite(s);
  if (v.heightAglM !== undefined && !optionalNumber(v.heightAglM)) return false;
  if (v.sourceWarnings !== undefined && (!Array.isArray(v.sourceWarnings) || !v.sourceWarnings.every(s => typeof s === "string"))) return false;
  if (Array.isArray(v.inspections) && v.inspections.some(s => Array.isArray(s?.readings) && s.readings.some(r => r && (r.unitOverride !== undefined && r.unitOverride !== "mm" && r.unitOverride !== "in" || r.recordedHeightM !== undefined && !optionalNumber(r.recordedHeightM) || r.recordedCircumferenceM !== undefined && !optionalNumber(r.recordedCircumferenceM))))) return false;
  return v.source === "grid-manager" && typeof v.assetId === "string" && v.assetId.length <= 255 && typeof v.poleId === "string" && typeof v.fetchedAt === "string" && optionalText(v.species) && optionalText(v.poleClass) && optionalText(v.lastSurvey) && optionalText(v.tag) && optionalNumber(v.installYear) && optionalNumber(v.lengthM) && optionalText(v.selectedInspectionId) && (v.recordUrl === undefined || typeof v.recordUrl === "string" && /^https:\/\//.test(v.recordUrl)) && Array.isArray(v.warnings) && v.warnings.length <= 1000 && v.warnings.every(s => typeof s === "string") && Array.isArray(v.inspections) && v.inspections.length <= 1000 && v.inspections.every(s => s && typeof s.id === "string" && optionalText(s.date) && optionalText(s.tag) && optionalText(s.inspector) && Array.isArray(s.readings) && s.readings.length <= 1000 && s.readings.every(r => r && typeof r.id === "string" && [r.heightM, r.circumferenceM, r.ar, r.rsm].every(optionalNumber) && [r.rawHeight, r.rawCircumference, r.rawUnit].every(optionalText)));
}
