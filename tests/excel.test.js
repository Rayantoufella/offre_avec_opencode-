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
      expect(mapping.URL_OFFRE).toBeDefined();
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

    it('should detect Deep Research columns: Technologies', () => {
      const headers = ['Technologies', 'Match Score', 'Competences manquantes'];
      const { mapping } = detectColumns(headers);
      expect(mapping.TECHNOLOGIES).toBeDefined();
      expect(mapping.MATCH_SCORE).toBeDefined();
      expect(mapping.MISSING_SKILLS).toBeDefined();
    });

    it('should detect Deep Research columns: Localisation', () => {
      const headers = ['Localisation', 'Mode travail', 'Experience demandee'];
      const { mapping } = detectColumns(headers);
      expect(mapping.LOCALISATION).toBeDefined();
      expect(mapping.MODE_TRAVAIL).toBeDefined();
      expect(mapping.EXPERIENCE_DEMANDEE).toBeDefined();
    });

    it('should detect URL_OFFRE and URL_CANDIDATURE separately', () => {
      const headers = ['URL offre', 'URL candidature'];
      const { mapping } = detectColumns(headers);
      expect(mapping.URL_OFFRE).toBeDefined();
      expect(mapping.URL_CANDIDATURE).toBeDefined();
      expect(mapping.URL_OFFRE.index).not.toBe(mapping.URL_CANDIDATURE.index);
    });

    it('should detect STATUT_OFFRE and STATUT_CANDIDATURE separately', () => {
      const headers = ['Statut offre', 'Statut candidature'];
      const { mapping } = detectColumns(headers);
      expect(mapping.STATUT_OFFRE).toBeDefined();
      expect(mapping.STATUT_CANDIDATURE).toBeDefined();
    });

    it('should detect Raisons du match', () => {
      const headers = ['Raisons du match'];
      const { mapping } = detectColumns(headers);
      expect(mapping.RAISONS_MATCH).toBeDefined();
    });

    it('should detect all 21 Deep Research columns', () => {
      const drHeaders = [
        'N°', 'Entreprise', 'Poste', 'Localisation', 'Type contrat',
        'Mode travail', 'Technologies', 'Experience demandee', 'Email candidature',
        'URL offre', 'URL candidature', 'Source', 'Type candidature',
        'Date collecte', 'Statut offre', 'Match Score', 'Niveau pertinence',
        'Raisons du match', 'Competences manquantes', 'Commentaires', 'Statut candidature'
      ];
      const { mapping } = detectColumns(drHeaders);
      expect(mapping.ENTREPRISE).toBeDefined();
      expect(mapping.POSTE).toBeDefined();
      expect(mapping.LOCALISATION).toBeDefined();
      expect(mapping.TYPE_OFFRE).toBeDefined();
      expect(mapping.MODE_TRAVAIL).toBeDefined();
      expect(mapping.TECHNOLOGIES).toBeDefined();
      expect(mapping.EXPERIENCE_DEMANDEE).toBeDefined();
      expect(mapping.EMAIL).toBeDefined();
      expect(mapping.URL_OFFRE).toBeDefined();
      expect(mapping.URL_CANDIDATURE).toBeDefined();
      expect(mapping.PLATEFORME).toBeDefined();
      expect(mapping.TYPE_CANDIDATURE).toBeDefined();
      expect(mapping.DATE_COLLECTE).toBeDefined();
      expect(mapping.STATUT_OFFRE).toBeDefined();
      expect(mapping.MATCH_SCORE).toBeDefined();
      expect(mapping.RAISONS_MATCH).toBeDefined();
      expect(mapping.MISSING_SKILLS).toBeDefined();
      expect(mapping.STATUT_CANDIDATURE).toBeDefined();
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
