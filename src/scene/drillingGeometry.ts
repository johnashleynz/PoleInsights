export interface DrillingScenePlacement {
  entry: [number, number, number];
  inward: [number, number, number];
  midpoint: [number, number, number];
  mouth: [number, number, number];
}

/** Local scene coordinates for a bore drilled down and inward from the bark. */
export function drillingScenePlacement(
  bearingDegrees: number,
  downwardDegrees: number,
  radius: number,
  depth: number,
): DrillingScenePlacement {
  const bearing = (bearingDegrees * Math.PI) / 180,
    downward = (downwardDegrees * Math.PI) / 180,
    outward: [number, number, number] = [
      Math.sin(bearing),
      0,
      -Math.cos(bearing),
    ],
    inward: [number, number, number] = [
      -Math.sin(bearing) * Math.cos(downward),
      -Math.sin(downward),
      Math.cos(bearing) * Math.cos(downward),
    ],
    entry: [number, number, number] = [
      outward[0] * radius,
      0,
      outward[2] * radius,
    ];
  return {
    entry,
    inward,
    midpoint: [
      entry[0] + (inward[0] * depth) / 2,
      entry[1] + (inward[1] * depth) / 2,
      entry[2] + (inward[2] * depth) / 2,
    ],
    mouth: [
      entry[0] + outward[0] * 0.0008,
      entry[1],
      entry[2] + outward[2] * 0.0008,
    ],
  };
}
