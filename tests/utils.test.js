import { describe, it, expect } from 'vitest';
import { normalize, similarity, formatDate, formatDateTime, truncate, unique, chunk } from '../scripts/deep-research/utils.js';

describe('deep-research/utils', () => {
  describe('normalize', () => {
    it('should lowercase and remove accents', () => {
      expect(normalize('Entreprise')).toBe('entreprise');
      expect(normalize('Société')).toBe('societe');
      expect(normalize('Développeur')).toBe('developpeur');
    });

    it('should remove special characters', () => {
      expect(normalize('PHP/Laravel')).toBe('phplaravel');
      expect(normalize('C++')).toBe('c');
      expect(normalize('Node.js')).toBe('nodejs');
    });

    it('should handle empty/null input', () => {
      expect(normalize('')).toBe('');
      expect(normalize(null)).toBe('');
      expect(normalize(undefined)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(normalize('  hello  ')).toBe('hello');
    });
  });

  describe('similarity', () => {
    it('should return 1 for identical strings', () => {
      expect(similarity('backend php', 'backend php')).toBe(1);
    });

    it('should return high score for substring match', () => {
      expect(similarity('developpeur backend php', 'backend php')).toBeGreaterThanOrEqual(0.8);
    });

    it('should return 0 for empty strings', () => {
      expect(similarity('', 'test')).toBe(0);
      expect(similarity('test', '')).toBe(0);
    });

    it('should return partial score for partial word matches', () => {
      const score = similarity('backend php laravel', 'php mysql');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should return low score for unrelated strings', () => {
      expect(similarity('banana', 'email')).toBeLessThan(0.3);
    });
  });

  describe('formatDate', () => {
    it('should format a Date object', () => {
      const d = new Date('2026-01-15T12:00:00');
      expect(formatDate(d)).toBe('2026-01-15');
    });

    it('should format a date string', () => {
      expect(formatDate('2026-03-20')).toBe('2026-03-20');
    });

    it('should return empty for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should format full ISO datetime', () => {
      const d = new Date(2026, 0, 15, 14, 30);
      const result = formatDateTime(d);
      expect(result).toContain('2026-01-15');
      expect(result).toContain('T');
    });

    it('should return empty for null', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('hi', 5)).toBe('hi');
    });

    it('should return empty for null', () => {
      expect(truncate(null)).toBe('');
    });
  });

  describe('unique', () => {
    it('should remove duplicates by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 1, name: 'b' },
        { id: 2, name: 'c' }
      ];
      const result = unique(items, i => i.id);
      expect(result).toHaveLength(2);
    });

    it('should keep all unique items', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(unique(items, i => i.id)).toHaveLength(3);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle exact division', () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it('should handle empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });
  });
});
