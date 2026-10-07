export interface RecordedReading {
  id: string;
  heightM: number | null;
  circumferenceM: number | null;
  ar: number | null;
  rsm: number | null;
  rawHeight: string | null;
  rawCircumference: string | null;
  rawUnit: string | null;
  unitOverride?: "mm" | "in";
  recordedHeightM?: number | null;
  recordedCircumferenceM?: number | null;
}
export interface RecordedInspection {
  id: string;
  date: string | null;
  inspector: string | null;
  tag: string | null;
  readings: RecordedReading[];
}
export interface GridPoleSnapshot {
  source: "grid-manager";
  fetchedAt: string;
  poleId: string;
  assetId: string;
  recordUrl?: string;
  species: string | null;
  poleClass: string | null;
  installYear: number | null;
  lastSurvey: string | null;
  tag: string | null;
  lengthM: number | null;
  heightAglM?: number | null;
  inspections: RecordedInspection[];
  selectedInspectionId: string | null;
  warnings: string[];
  sourceWarnings?: string[];
}
export interface DiameterStation {
  heightM: number;
  diameterM: number;
  inspectionId: string;
  readingId: string;
}
