import type { Admin0FC, LineamentsFC, QuakeFeature, QuakeProperties } from './types';

async function loadJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function normalizeQuakeFeature(f: unknown): QuakeFeature | null {
  if (!f || typeof f !== 'object') return null;
  const anyF = f as { id?: unknown; properties?: unknown; geometry?: unknown };

  const id = anyF.id;
  if (typeof id !== 'string' || id.length === 0) return null;

  const props = anyF.properties as Partial<QuakeProperties> | undefined;
  if (!props) return null;
  if (typeof props.mag !== 'number' || typeof props.time !== 'number') return null;

  const geom = anyF.geometry as { type?: unknown; coordinates?: unknown } | undefined;
  if (!geom || geom.type !== 'Point' || !Array.isArray(geom.coordinates)) return null;
  const coords = geom.coordinates;
  if (coords.length < 3) return null;
  const lon = coords[0];
  const lat = coords[1];
  const depthKm = coords[2];
  if (typeof lon !== 'number' || typeof lat !== 'number' || typeof depthKm !== 'number') return null;

  // Keep properties as-is but with a strongly-typed surface.
  const properties = props as QuakeProperties;
  return {
    type: 'Feature',
    id,
    properties,
    geometry: { type: 'Point', coordinates: [lon, lat, depthKm] },
  };
}

export async function loadDashboardData(): Promise<{
  quakes: QuakeFeature[];
  lineaments: LineamentsFC;
  admin0: Admin0FC;
}> {
  const baseUrl = import.meta.env.BASE_URL;
  const [quakesFc, lineaments, admin0] = await Promise.all([
    loadJson<unknown>(`${baseUrl}data/quakes.json`),
    loadJson<LineamentsFC>(`${baseUrl}data/Myanmar_Tectonic_Map_2011.geojson`),
    loadJson<Admin0FC>(`${baseUrl}data/admin0.json`),
  ]);

  if (!quakesFc || typeof quakesFc !== 'object') throw new Error('Invalid quakes GeoJSON');
  const features = (quakesFc as { features?: unknown }).features;
  if (!Array.isArray(features)) throw new Error('Invalid quakes GeoJSON: missing features[]');

  const quakes: QuakeFeature[] = [];
  for (const f of features) {
    const q = normalizeQuakeFeature(f);
    if (q) quakes.push(q);
  }
  if (quakes.length === 0) throw new Error('No valid quakes found in quakes.json');

  return { quakes, lineaments, admin0 };
}

