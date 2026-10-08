import type {PoleClassDefinition} from "./countries.ts";

const classes = ["H6","H5","H4","H3","H2","H1","1","2","3","4","5","6","7","9","10"];
const topsIn = [39,37,35,33,31,29,27,25,23,21,19,17,15,15,12];
// Supplied ANSI O5.1-2022, imperial Tables 5/6/9: circumference at 6 ft from butt.
// Only applicable catalogue species are included; blanks are unavailable sizes.
const tables: {table: number; page: number; speciesIds: string[]; rows: Record<number, (number | null)[]>}[] = [
  {table: 5, page: 18, speciesIds: ["western-red-cedar"], rows: {
    20: [46,44,42,40,38,36,33.5,31.5,29.5,27,25,23,21.5,18.5,15],
    25: [50.5,48.5,46,44,41.5,39.5,37,34.5,32.5,30,28,25.5,24,20.5,16.5],
    30: [54.5,52,50,47.5,45,42.5,40,37.5,35,32.5,30,28,26,22,null],
    35: [58,55.5,53,50.5,48,45.5,42.5,40,37.5,34.5,32,30,27.5,null,null],
    40: [61.5,59,56.5,53.5,51,48,45,42.5,39.5,36.5,34,31.5,null,null,null],
    45: [64.5,62,59,56,53.5,50,47.5,44.5,41.5,38.5,36,33,null,null,null],
    50: [67,64.5,61.5,58.5,55.5,52.5,49.5,46.5,43.5,40,37.5,null,null,null,null],
    55: [70,67,64,61,57.5,54.5,51.5,48.5,45,42,null,null,null,null,null],
    60: [72,69,66,63,59.5,56.5,53.5,50,46.5,43.5,null,null,null,null,null],
    65: [74.5,71.5,68,65,61.5,58.5,55,51.5,48,45,null,null,null,null,null],
    70: [76.5,73.5,70,67,63.5,60,56.5,53,49.5,46,null,null,null,null,null],
    75: [78.5,75.5,72,68.5,65,61.5,58,54.5,51,null,null,null,null,null,null],
    80: [80.5,77,74,70.5,67,63,59.5,56,52,null,null,null,null,null,null],
    85: [82.5,79,75.5,72,68.5,64.5,61,57,53.5,null,null,null,null,null,null],
    90: [84.5,81,77,73.5,70,66,62.5,58.5,54.5,null,null,null,null,null,null],
    95: [86,82.5,79,75,71.5,67.5,63.5,59.5,null,null,null,null,null,null,null],
    100: [87.5,84,80.5,76.5,72.5,69,65,61,null,null,null,null,null,null,null],
    105: [89.5,85.5,82,78,74,70,66,62,null,null,null,null,null,null,null],
    110: [91,87,83.5,79.5,75.5,71.5,67.5,63,null,null,null,null,null,null,null],
    115: [92.5,88.5,84.5,80.5,76.5,72.5,68.5,64,null,null,null,null,null,null,null],
    120: [94,90,86,82,78,74,69.5,65,null,null,null,null,null,null,null],
    125: [95.5,91.5,87.5,83,79,75,70.5,66,null,null,null,null,null,null,null],
  }},
  {table: 6, page: 20, speciesIds: ["lodgepole-pine","red-pine"], rows: {
    20: [44.5,43,41,39,37,35,32.5,30.5,28.5,26.5,24.5,22.5,21,18,14.5],
    25: [49,47,44.5,42.5,40.5,38,36,33.5,31,29,27,25,23,20,15.5],
    30: [53,50.5,48.5,46,43.5,41.5,39,36.5,34,31.5,29,27,25,21,null],
    35: [56.5,54,51.5,49,46.5,44,41.5,38.5,36,33.5,31,28.5,26.5,null,null],
    40: [59.5,57,54.5,52,49,46.5,44,41,38,35.5,33,30.5,null,null,null],
    45: [62.5,60,57,54.5,51.5,49,46,43,40,37,34.5,32,null,null,null],
    50: [65,62.5,59.5,56.5,54,51,48,45,42,39,36,null,null,null,null],
    55: [67.5,64.5,61.5,59,56,53,49.5,46.5,43.5,40.5,null,null,null,null,null],
    60: [70,67,64,61,57.5,54.5,51.5,48,45,42,null,null,null,null,null],
    65: [72,69,66,62.5,59.5,56.5,53,49.5,46,43,null,null,null,null,null],
    70: [74,71,67.5,64.5,61,58,54.5,51,47.5,44.5,null,null,null,null,null],
    75: [76,72.5,69.5,66,63,59.5,56,52.5,49,null,null,null,null,null,null],
    80: [78,74.5,71,68,64.5,61,57.5,54,50.5,null,null,null,null,null,null],
    85: [79.5,76.5,73,69.5,66,62.5,58.5,55,51.5,null,null,null,null,null,null],
    90: [81.5,78,74.5,71,67.5,64,60,56.5,52.5,null,null,null,null,null,null],
    95: [83,79.5,76,72.5,69,65,61.5,57.5,null,null,null,null,null,null,null],
    100: [84.5,81,77.5,74,70,66.5,62.5,58.5,null,null,null,null,null,null,null],
    105: [86,82.5,79,75,71.5,67.5,63.5,60,null,null,null,null,null,null,null],
    110: [87.5,84,80.5,76.5,72.5,69,65,61,null,null,null,null,null,null,null],
    115: [89,85.5,81.5,78,74,70,66,62,null,null,null,null,null,null,null],
    120: [90.5,87,83,79,75,71,67,63,null,null,null,null,null,null,null],
    125: [92,88,84,80,76,72,68,64,null,null,null,null,null,null,null],
  }},
  {table: 9, page: 26, speciesIds: ["western-larch"], rows: {
    20: [41.5,39.5,38,36,34,32.5,30,28.5,26.5,24.5,22.5,21,19,17,13.5],
    25: [45.5,43.5,41.5,39.5,37.5,35.5,33,31,29,26.5,24.5,23,21,18.5,14.5],
    30: [49,47,44.5,42.5,40.5,38,35.5,33.5,31,29,26.5,24.5,23,19.5,null],
    35: [52,50,47.5,45.5,43,40.5,38,35.5,33,31,28.5,26.5,24.5,null,null],
    40: [55,52.5,50.5,48,45.5,43,40,37.5,35,32.5,30,28,null,null,null],
    45: [57.5,55,52.5,50,47.5,45,42,39.5,37,34,31.5,29,null,null,null],
    50: [60,57.5,55,52,49.5,47,44,41,38.5,35.5,33,null,null,null,null],
    55: [62,59.5,57,54,51.5,48.5,45.5,42.5,40,37,null,null,null,null,null],
    60: [64.5,61.5,59,56,53,50,47,44,41,38.5,null,null,null,null,null],
    65: [66,63.5,60.5,57.5,55,52,48.5,46,42.5,39.5,null,null,null,null,null],
    70: [68,65,62.5,59.5,56.5,53.5,50,47,44,41,null,null,null,null,null],
    75: [70,67,64,61,58,54.5,51.5,48,45,null,null,null,null,null,null],
    80: [71.5,68.5,65.5,62.5,59,56,52.5,49.5,46,null,null,null,null,null,null],
    85: [73,70,67,64,60.5,57.5,54,50.5,47,null,null,null,null,null,null],
    90: [74.5,71.5,68.5,65,62,58.5,55,51.5,48.5,null,null,null,null,null,null],
    95: [76.5,73,70,66.5,63,60,56.5,53,null,null,null,null,null,null,null],
    100: [78,74.5,71,68,64.5,61,57.5,54,null,null,null,null,null,null,null],
    105: [79,76,72.5,69,65.5,62,58.5,55,null,null,null,null,null,null,null],
    110: [80.5,77,73.5,70,66.5,63,59.5,56,null,null,null,null,null,null,null],
    115: [82,78.5,75,71.5,68,64,60.5,57,null,null,null,null,null,null,null],
    120: [83,79.5,76,72.5,69,65,61.5,58,null,null,null,null,null,null,null],
    125: [84.5,81,77.5,73.5,70,66,62.5,58.5,null,null,null,null,null,null,null],
  }}
];

