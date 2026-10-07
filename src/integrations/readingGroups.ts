import type { RecordedReading } from "./types.ts";

export function placeHeightLabels(targets: number[], minY: number, maxY: number, gap = 35) {
  const blocks: {sum: number; count: number; start: number}[] = [];
  // Pool overlapping labels to minimise displacement from their true heights.
  targets.forEach((y, i) => {
    blocks.push({sum: y - i * gap, count: 1, start: i});
    while (blocks.length > 1) {
      const a = blocks[blocks.length - 2], b = blocks[blocks.length - 1];
      if (a.sum / a.count <= b.sum / b.count) break;
      a.sum += b.sum; a.count += b.count; blocks.pop();
    }
  });
  const positions: number[] = [], upper = Math.max(minY, maxY - (targets.length - 1) * gap);
  for (const block of blocks) {
    const base = Math.max(minY, Math.min(upper, block.sum / block.count));
    for (let i = block.start; i < block.start + block.count; i++) positions[i] = base + i * gap;
  }
  return positions;
}

export function groupReadingsByHeight(readings: RecordedReading[]) {
  const groups = new Map<number, RecordedReading[]>();
  for (const reading of readings) {
    if (reading.heightM === null || !Number.isFinite(reading.heightM)) continue;
    const atHeight = groups.get(reading.heightM) ?? [];
    atHeight.push(reading);
    groups.set(reading.heightM, atHeight);
  }
  return [...groups].sort((a, b) => a[0] - b[0]).map(([heightM, samples]) => {
    const values = samples.map(r => r.ar).filter((v): v is number => v !== null && Number.isFinite(v));
    const low = Math.min(...values), high = Math.max(...values);
    return {id: `height-${heightM}`, heightM, count: samples.length,
      arSummary: !values.length ? "Unavailable" : low === high ? String(low) : `${low}-${high}`,
      missingAr: samples.length - values.length,
      readingDetails: samples.map(r => `${r.id}: AR ${r.ar ?? "unavailable"}`).join("; ")};
  });
}
