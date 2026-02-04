import type { Filters, QuakeFeature } from '../data/types';

export type Extents = Filters;

export function computeExtents(quakes: QuakeFeature[]): Extents {
  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;
  let minMag = Number.POSITIVE_INFINITY;
  let maxMag = Number.NEGATIVE_INFINITY;
  let minDepth = Number.POSITIVE_INFINITY;
  let maxDepth = Number.NEGATIVE_INFINITY;

  for (const q of quakes) {
    const t = q.properties.time;
    const m = q.properties.mag;
    const d = q.geometry.coordinates[2];
    if (Number.isFinite(t)) {
      minTime = Math.min(minTime, t);
      maxTime = Math.max(maxTime, t);
    }
    if (Number.isFinite(m)) {
      minMag = Math.min(minMag, m);
      maxMag = Math.max(maxMag, m);
    }
    if (Number.isFinite(d)) {
      minDepth = Math.min(minDepth, d);
      maxDepth = Math.max(maxDepth, d);
    }
  }

  if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) throw new Error('Failed to compute time extents');
  if (!Number.isFinite(minMag) || !Number.isFinite(maxMag)) throw new Error('Failed to compute magnitude extents');
  if (!Number.isFinite(minDepth) || !Number.isFinite(maxDepth)) throw new Error('Failed to compute depth extents');

  return {
    time: { startMs: minTime, endMs: maxTime },
    mag: { min: minMag, max: maxMag },
    depthKm: { min: minDepth, max: maxDepth },
  };
}

export function filterQuakes(quakes: QuakeFeature[], filters: Filters): QuakeFeature[] {
  const { time, mag, depthKm } = filters;
  return quakes.filter((q) => {
    const t = q.properties.time;
    const m = q.properties.mag;
    const d = q.geometry.coordinates[2];
    return (
      t >= time.startMs &&
      t <= time.endMs &&
      m >= mag.min &&
      m <= mag.max &&
      d >= depthKm.min &&
      d <= depthKm.max
    );
  });
}

export function computeStats(quakes: QuakeFeature[]): {
  count: number;
  maxMag: number | null;
  minTime: number | null;
  maxTime: number | null;
} {
  if (quakes.length === 0) return { count: 0, maxMag: null, minTime: null, maxTime: null };
  let maxMag = Number.NEGATIVE_INFINITY;
  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;
  for (const q of quakes) {
    maxMag = Math.max(maxMag, q.properties.mag);
    minTime = Math.min(minTime, q.properties.time);
    maxTime = Math.max(maxTime, q.properties.time);
  }
  return { count: quakes.length, maxMag, minTime, maxTime };
}

