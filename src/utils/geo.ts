import type { QuakeFeature } from '../data/types';

export type BBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];
export type LatLngBounds = [[minLat: number, minLon: number], [maxLat: number, maxLon: number]];

export function boundsFromBbox(bbox: BBox): LatLngBounds {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}

export function bboxFromQuakes(quakes: QuakeFeature[]): BBox | null {
  let bbox: BBox | null = null;
  for (const q of quakes) {
    const [lon, lat] = q.geometry.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (!bbox) bbox = [lon, lat, lon, lat];
    else {
      bbox[0] = Math.min(bbox[0], lon);
      bbox[1] = Math.min(bbox[1], lat);
      bbox[2] = Math.max(bbox[2], lon);
      bbox[3] = Math.max(bbox[3], lat);
    }
  }
  return bbox;
}

function bboxFromCoordsDeep(coords: unknown): BBox | null {
  // Handles any GeoJSON coordinate nesting; expects leaf nodes to be [lon, lat, ...].
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const first = coords[0];

  if (typeof first === 'number') {
    const lon = coords[0];
    const lat = coords[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') return null;
    return [lon, lat, lon, lat];
  }

  let bbox: BBox | null = null;
  for (const c of coords) {
    const b = bboxFromCoordsDeep(c);
    if (!b) continue;
    if (!bbox) bbox = b;
    else {
      bbox[0] = Math.min(bbox[0], b[0]);
      bbox[1] = Math.min(bbox[1], b[1]);
      bbox[2] = Math.max(bbox[2], b[2]);
      bbox[3] = Math.max(bbox[3], b[3]);
    }
  }
  return bbox;
}

export function bboxFromFeatureCollection(fc: unknown): BBox | null {
  if (!fc || typeof fc !== 'object') return null;
  const features = (fc as { features?: unknown }).features;
  if (!Array.isArray(features)) return null;

  let bbox: BBox | null = null;
  for (const f of features) {
    const geom = (f as { geometry?: unknown }).geometry as { coordinates?: unknown } | undefined;
    const b = bboxFromCoordsDeep(geom?.coordinates);
    if (!b) continue;
    if (!bbox) bbox = b;
    else {
      bbox[0] = Math.min(bbox[0], b[0]);
      bbox[1] = Math.min(bbox[1], b[1]);
      bbox[2] = Math.max(bbox[2], b[2]);
      bbox[3] = Math.max(bbox[3], b[3]);
    }
  }
  return bbox;
}

export function depthColor(depthKm: number): string {
  if (depthKm < 30) return '#2E8B57';
  if (depthKm < 70) return '#E6A100';
  return '#C0392B';
}

