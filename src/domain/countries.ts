import type { UnitSystem } from "./units.ts";
import {additionalAnsiClasses} from "./ansiDimensions.ts";

export type CountryCode = "NZ" | "AU" | "US";
export interface PoleClassDefinition {
  id: string;
  label: string;
  lengthM: number;
  embedmentM: number;
  buttDiameterM: number;
  groundDiameterM: number;
  tipDiameterM: number;
  speciesIds: string[];
  source: string;
  publishedDimensions: string[];
}
export interface CountryConfig {
  code: CountryCode;
  name: string;
  defaultUnits: UnitSystem;
  speciesRegion: string;
  standards: string[];
  embedmentRule: string;
  embedment: (totalLengthM: number) => number;
  poleClasses: PoleClassDefinition[];
}

const FT = 0.3048,
  IN = 0.0254;
function taperedClass(
  id: string,
  label: string,
  lengthM: number,
  embedmentM: number,
  groundDiameterM: number,
  tipDiameterM: number,
  speciesIds: string[],
  source: string,
  publishedDimensions: string[],
): PoleClassDefinition {
  const above = lengthM - embedmentM,
    buttDiameterM =
      groundDiameterM + ((groundDiameterM - tipDiameterM) * embedmentM) / above;
  return {
    id,
    label,
    lengthM,
    embedmentM,
    buttDiameterM,
    groundDiameterM,
    tipDiameterM,
    speciesIds,
    source,
    publishedDimensions,
  };
}
const goldpineSource =
  "Goldpine Electropoles Radiata Pine Electropoles specification image supplied 29 September 2026. Length, embedment, minimum tip diameter and minimum groundline diameter are published; butt diameter is a linear-taper extrapolation for this model.";
const goldpineRows: [number, number, number, number, number][] = [
  [6, 6, 1.2, 170, 200],
  [8, 6, 1.6, 190, 230],
  [9, 6, 1.7, 205, 245],
  [9, 9, 1.8, 235, 285],
  [10, 6, 1.8, 225, 255],
  [10, 9, 1.8, 240, 290],
  [10, 12, 1.8, 255, 320],
  [11, 9, 1.8, 245, 305],
  [11, 12, 1.8, 260, 335],
  [12, 9, 1.8, 250, 315],
  [12, 12, 1.8, 265, 345],
  [14, 12, 2, 270, 370],
  [15, 12, 2.1, 275, 380],
];
const nzClasses = goldpineRows.map(([length, load, embedment, tip, ground]) =>
  taperedClass(
    `nz-goldpine-${length}m-${load}kn`,
    `${length} m / ${load} kN`,
    length,
    embedment,
    ground / 1000,
    tip / 1000,
    ["radiata-pine"],
    goldpineSource,
    ["length", "embedment", "groundDiameter", "tipDiameter"],
  ),
);

const plsAnsiReference =
  "Some reference information was cross-checked against the Power Line Systems ANSI O5.1-2017 PLS-POLE library (https://www.powline.com/files/pls_pole/ansi/ansi_O5-1.html). PLS supplies it as-is; verify it against the applicable ANSI/RUS source.";
const ansiSource =
  "ANSI O5.1-2022 Table 8, p.24, supplied 29 September 2026: Douglas-fir (both types) and Southern Pine, fibre strength 8000 psi. Top and 6-ft-from-butt circumferences are published minima; model groundline and butt diameters are linear-taper calculations. Table 8 groundline distances are explicitly not recommended embedment depths. " +
  plsAnsiReference;
