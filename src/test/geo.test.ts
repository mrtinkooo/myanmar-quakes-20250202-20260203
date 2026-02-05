import { describe, it, expect } from 'vitest';
import { boundsFromBbox, bboxFromQuakes, depthColor } from '../utils/geo';
import type { QuakeFeature } from '../data/types';

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
      const quakes: QuakeFeature[] = [
        {
          id: '1',
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [95, 20, 10] },
          properties: { mag: 4.0, place: 'Myanmar', time: 1000, url: '', title: 'Test' },
        },
        {
          id: '2',
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [98, 23, 10] },
          properties: { mag: 5.0, place: 'Myanmar', time: 2000, url: '', title: 'Test' },
        },
      ];

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
          id: '1',
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [NaN, 20, 10] },
          properties: { mag: 4.0, place: 'Myanmar', time: 1000, url: '', title: 'Test' },
        },
        {
          id: '2',
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [98, 23, 10] },
          properties: { mag: 5.0, place: 'Myanmar', time: 2000, url: '', title: 'Test' },
        },
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
