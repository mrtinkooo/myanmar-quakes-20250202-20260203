import { describe, it, expect } from 'vitest';
import { boundsFromBbox, bboxFromQuakes, depthColor } from '../utils/geo';
import type { QuakeFeature, QuakeProperties } from '../data/types';

function createMockQuake(id: string, lon: number, lat: number, depthKm: number, mag: number): QuakeFeature {
  const properties: QuakeProperties = {
    mag,
    place: 'Myanmar',
    time: Date.now(),
    updated: Date.now(),
    tz: null,
    url: '',
    detail: '',
    felt: null,
    cdi: null,
    mmi: null,
    alert: null,
    status: 'reviewed',
    tsunami: 0,
    sig: 0,
    net: 'test',
    code: 'test',
    ids: '',
    sources: '',
    types: '',
    nst: null,
    dmin: null,
    rms: null,
    gap: null,
    magType: 'ml',
    type: 'earthquake',
    title: 'Test',
  };

  return {
    id,
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat, depthKm] },
    properties,
  };
}

describe('geo utilities', () => {
  describe('boundsFromBbox', () => {
    it('should convert BBox to LatLngBounds', () => {
      const bbox: [number, number, number, number] = [95, 20, 98, 23];
      const result = boundsFromBbox(bbox);
      expect(result).toEqual([
        [20, 95],
        [23, 98],
      ]);
    });

    it('should handle negative coordinates', () => {
      const bbox: [number, number, number, number] = [-180, -90, 180, 90];
      const result = boundsFromBbox(bbox);
      expect(result).toEqual([
        [-90, -180],
        [90, 180],
      ]);
    });
  });

  describe('bboxFromQuakes', () => {
    it('should calculate bounding box from quakes', () => {
      const quakes: QuakeFeature[] = [createMockQuake('1', 95, 20, 10, 4.0), createMockQuake('2', 98, 23, 10, 5.0)];

      const result = bboxFromQuakes(quakes);
      expect(result).toEqual([95, 20, 98, 23]);
    });

    it('should handle empty array', () => {
      const result = bboxFromQuakes([]);
      expect(result).toBeNull();
    });

    it('should skip invalid coordinates', () => {
      const quakes: QuakeFeature[] = [
        {
          ...createMockQuake('1', NaN, 20, 10, 4.0),
          geometry: { type: 'Point', coordinates: [NaN, 20, 10] },
        },
        createMockQuake('2', 98, 23, 10, 5.0),
      ];

      const result = bboxFromQuakes(quakes);
      expect(result).toEqual([98, 23, 98, 23]);
    });
  });

  describe('depthColor', () => {
    it('should return green for shallow quakes (<30km)', () => {
      expect(depthColor(0)).toBe('#2E8B57');
      expect(depthColor(15)).toBe('#2E8B57');
      expect(depthColor(29)).toBe('#2E8B57');
    });

    it('should return orange for intermediate quakes (30-70km)', () => {
      expect(depthColor(30)).toBe('#E6A100');
      expect(depthColor(50)).toBe('#E6A100');
      expect(depthColor(69)).toBe('#E6A100');
    });

    it('should return red for deep quakes (>=70km)', () => {
      expect(depthColor(70)).toBe('#C0392B');
      expect(depthColor(100)).toBe('#C0392B');
      expect(depthColor(600)).toBe('#C0392B');
    });
  });
});