const ansiClasses = [
  "H6",
  "H5",
  "H4",
  "H3",
  "H2",
  "H1",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "9",
  "10",
];
const ansiTop = [39, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 15, 12];
const ansiRows: Record<number, (number | null)[]> = {
  20: [42, 40.5, 38.5, 36.5, 34.5, 33, 31, 29, 27, 25, 23, 21, 19.5, 17.5, 14],
  25: [
    46, 44, 42, 40, 38, 36, 33.5, 31.5, 29.5, 27.5, 25.5, 23, 21.5, 19.5, 15,
  ],
  30: [
    49.5,
    47.5,
    45.5,
    43,
    41,
    38.5,
    36.5,
    34,
    32,
    29.5,
    27.5,
    25,
    23.5,
    20.5,
    null,
  ],
  35: [
    53,
    50.5,
    48.5,
    46,
    43.5,
    41.5,
    39,
    36.5,
    34,
    31.5,
    29,
    27,
    25,
    null,
    null,
  ],
  40: [
    56,
    53.5,
    51,
    48.5,
    46,
    43.5,
    41,
    38.5,
    36,
    33.5,
    31,
    28.5,
    null,
    null,
    null,
  ],
  45: [
    58.5,
    56,
    53.5,
    51,
    48.5,
    45.5,
    43,
    40.5,
    37.5,
    35,
    32.5,
    30,
    null,
    null,
    null,
  ],
  50: [
    61,
    58.5,
    55.5,
    53,
    50.5,
    47.5,
    45,
    42,
    39,
    36.5,
    34,
    null,
    null,
    null,
    null,
  ],
  55: [
    63.5,
    60.5,
    58,
    55,
    52,
    49.5,
    46.5,
    43.5,
    40.5,
    38,
    null,
    null,
    null,
    null,
    null,
  ],
  60: [
    65.5,
    62.5,
    59.5,
    57,
    54,
    51,
    48,
    45,
    42,
    39,
    null,
    null,
    null,
    null,
    null,
  ],
  65: [
    67.5,
    64.5,
    61.5,
    58.5,
    55.5,
    52.5,
    49.5,
    46.5,
    43.5,
    40.5,
    null,
    null,
    null,
    null,
    null,
  ],
  70: [
    69,
    66.5,
    63.5,
    60.5,
    57,
    54,
    51,
    48,
    45,
    41.5,
    null,
    null,
    null,
    null,
    null,
  ],
  75: [
    71,
    68,
    65,
    62,
    59,
    55.5,
    52.5,
    49,
    46,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  80: [
    72.5,
    69.5,
    66.5,
    63.5,
    60,
    57,
    54,
    50.5,
    47,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  85: [
    74.5,
    71.5,
    68,
    65,
    61.5,
    58.5,
    55,
    51.5,
    48,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  90: [
    76,
    73,
    69.5,
    66.5,
    63,
    59.5,
    56,
    53,
    49,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  95: [
    77.5,
    74.5,
    71,
    67.5,
    64.5,
    61,
    57,
    54,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  100: [
    79,
    76,
    72.5,
    69,
    65.5,
    62,
    58.5,
    55,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  105: [
    80.5,
    77,
    74,
    70.5,
    67,
    63,
    59.5,
    56,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  110: [
    82,
    78.5,
    75,
    71.5,
    68,
    64.5,
    60.5,
    57,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  115: [
    83.5,
    80,
    76.5,
    72.5,
    69,
    65.5,
    61.5,
    58,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  120: [
    85,
    81,
    77.5,
    74,
    70,
    66.5,
    62.5,
    59,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  125: [
    86,
    82.5,
    78.5,
    75,
    71,
    67.5,
    63.5,
    59.5,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
};
const usClasses = Object.entries(ansiRows).flatMap(([feet, row]) =>
  row.flatMap((circumference, index) => {
    if (circumference === null) return [];
    const lengthFt = Number(feet),
      lengthM = lengthFt * FT,
      embedmentM = lengthM * 0.1 + 2 * FT,
      topD = (ansiTop[index] * IN) / Math.PI,
      stationD = (circumference * IN) / Math.PI,
      taper = (stationD - topD) / ((lengthFt - 6) * FT),
      buttD = stationD + taper * 6 * FT,
      groundD = buttD - taper * embedmentM;
    return [
      {
        id: `us-ansi-${ansiClasses[index]}-${feet}ft`,
        label: `Class ${ansiClasses[index]} / ${feet} ft`,
        lengthM,
        embedmentM,
        buttDiameterM: buttD,
        groundDiameterM: groundD,
        tipDiameterM: topD,
        speciesIds: ["southern-pine", "douglas-fir-coastal"],
        source: ansiSource,
        publishedDimensions: [
          "length",
          "topCircumference",
          "circumferenceAt6FtFromButt",
        ],
      },
    ];
  }),
);

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  NZ: {
    code: "NZ",
    name: "New Zealand",
    defaultUnits: "metric",
    speciesRegion: "New Zealand",
    standards: ["AS/NZS 7000", "Goldpine Electropoles supplied specification"],
    embedmentRule:
      "Default starting heuristic: one sixth of total pole length. Selecting a Goldpine class uses its published embedment.",
    embedment: (length) => length / 6,
    poleClasses: nzClasses,
  },
  AU: {
    code: "AU",
    name: "Australia",
    defaultUnits: "metric",
    speciesRegion: "Australia",
    standards: ["AS/NZS 7000", "AS 1720.1"],
    embedmentRule:
      "Illustrative starting heuristic: one sixth of total pole length.",
    embedment: (length) => length / 6,
    poleClasses: [],
  },
  US: {
    code: "US",
    name: "United States",
    defaultUnits: "imperial",
    speciesRegion: "US",
    standards: ["ANSI O5.1-2022", "RUS 1728F-700"],
    embedmentRule:
      "Starting embedment heuristic: 10% of total pole length plus 2 ft. ANSI Table 8 groundline distances are not embedment recommendations.",
    embedment: (length) => length * 0.1 + 0.6096,
    poleClasses: [...usClasses, ...additionalAnsiClasses],
  },
};
export function countryConfig(code: CountryCode | undefined) {
  return COUNTRIES[code ?? "NZ"] ?? COUNTRIES.NZ;
}
export function applyEmbedmentHeuristic(
  totalLengthM: number,
  code: CountryCode,
) {
  return countryConfig(code).embedment(totalLengthM);
}
export function matchPoleClass(
  code: CountryCode,
  speciesId: string,
  lengthM: number,
  groundDiameterM: number,
) {
  const candidates = countryConfig(code)
    .poleClasses.filter(
      (c) =>
        c.speciesIds.includes(speciesId) &&
        Math.abs(c.lengthM - lengthM) < (code === "US" ? FT / 2 : 0.26),
    )
    .sort((a, b) => b.groundDiameterM - a.groundDiameterM);
  return (
    candidates.find((c) => groundDiameterM + 1e-6 >= c.groundDiameterM) ?? null
  );
}
