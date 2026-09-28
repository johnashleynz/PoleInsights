import { polygonDistance, simplePolygon } from "./sketch.ts";
import {
  materialErrors,
  speciesById,
  referenceMaterial,
  type PoleMaterial,
} from "./species.ts";
import type { CountryCode } from "./countries.ts";
import type { UnitSystem } from "./units.ts";
export type ViewMode = "Setup" | "Innerview" | "Stresses";
export type StressDisplay =
  "stress" | "utilisation" | "longitudinal" | "transverse" | "shear";
export type Soil = "Soft" | "Medium" | "Hard" | "Fixed";
export interface PhotoRegistration {
  sourceId: string;
  acquisition: "manual-trace" | "automatic-detection";
  millimetresPerPixel: number;
  originPx: [number, number];
  rotationDegrees: number;
  planeHeightM: number;
  scaleUncertaintyMm?: number;
  reviewed: boolean;
}
/** Extension contract only. P01 deliberately refuses unsupported contour inputs. */
export interface SectionContourShape {
  type: "section-contours";
  stations: {
    heightM: number;
    outer: [number, number][];
    holes: [number, number][][];
  }[];
  interpolation: "none" | "registered-loft";
  registration?: PhotoRegistration;
  longitudinalEvidence: "measured-stations" | "assumed-extrusion";
}
export interface EllipseShape {
  type: "ellipse";
  centreX: number;
  centreY: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  profile: "rounded" | "constant";
}
export interface SketchShape extends Omit<EllipseShape, "type"> {
  type: "sketch";
  outline: [number, number][];
}
export interface Region {
  id: string;
  name: string;
  kind: "decay" | "void" | "knot" | "drilling" | "chipping";
  decay?: {
    pattern: "heart" | "shell";
    progression: "uniform" | "source";
    sourceZ: number;
    exponent: number;
    shellDepth: number;
    offsetX?: number;
    offsetY?: number;
  };
  knot?: { grainAngle: number };
  drilling?: {
    diameter: number;
    depth: number;
    bearing: number;
    inclination?: number;
    entryHeight?: number;
  };
  chipping?: {
    bearing: number;
    degrees: number;
    depth: number;
    facets: number;
  };
  zMin: number;
  zMax: number;
  severity: number;
  shape: EllipseShape | SketchShape | SectionContourShape;
  provenance: "synthetic" | "measured" | "photo-derived";
}
export interface PoleCase {
  schemaVersion: 1;
  id: string;
  name: string;
  assetId?: string;
  country?: CountryCode;
  unitSystem?: UnitSystem;
  poleClass?: string | null;
  length: number;
  embedment: number;
  diameters: { butt: number | null; ground: number | null; tip: number | null };
  species: string;
  material: PoleMaterial;
  soil: Soil;
  soilResponse?: "elastic" | "yielding";
  soilHistory?: [number, number][]; // Committed east/north forces in N, replayed from virgin ground.
  loadKN: number;
  loadHeight?: number;
  bearing: number;
  showDetect?: boolean;
  breakCapacityPercent?: number;
  actualBreakHeight?: number | null;
  actualBreakForceKN?: number | null;
  regions: Region[];
}
export const MATERIAL = {
  E: 8e9,
  tension: 35e6,
  compression: 25e6,
  basis: "illustrative" as const,
};
export const SOILS = {
  Soft: {
    k: 4e6,
    pressure0: 15e3,
    pressureGradient: 60e3,
    description: "More ground movement",
  },
  Medium: {
    k: 12e6,
    pressure0: 40e3,
    pressureGradient: 160e3,
    description: "Balanced restraint",
  },
  Hard: {
    k: 36e6,
    pressure0: 80e3,
    pressureGradient: 320e3,
    description: "Less ground movement",
  },
};
export function defaultCase(id = "A"): PoleCase {
  return {
    schemaVersion: 1,
    id,
    name: `Pole ${id}`,
    assetId: "",
    country: "NZ",
    unitSystem: "metric",
    poleClass: null,
    length: 11,
    embedment: 1.8,
    diameters: { butt: 0.36, ground: 0.32, tip: 0.18 },
    species: "radiata-pine",
    material: { ...MATERIAL },
    soil: "Medium",
    loadKN: 1,
    bearing: 90,
    showDetect: true,
    breakCapacityPercent: 200,
    actualBreakHeight: null,
    actualBreakForceKN: null,
    regions: [],
  };
}
export function newRegion(p: PoleCase, kind: Region["kind"] = "decay"): Region {
  if (kind === "drilling") {
    const diameter = 0.009525,
      z = 0.3;
    return {
      id: crypto.randomUUID(),
      name: "Inspection drilling",
      kind,
      zMin: z - diameter / 2,
      zMax: z + diameter / 2,
      severity: 1,
      shape: {
        type: "ellipse",
        centreX: 0,
        centreY: 0,
        radiusX: diameter / 2,
        radiusY: diameter / 2,
        angle: 0,
        profile: "constant",
      },
      drilling: {
        diameter,
        depth: diameterAt(p, z) / 3,
        bearing: 135,
        inclination: 0,
        entryHeight: z,
      },
      provenance: "synthetic",
    };
  }
  if (kind === "chipping") {
    const z = 0.3;
    return {
      id: crypto.randomUUID(),
      name: "Chipping",
      kind,
      zMin: z - 0.25,
      zMax: z + 0.25,
      severity: 1,
      shape: {
        type: "ellipse",
        centreX: 0,
        centreY: 0,
        radiusX: 0.03,
        radiusY: 0.03,
        angle: 0,
        profile: "constant",
      },
      chipping: { bearing: 0, degrees: 90, depth: 0.03, facets: 0 },
      provenance: "synthetic",
    };
  }
  if (kind === "knot")
    return {
      id: crypto.randomUUID(),
      name: "Knot",
      kind,
      zMin: 0.9,
      zMax: 1.1,
      severity: 0,
      shape: {
        type: "ellipse",
        centreX: diameterAt(p, 1) * 0.37,
        centreY: 0,
        radiusX: 0.04,
        radiusY: 0.03,
        angle: 0,
        profile: "rounded",
      },
      knot: { grainAngle: 45 },
      provenance: "synthetic",
    };
  return {
    id: crypto.randomUUID(),
    name: kind === "void" ? "Internal hollow" : "Internal decay",
    kind,
    zMin: -0.6,
    zMax: 1.4,
    severity: 0.7,
    shape: {
      type: "ellipse",
      centreX: 0.02,
      centreY: 0,
      radiusX: diameters(p).ground * 0.27,
      radiusY: diameters(p).ground * 0.23,
      angle: 0,
      profile: "rounded",
    },
    provenance: "synthetic",
  };
}
export function diameters(p: PoleCase) {
  const keys = ["butt", "ground", "tip"] as const,
    zs = [-p.embedment, 0, p.length - p.embedment];
  const known = keys
    .map((key, i) => ({ key, z: zs[i], d: p.diameters[key] }))
    .filter((a) => a.d !== null) as {
    key: (typeof keys)[number];
    z: number;
    d: number;
  }[];
  if (!known.length) throw new Error("Enter at least one diameter.");
  const slope =
    known.length > 1
      ? (known[known.length - 1].d - known[0].d) /
        (known[known.length - 1].z - known[0].z)
      : -0.016;
  const resolved = {} as Record<(typeof keys)[number], number>;
  keys.forEach(
    (key, i) =>
      (resolved[key] =
        p.diameters[key] ?? known[0].d + slope * (zs[i] - known[0].z)),
  );
  return resolved;
}
export function diameterAt(p: PoleCase, z: number) {
  const d = diameters(p);
  return z <= 0
    ? d.ground + ((d.ground - d.butt) * z) / p.embedment
    : d.ground + ((d.tip - d.ground) * z) / (p.length - p.embedment);
}
export function validateCase(p: PoleCase): string[] {
  const errors: string[] = [];
  if (!p || p.schemaVersion !== 1)
    return ["This case format is not supported."];
  if (
    !["A", "B"].includes(p.id) ||
    typeof p.name !== "string" ||
    p.name.length > 80
  )
    errors.push("The case needs a valid A/B identity and a short name.");
  if (
    p.assetId !== undefined &&
    (typeof p.assetId !== "string" || p.assetId.length > 255)
  )
    errors.push("Asset ID must contain no more than 255 characters.");
  if (p.country !== undefined && !["NZ", "AU", "US"].includes(p.country))
    errors.push("Select a supported country.");
  if (
    p.unitSystem !== undefined &&
    !["metric", "imperial"].includes(p.unitSystem)
  )
    errors.push("Select Metric or Imperial units.");
  errors.push(...materialErrors(p.species, p.material));
  if (!Number.isFinite(p.length) || p.length < 3 || p.length > 30)
    errors.push("Total length must be between 3 and 30 m.");
  if (
    !Number.isFinite(p.embedment) ||
    p.embedment < 0.4 ||
    p.embedment >= p.length - 1
  )
    errors.push("Embedment must leave at least 1 m above ground.");
  if (!Number.isFinite(p.loadKN) || p.loadKN < 0 || p.loadKN > 50)
    errors.push("Load must be between 0 and 50 kN.");
  const loadZ = loadApplicationHeight(p);
  if (!Number.isFinite(loadZ) || loadZ < 0 || loadZ > p.length - p.embedment)
    errors.push(
      "Load application height must be between groundline and pole top.",
    );
  if (p.showDetect !== undefined && typeof p.showDetect !== "boolean")
    errors.push("Detect visibility must be enabled or disabled.");
  if (
    p.breakCapacityPercent !== undefined &&
    (!Number.isFinite(p.breakCapacityPercent) ||
      p.breakCapacityPercent < 100 ||
      p.breakCapacityPercent > 1000)
  )
    errors.push("Break capacity must be between 100% and 1000%.");
  if (
    p.actualBreakHeight !== undefined &&
    p.actualBreakHeight !== null &&
    (!Number.isFinite(p.actualBreakHeight) ||
      p.actualBreakHeight < 0 ||
      p.actualBreakHeight > p.length - p.embedment)
  )
    errors.push(
      "Actual break height must be above ground and within the pole.",
    );
  if (
    p.actualBreakForceKN !== undefined &&
    p.actualBreakForceKN !== null &&
    (!Number.isFinite(p.actualBreakForceKN) ||
      p.actualBreakForceKN <= 0 ||
      p.actualBreakForceKN > 500)
  )
    errors.push("Actual break force must be between 0 and 500 kN.");
  if (!Number.isFinite(p.bearing))
    errors.push("Enter a finite load direction.");
  if (!["Soft", "Medium", "Hard", "Fixed"].includes(p.soil))
    errors.push("Select a supported soil response.");
  try {
    if (
      Object.values(diameters(p)).some(
        (d) => !Number.isFinite(d) || d < 0.07 || d > 1.2,
      )
    )
      errors.push("Diameters, including estimates, must be 70–1,200 mm.");
  } catch {
    errors.push("Enter at least one diameter.");
  }
  if (!Array.isArray(p.regions) || p.regions.length > 20)
    errors.push("Use no more than 20 regions.");
  else
    for (const r of p.regions) {
      if (!r || !["ellipse", "sketch"].includes(r.shape?.type)) {
        errors.push(
          "Photo-derived contour analysis is reserved for a future version.",
        );
        continue;
      }
      const s = r.shape;
      if (s.type === "section-contours") continue;
      if (
        s.type === "sketch" &&
        (!simplePolygon(s.outline) ||
          r.provenance !== "synthetic" ||
          s.outline.some((q) => q.some((v) => Math.abs(v) > 1.00001)))
      )
        errors.push(
          "Sketches need a simple synthetic outline in local coordinates.",
        );
      if (
        !["decay", "void", "knot", "drilling", "chipping"].includes(r.kind) ||
        ![
          r.zMin,
          r.zMax,
          r.severity,
          s.centreX,
          s.centreY,
          s.radiusX,
          s.radiusY,
          s.angle,
        ].every(Number.isFinite) ||
        r.zMax <= r.zMin ||
        r.severity < 0 ||
        r.severity > 1 ||
        s.radiusX <= 0 ||
        s.radiusY <= 0
      )
        errors.push("Check the shape and extent of each defect.");
      if (
        r.decay &&
        (!["heart", "shell"].includes(r.decay.pattern) ||
          !["uniform", "source"].includes(r.decay.progression) ||
          ![r.decay.sourceZ, r.decay.exponent, r.decay.shellDepth].every(
            Number.isFinite,
          ) ||
          r.decay.sourceZ < r.zMin ||
          r.decay.sourceZ > r.zMax ||
          r.decay.exponent < 0.5 ||
          r.decay.exponent > 6 ||
          r.decay.shellDepth <= 0 ||
          r.decay.shellDepth > 0.6)
      )
        errors.push("Check the decay source and spread.");
      if (
        r.knot &&
        (!Number.isFinite(r.knot.grainAngle) ||
          r.knot.grainAngle < 0 ||
          r.knot.grainAngle > 90)
      )
        errors.push("Knot grain angle must be between 0 and 90 degrees.");
      if (
        r.decay &&
        ![r.decay.offsetX ?? 0, r.decay.offsetY ?? 0].every(Number.isFinite)
      )
        errors.push("Check shell rot position.");
      if (
        r.kind === "drilling" &&
        (!r.drilling ||
          ![
            r.drilling.diameter,
            r.drilling.depth,
            r.drilling.bearing,
            r.drilling.inclination ?? 0,
            r.drilling.entryHeight ?? (r.zMin + r.zMax) / 2,
          ].every(Number.isFinite) ||
          r.drilling.diameter < 0.009525 - 1e-9 ||
          r.drilling.diameter > 0.0127 + 1e-9 ||
          r.drilling.depth <= 0 ||
          r.drilling.depth >
            diameterAt(p, r.drilling.entryHeight ?? (r.zMin + r.zMax) / 2) ||
          (r.drilling.inclination ?? 0) < 0 ||
          (r.drilling.inclination ?? 0) > 45)
      )
        errors.push(
          "Drilling needs a 3/8–1/2 inch diameter, a depth within the pole and a 0–45 degree downward angle.",
        );
      if (
        r.kind === "chipping" &&
        (!r.chipping ||
          ![
            r.chipping.bearing,
            r.chipping.degrees,
            r.chipping.depth,
            r.chipping.facets,
          ].every(Number.isFinite) ||
          r.chipping.degrees <= 0 ||
          r.chipping.degrees > 360 ||
          r.chipping.depth <= 0 ||
          r.chipping.depth >= diameterAt(p, (r.zMin + r.zMax) / 2) / 2 ||
          !(
            r.chipping.facets === 0 ||
            (Number.isInteger(r.chipping.facets) &&
              r.chipping.facets >= 6 &&
              r.chipping.facets <= 64)
          ))
      )
        errors.push(
          "Chipping needs a 1–360 degree arc, a valid depth and either round or 6–64 facets.",
        );
      if (
        !["rounded", "constant"].includes(s.profile) ||
        r.zMax <= -p.embedment ||
        r.zMin >= p.length - p.embedment ||
        s.radiusX > 1.2 ||
        s.radiusY > 1.2
      )
        errors.push(
          "Each defect must intersect the pole length and use a supported size and profile.",
        );
    }
  if (
    p.soilResponse !== undefined &&
    !["elastic", "yielding"].includes(p.soilResponse)
  )
    errors.push("Unknown soil response.");
  if (
    p.soilHistory !== undefined &&
    (!Array.isArray(p.soilHistory) ||
      p.soilHistory.length > 64 ||
      p.soilHistory.some(
        (q) =>
          !Array.isArray(q) ||
          q.length !== 2 ||
          !q.every((v) => Number.isFinite(v) && Math.abs(v) <= 1e6),
      ))
  )
    errors.push(
      "Ground history must contain at most 64 finite horizontal load pairs.",
    );
  if (
    p.material?.basis === "pole-reference" &&
    speciesById(p.species)?.round?.country === "AU"
  ) {
    try {
      if (
        !p.material.round ||
        Math.abs(
          p.material.round.midDiameterMM -
            diameterAt(p, p.length / 2 - p.embedment) * 1000,
        ) > 1e-5
      )
        errors.push(
          "Australian pole properties must match the actual mid-length diameter.",
        );
    } catch {
      errors.push("Australian pole properties require valid pole diameters.");
    }
  }
  return errors;
}
export function regionScale(r: Region, z: number) {
  if (z < r.zMin || z > r.zMax) return 0;
  if (r.shape.type !== "section-contours" && r.shape.profile === "constant")
    return 1;
  const t = (z - r.zMin) / (r.zMax - r.zMin);
  return Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 6)));
}
export function regionContains(r: Region, x: number, y: number, z: number) {
  if (r.shape.type === "section-contours") return false;
  const s = regionScale(r, z);
  if (s < 1e-8) return false;
  const a = (r.shape.angle * Math.PI) / 180,
    dx = x - r.shape.centreX,
    dy = y - r.shape.centreY;
  const u = (dx * Math.cos(a) + dy * Math.sin(a)) / (r.shape.radiusX * s),
    v = (-dx * Math.sin(a) + dy * Math.cos(a)) / (r.shape.radiusY * s);
  return r.shape.type === "sketch"
    ? polygonDistance(r.shape.outline, u, v) <= 1
    : u * u + v * v <= 1;
}
export function conditionAt(p: PoleCase, x: number, y: number, z: number) {
  let e = 1,
    tension = 1,
    compression = 1,
    severity = 0,
    voided = false,
    knot = false,
    drilled = false;
  for (const r of p.regions) {
    const q = defectDistance(p, r, x, y, z);
    if (q > 1) continue;
    if (r.kind === "knot") {
      knot = true;
      const angle = (r.knot?.grainAngle ?? 45) * Math.max(0, 1 - q * q);
      e = Math.min(e, hankinson(angle, 0.1));
      tension = Math.min(tension, hankinson(angle, 0.05));
      compression = Math.min(compression, hankinson(angle, 0.25));
      continue;
    }
    if (r.kind === "void" || r.kind === "drilling" || r.kind === "chipping") {
      voided = true;
      drilled ||= r.kind === "drilling";
      e = 0;
      tension = compression = 0;
      severity = 1;
    } else {
      const s = decaySeverity(r, q, z);
      e = Math.min(e, 1 - 0.85 * s);
      tension = Math.min(tension, 1 - 0.95 * s);
      compression = Math.min(compression, 1 - 0.95 * s);
      severity = Math.max(severity, s);
    }
  }
  return {
    e,
    strength: Math.min(tension, compression),
    tension,
    compression,
    severity,
    voided,
    knot,
    drilled,
  };
}
/** Normalised distance in the authoritative defect geometry; >1 is outside. */
export function defectDistance(
  p: PoleCase,
  r: Region,
  x: number,
  y: number,
  z: number,
): number {
  if (z < r.zMin || z > r.zMax) return Infinity;
  if (r.kind === "drilling" && r.drilling) {
    const d = r.drilling,
      a = (d.bearing * Math.PI) / 180,
      i = ((d.inclination ?? 0) * Math.PI) / 180,
      h = d.entryHeight ?? (r.zMin + r.zMax) / 2,
      R = diameterAt(p, h) / 2,
      entry = [R * Math.sin(a), R * Math.cos(a), h],
      axis = [
        -Math.sin(a) * Math.cos(i),
        -Math.cos(a) * Math.cos(i),
        -Math.sin(i),
      ],
      q = [x - entry[0], y - entry[1], z - entry[2]],
      along = q[0] * axis[0] + q[1] * axis[1] + q[2] * axis[2];
    if (along < 0 || along > d.depth) return Infinity;
    const radial = Math.hypot(
      q[0] - along * axis[0],
      q[1] - along * axis[1],
      q[2] - along * axis[2],
    );
    return radial / (d.diameter / 2);
  }
  if (r.kind === "chipping" && r.chipping) {
    const d = r.chipping,
      R = diameterAt(p, z) / 2,
      rho = Math.hypot(x, y),
      bearing = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360,
      delta = Math.abs(((bearing - d.bearing + 540) % 360) - 180);
    if (d.degrees < 360 && delta > d.degrees / 2) return Infinity;
    let boundary = R - d.depth;
    if (d.facets >= 6) {
      const sector = (2 * Math.PI) / d.facets,
        theta = ((Math.atan2(y, x) % sector) + sector) % sector,
        beta = theta - sector / 2;
      boundary =
        (boundary * Math.cos(Math.PI / d.facets)) /
        Math.max(0.01, Math.cos(beta));
    }
    return (R - rho) / Math.max(1e-9, R - boundary);
  }
  if (r.kind === "decay" && r.decay?.pattern === "shell") {
    const depth = r.decay.shellDepth * regionScale(r, z);
    return depth < 1e-9
      ? Infinity
      : (diameterAt(p, z) / 2 -
          Math.hypot(x - (r.decay.offsetX ?? 0), y - (r.decay.offsetY ?? 0))) /
          depth;
  }
  if (r.shape.type === "section-contours") return Infinity;
  const s = regionScale(r, z);
  if (s < 1e-8) return Infinity;
  const a = (r.shape.angle * Math.PI) / 180,
    dx = x - r.shape.centreX,
    dy = y - r.shape.centreY;
  const u = (dx * Math.cos(a) + dy * Math.sin(a)) / (r.shape.radiusX * s),
    v = (-dx * Math.sin(a) + dy * Math.cos(a)) / (r.shape.radiusY * s);
  return r.shape.type === "sketch"
    ? polygonDistance(r.shape.outline, u, v)
    : Math.hypot(u, v);
}
/** A prescribed spatial progression, not a biological growth/time model. */
export function decaySeverity(r: Region, distance: number, z: number) {
  if (distance > 1) return 0;
  if (!r.decay || r.decay.progression === "uniform") return r.severity;
  const source = r.decay.sourceZ,
    span = z < source ? source - r.zMin : r.zMax - source,
    t = Math.abs(z - source) / Math.max(1e-9, span),
    q = Math.min(1, Math.max(0, distance)),
    fall = (v: number) =>
      Math.max(
        0,
        (Math.pow(0.05, Math.pow(v, r.decay!.exponent)) - 0.05) / 0.95,
      );
  return r.severity * fall(q) * fall(t);
}
/** Wood Handbook ch. 5, Eq. 5–2. Ratios are illustrative, not a knot grade rule. */
export function hankinson(angle: number, ratio: number) {
  const a = (angle * Math.PI) / 180;
  return ratio / (Math.sin(a) ** 2 + ratio * Math.cos(a) ** 2);
}
export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

