export type LonLatDepth = [lon: number, lat: number, depthKm: number];

export type QuakeProperties = {
  mag: number;
  place: string;
  time: number; // epoch ms
  updated: number; // epoch ms
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
};

export type QuakeFeature = {
  type: 'Feature';
  id: string;
  properties: QuakeProperties;
  geometry: {
    type: 'Point';
    coordinates: LonLatDepth;
  };
};

export type QuakesFC = {
  type: 'FeatureCollection';
  features: QuakeFeature[];
};

export type LineamentProperties = {
  ID: number;
  CODE: string | null;
  NAME: string | null;
  SEGMENT: string | null;
  TYPE_DESCR: string | null;
};

export type LineamentGeometry =
  | { type: 'LineString'; coordinates: number[][] }
  | { type: 'MultiLineString'; coordinates: number[][][] };

export type LineamentFeature = {
  type: 'Feature';
  properties: LineamentProperties;
  geometry: LineamentGeometry;
};

export type LineamentsFC = {
  type: 'FeatureCollection';
  features: LineamentFeature[];
};

export type Admin0Geometry = {
  type: 'MultiPolygon';
  coordinates: number[][][][];
};

export type Admin0Feature = {
  type: 'Feature';
  id?: string;
  properties?: Record<string, unknown>;
  geometry: Admin0Geometry;
};

export type Admin0FC = {
  type: 'FeatureCollection';
  features: Admin0Feature[];
};

export type Filters = {
  time: { startMs: number; endMs: number };
  mag: { min: number; max: number };
  depthKm: { min: number; max: number };
};
