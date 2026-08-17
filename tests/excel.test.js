import { describe, it, expect } from 'vitest';
import { detectColumns, normalize, similarity, COLUMN_MAPPINGS } from '../scripts/excel/column-detector.js';

describe('column-detector', () => {
  describe('normalize', () => {
    it('should normalize accented characters', () => {
      expect(normalize('Entreprise')).toBe('entreprise');
      expect(normalize('Société')).toBe('societe');
      expect(normalize('Courriel')).toBe('courriel');
    });

    it('should lowercase and trim', () => {
      expect(normalize('  EMAIL  ')).toBe('email');
      expect(normalize('Poste')).toBe('poste');
    });
  });

  describe('similarity', () => {
    it('should return 1 for exact match', () => {
      expect(similarity('email', 'email')).toBe(1);
    });

    it('should return high score for partial match', () => {
      expect(similarity('adresse email', 'email')).toBeGreaterThan(0.5);
    });

    it('should return low score for unrelated words', () => {
      expect(similarity('banana', 'email')).toBeLessThan(0.3);
    });
  });

  describe('detectColumns', () => {
    it('should detect email column', () => {
      const headers = ['Nom', 'Email', 'Entreprise', 'Poste'];
      const { mapping } = detectColumns(headers);
      expect(mapping.EMAIL).toBeDefined();
      expect(mapping.EMAIL.index).toBe(1);
    });

    it('should detect entreprise column with French name', () => {
      const headers = ['Société', 'Contact'];
      const { mapping } = detectColumns(headers);
      expect(mapping.ENTREPRISE).toBeDefined();
    });

    it('should detect multiple columns', () => {
      const headers = ['Entreprise', 'Email', 'Poste', 'URL', 'Description'];
      const { mapping } = detectColumns(headers);
      expect(mapping.ENTREPRISE).toBeDefined();
      expect(mapping.EMAIL).toBeDefined();
      expect(mapping.POSTE).toBeDefined();
      expect(mapping.URL).toBeDefined();
      expect(mapping.DESCRIPTION).toBeDefined();
    });

    it('should handle empty headers', () => {
      const headers = [];
      const { mapping } = detectColumns(headers);
      expect(Object.keys(mapping)).toHaveLength(0);
    });

    it('should list unmapped columns', () => {
      const headers = ['Email', 'CustomField'];
      const { unmapped } = detectColumns(headers);
      expect(unmapped.length).toBeGreaterThan(0);
      expect(unmapped.some(u => u.header === 'CustomField')).toBe(true);
    });
  });
});
