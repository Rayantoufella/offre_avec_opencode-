import { describe, it, expect } from 'vitest';
import { detectColumns, normalize, similarity, COLUMN_MAPPINGS } from '../scripts/excel/column-detector.js';
import { calculateStats, RESEARCH_COLUMNS, STATUS_OPTIONS } from '../scripts/deep-research/excel-exporter.js';

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

describe('excel-exporter', () => {
  describe('RESEARCH_COLUMNS', () => {
    it('should have 21 columns', () => {
      expect(RESEARCH_COLUMNS.length).toBe(21);
    });

    it('should have missing_skills column', () => {
      const missingCol = RESEARCH_COLUMNS.find(c => c.key === 'missing_skills');
      expect(missingCol).toBeDefined();
    });

    it('should have url_offre column', () => {
      const urlCol = RESEARCH_COLUMNS.find(c => c.key === 'url_offre');
      expect(urlCol).toBeDefined();
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('should have 6 status options', () => {
      expect(STATUS_OPTIONS.length).toBe(6);
    });

    it('should start with A ENVOYER', () => {
      expect(STATUS_OPTIONS[0]).toBe('A ENVOYER');
    });
  });

  describe('calculateStats', () => {
    it('should calculate stats for matched jobs', () => {
      const matched = [
        { matchScore: 95, applicationEmail: 'a@test.com', applicationType: 'EMAIL' },
        { matchScore: 82, applicationEmail: 'b@test.com', applicationType: 'WEB_FORM' },
        { matchScore: 60, applicationEmail: null, applicationType: 'LINKEDIN' },
        { matchScore: 40, applicationEmail: null, applicationType: null }
      ];
      const stats = calculateStats(matched);
      expect(stats.total).toBe(4);
      expect(stats.excellent).toBe(1);
      expect(stats.veryGood).toBe(1);
      expect(stats.good).toBe(0);
      expect(stats.medium).toBe(1);
      expect(stats.low).toBe(1);
      expect(stats.withEmail).toBe(2);
      expect(stats.withForm).toBe(2);
    });

    it('should handle empty array', () => {
      const stats = calculateStats([]);
      expect(stats.total).toBe(0);
      expect(stats.excellent).toBe(0);
    });
  });
});