export function loadApplicationHeight(p: PoleCase) {
  return p.loadHeight ?? p.length - p.embedment;
}
export function drillingBounds(d: NonNullable<Region["drilling"]>) {
  const inclination = ((d.inclination ?? 0) * Math.PI) / 180,
    entry = d.entryHeight ?? 0,
    r = d.diameter / 2;
  return {
    zMin: entry - d.depth * Math.sin(inclination) - r * Math.cos(inclination),
    zMax: entry + r * Math.cos(inclination),
  };
}
export function normaliseCase(p: PoleCase): PoleCase {
  const top = p.length - p.embedment;
  return {
    ...p,
    assetId: p.assetId ?? "",
    country: p.country ?? "NZ",
    unitSystem: p.unitSystem ?? "metric",
    poleClass: p.poleClass ?? null,
    loadHeight: clamp(p.loadHeight ?? top, 0, top),
    showDetect: p.showDetect ?? true,
    breakCapacityPercent: p.breakCapacityPercent ?? 200,
    actualBreakHeight: p.actualBreakHeight ?? null,
    actualBreakForceKN: p.actualBreakForceKN ?? null,
    regions: p.regions.map((r) =>
      r.kind === "drilling" && r.drilling
        ? (() => {
            const drilling = {
                ...r.drilling,
                inclination: r.drilling!.inclination ?? 0,
                entryHeight: r.drilling!.entryHeight ?? (r.zMin + r.zMax) / 2,
              },
              bounds = drillingBounds(drilling);
            return { ...r, drilling, zMin: bounds.zMin, zMax: bounds.zMax };
          })()
        : r,
    ),
  };
}
export function safeAssetFilePart(value: string | undefined) {
  const cleaned = (value ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[. -]+$/g, "")
    .slice(0, 120);
  return cleaned || "Unlabelled";
}

// Recompute geometry-dependent Australian reference factors after any edit.
export function refreshStandardMaterial(p: PoleCase): PoleCase {
  const s = speciesById(p.species),
    m = p.material;
  if (!s?.round || m.basis !== "pole-reference" || !m.round) return p;
  const midDiameterMM =
    s.round.country === "AU"
      ? diameterAt(p, p.length / 2 - p.embedment) * 1000
      : m.round.midDiameterMM;
  const updated = referenceMaterial(s, false, { ...m.round, midDiameterMM });
  return updated ? { ...p, material: updated } : p;
}
export function standardExample(id = "A"): PoleCase {
  const p = defaultCase(id),
    s = speciesById(p.species)!;
  return { ...p, material: referenceMaterial(s)! };
}
