import { describe, it, expect } from 'vitest';
import {
  QUERIES, FEED_KEYWORDS, LOCATION_VARIANTS, CONTRACT_KEYWORDS,
  getQueriesForProfile, getRecruiterSearches, getFeedKeywords, getContractKeywords, getLocationsForCity
} from '../scripts/research/linkedin-queries.js';

describe('linkedin-queries', () => {
  describe('QUERIES', () => {
    it('should have queries for all categories', () => {
      expect(QUERIES).toHaveProperty('general');
      expect(QUERIES).toHaveProperty('backend');
      expect(QUERIES).toHaveProperty('frontend');
      expect(QUERIES).toHaveProperty('fullstack');
      expect(QUERIES).toHaveProperty('data');
      expect(QUERIES).toHaveProperty('support');
      expect(QUERIES).toHaveProperty('ai');
    });

    it('should have non-empty arrays for each category', () => {
      for (const [key, queries] of Object.entries(QUERIES)) {
        expect(Array.isArray(queries)).toBe(true);
        expect(queries.length).toBeGreaterThan(0);
      }
    });

    it('should have backend queries', () => {
      expect(QUERIES.backend.some(q => q.toLowerCase().includes('laravel'))).toBe(true);
      expect(QUERIES.backend.some(q => q.toLowerCase().includes('php'))).toBe(true);
    });

    it('should have frontend queries', () => {
      expect(QUERIES.frontend.some(q => q.toLowerCase().includes('react'))).toBe(true);
    });
  });

  describe('getQueriesForProfile', () => {
    it('should return backend queries for PHP profile', () => {
      const profile = { competences: ['PHP', 'Laravel', 'MySQL'], targetRoles: ['Backend Developer'] };
      const queries = getQueriesForProfile(profile);
      expect(queries.some(q => q.includes('Laravel'))).toBe(true);
    });

    it('should return frontend queries for React profile', () => {
      const profile = { competences: ['React', 'Vue', 'CSS'], targetRoles: ['Frontend Developer'] };
      const queries = getQueriesForProfile(profile);
      expect(queries.some(q => q.includes('React'))).toBe(true);
    });

    it('should return data queries for SQL profile', () => {
      const profile = { competences: ['SQL', 'Power BI', 'Data Analysis'], targetRoles: ['Data Analyst'] };
      const queries = getQueriesForProfile(profile);
      expect(queries.some(q => q.includes('data analyst'))).toBe(true);
    });

    it('should return general queries for unknown profile', () => {
      const profile = { competences: ['Unknown'], targetRoles: ['Unknown'] };
      const queries = getQueriesForProfile(profile);
      expect(queries).toEqual(QUERIES.general);
    });

    it('should return unique queries', () => {
      const profile = { competences: ['PHP', 'React'], targetRoles: ['Fullstack Developer'] };
      const queries = getQueriesForProfile(profile);
      const unique = [...new Set(queries)];
      expect(queries.length).toBe(unique.length);
    });
  });

  describe('getRecruiterSearches', () => {
    it('should generate recruiter searches for a company', () => {
      const searches = getRecruiterSearches('TechCorp');
      expect(searches.length).toBe(7);
      expect(searches.some(s => s.includes('TechCorp'))).toBe(true);
      expect(searches.some(s => s.includes('Talent Acquisition'))).toBe(true);
      expect(searches.some(s => s.includes('IT Recruiter'))).toBe(true);
    });

    it('should handle empty company', () => {
      const searches = getRecruiterSearches('');
      expect(searches.length).toBe(7);
    });
  });

  describe('getFeedKeywords', () => {
    it('should return feed keywords', () => {
      const keywords = getFeedKeywords();
      expect(keywords).toEqual(FEED_KEYWORDS);
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should include hiring keywords', () => {
      const keywords = getFeedKeywords();
      expect(keywords.some(k => k.includes('recrute'))).toBe(true);
      expect(keywords.some(k => k.includes('hiring'))).toBe(true);
    });
  });

  describe('getContractKeywords', () => {
    it('should return CDI keywords for CDI', () => {
      const keywords = getContractKeywords('CDI');
      expect(keywords).toEqual(CONTRACT_KEYWORDS['CDI']);
    });

    it('should return Stage keywords for stage', () => {
      const keywords = getContractKeywords('stage');
      expect(keywords).toEqual(CONTRACT_KEYWORDS['Stage']);
    });

    it('should default to CDI for unknown type', () => {
      const keywords = getContractKeywords('unknown');
      expect(keywords).toEqual(CONTRACT_KEYWORDS['CDI']);
    });
  });

  describe('getLocationsForCity', () => {
    it('should return variants for Casablanca', () => {
      const variants = getLocationsForCity('Casablanca');
      expect(variants).toContain('Casablanca');
      expect(variants).toContain('Casablanca-Settat');
    });

    it('should return original city for unknown', () => {
      const variants = getLocationsForCity('UnknownCity');
      expect(variants).toEqual(['UnknownCity']);
    });
  });
});