export const additionalAnsiClasses: PoleClassDefinition[] = tables.flatMap(table =>
  Object.entries(table.rows).flatMap(([feet, row]) => row.flatMap((circumference, i) => {
    if (circumference === null) return [];
    const lengthM = Number(feet)*.3048, embedmentM = lengthM*.1+.6096;
    const tipDiameterM = topsIn[i]*.0254/Math.PI, stationD = circumference*.0254/Math.PI;
    const taper = (stationD-tipDiameterM)/(lengthM-6*.3048);
    const buttDiameterM = stationD+taper*6*.3048;
    return [{
      id: `us-ansi-t${table.table}-${classes[i]}-${feet}ft`,
      label: `Class ${classes[i]} / ${feet} ft`,
      lengthM, embedmentM, tipDiameterM, buttDiameterM,
      groundDiameterM: buttDiameterM-taper*embedmentM,
      speciesIds: table.speciesIds,
      source: `ANSI O5.1-2022 Table ${table.table}, p.${table.page}, supplied reference/ANSI+O5.1-2022.pdf. Top and 6-ft-from-butt circumferences are published minima; butt and groundline are linear-taper estimates, not published measurements. Table groundline distances are not recommended embedment depths.`,
      publishedDimensions: ["length","topCircumference","circumferenceAt6FtFromButt"],
    }];
  }))
);
