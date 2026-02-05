import { describe, it, expect } from 'vitest';
import { histogramEvenBins } from '../utils/bins';

describe('bins utilities', () => {
  describe('histogramEvenBins', () => {
    it('should create histogram bins with correct counts', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = histogramEvenBins(values, 1, 10, 3);

      expect(result).toHaveLength(4); // 0-3, 3-6, 6-9, 9-12
      expect(result[0]).toMatchObject({
        start: 0,
        end: 3,
        count: 2, // 1, 2
      });
      expect(result[1]).toMatchObject({
        start: 3,
        end: 6,
        count: 3, // 3, 4, 5
      });
      expect(result[2]).toMatchObject({
        start: 6,
        end: 9,
        count: 3, // 6, 7, 8
      });
    });

    it('should handle empty values array', () => {
      const result = histogramEvenBins([], 0, 10, 2);
      expect(result).toHaveLength(5);
      expect(result.every((bin) => bin.count === 0)).toBe(true);
    });

    it('should filter out non-finite values', () => {
      const values = [1, 2, NaN, 3, Infinity, 4, -Infinity, 5];
      const result = histogramEvenBins(values, 1, 5, 2);

      const totalCount = result.reduce((sum, bin) => sum + bin.count, 0);
      expect(totalCount).toBe(5); // Only 1, 2, 3, 4, 5 are counted
    });

    it('should return empty array for invalid min/max', () => {
      expect(histogramEvenBins([1, 2, 3], NaN, 10, 2)).toEqual([]);
      expect(histogramEvenBins([1, 2, 3], 1, NaN, 2)).toEqual([]);
      expect(histogramEvenBins([1, 2, 3], 10, 5, 2)).toEqual([]); // max < min
    });

    it('should throw for invalid step', () => {
      expect(() => histogramEvenBins([1, 2, 3], 0, 10, 0)).toThrow('Invalid bin step');
      expect(() => histogramEvenBins([1, 2, 3], 0, 10, -1)).toThrow('Invalid bin step');
    });

    it('should format labels with correct digits', () => {
      const values = [1.5, 2.5, 3.5];
      const result = histogramEvenBins(values, 1, 4, 1, { labelDigits: 1 });

      expect(result[0]?.label).toBe('1-2');
      expect(result[1]?.label).toBe('2-3');
      expect(result[2]?.label).toBe('3-4');
    });

    it('should handle values outside the range', () => {
      const values = [0, 5, 10, 15, 20]; // 0 and 20 are outside [5, 15]
      const result = histogramEvenBins(values, 5, 15, 5);

      const totalCount = result.reduce((sum, bin) => sum + bin.count, 0);
      expect(totalCount).toBe(3); // Only 5, 10, 15 are counted
    });
  });
});
