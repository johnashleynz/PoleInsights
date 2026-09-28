import type { AnalysisResult } from "../analysis/beam.ts";
import type { PoleCase } from "./model.ts";

export interface BreakState {
  active: boolean;
  forceKN: number;
  heightM: number;
  basis: "observed" | "illustrative";
}

export function resolveBreakState(
  pole: PoleCase,
  result: AnalysisResult | null,
): BreakState | null {
  const hasObservation =
    pole.actualBreakForceKN != null && pole.actualBreakHeight != null;
  if (hasObservation)
    return {
      active: pole.loadKN >= pole.actualBreakForceKN!,
      forceKN: pole.actualBreakForceKN!,
      heightM: pole.actualBreakHeight!,
      basis: "observed",
    };
  if (!result) return null;
  const forceKN = (result.limitKN * (pole.breakCapacityPercent ?? 200)) / 100;
  return {
    active: pole.loadKN >= forceKN,
    forceKN,
    heightM: result.governingZ,
    basis: "illustrative",
  };
}
