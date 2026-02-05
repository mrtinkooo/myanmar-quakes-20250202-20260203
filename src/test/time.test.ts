import { describe, it, expect } from 'vitest';
import {
  DAY_MS,
  utcDayStartMs,
  parseDateInputToUtcDayStartMs,
  msToUtcDateInput,
  formatUtcDate,
  formatUtcDateTime,
} from '../utils/time';

describe('time utilities', () => {
  describe('DAY_MS constant', () => {
    it('should equal 86400000 milliseconds', () => {
      expect(DAY_MS).toBe(86400000);
    });
  });

  describe('utcDayStartMs', () => {
    it('should return the start of the UTC day', () => {
      const input = Date.UTC(2025, 1, 3, 14, 30, 45); // Feb 3, 2025, 14:30:45
      const expected = Date.UTC(2025, 1, 3, 0, 0, 0); // Feb 3, 2025, 00:00:00
      expect(utcDayStartMs(input)).toBe(expected);
    });

    it('should handle midnight correctly', () => {
      const input = Date.UTC(2025, 1, 3, 0, 0, 0);
      expect(utcDayStartMs(input)).toBe(input);
    });
  });

  describe('parseDateInputToUtcDayStartMs', () => {
    it('should parse YYYY-MM-DD format correctly', () => {
      const result = parseDateInputToUtcDayStartMs('2025-02-03');
      const expected = Date.UTC(2025, 1, 3, 0, 0, 0);
      expect(result).toBe(expected);
    });

    it('should throw on invalid format', () => {
      expect(() => parseDateInputToUtcDayStartMs('03/02/2025')).toThrow('Invalid date input');
      expect(() => parseDateInputToUtcDayStartMs('2025-2-3')).toThrow('Invalid date input');
    });
  });

  describe('msToUtcDateInput', () => {
    it('should format epoch milliseconds as YYYY-MM-DD', () => {
      const input = Date.UTC(2025, 1, 3, 14, 30, 45);
      expect(msToUtcDateInput(input)).toBe('2025-02-03');
    });

    it('should handle single-digit months and days correctly', () => {
      const input = Date.UTC(2025, 0, 5); // Jan 5, 2025
      expect(msToUtcDateInput(input)).toBe('2025-01-05');
    });
  });

  describe('formatUtcDate', () => {
    it('should format epoch milliseconds as YYYY-MM-DD', () => {
      const input = Date.UTC(2025, 1, 3, 14, 30, 45);
      expect(formatUtcDate(input)).toBe('2025-02-03');
    });
  });

  describe('formatUtcDateTime', () => {
    it('should format epoch milliseconds as YYYY-MM-DD HH:MM:SSZ', () => {
      const input = Date.UTC(2025, 1, 3, 14, 30, 45);
      expect(formatUtcDateTime(input)).toBe('2025-02-03 14:30:45Z');
    });

    it('should handle midnight correctly', () => {
      const input = Date.UTC(2025, 1, 3, 0, 0, 0);
      expect(formatUtcDateTime(input)).toBe('2025-02-03 00:00:00Z');
    });
  });
});
