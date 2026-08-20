import { describe, it, expect } from 'vitest';
import { generateSearchQueries, generateLinkedInQueries, LOCATION_SYNONYMS } from '../scripts/deep-research/query-generator.js';

describe('query-generator', () => {
  const mockPlan = {
    keywords: ['PHP', 'Laravel', 'Backend Developer'],
    locations: ['Casablanca', 'Maroc'],
    queries: ['PHP Developer Casablanca', 'Laravel Maroc'],
    strategy: 'balanced'
  };

  it('should generate search queries', () => {
    const queries = generateSearchQueries(mockPlan);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0].query).toBeDefined();
    expect(queries[0].source).toBeDefined();
  });

  it('should generate LinkedIn queries', () => {
    const queries = generateLinkedInQueries(mockPlan);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.some(q => q.includes('PHP'))).toBe(true);
  });

  it('should include location synonyms', () => {
    const queries = generateSearchQueries(mockPlan);
    const hasCasa = queries.some(q => q.query.toLowerCase().includes('casa'));
    expect(hasCasa).toBe(true);
  });

  it('should not have duplicates', () => {
    const queries = generateSearchQueries(mockPlan);
    const unique = new Set(queries.map(q => q.query.toLowerCase()));
    expect(unique.size).toBe(queries.length);
  });

  it('should handle empty plan', () => {
    const emptyPlan = { keywords: [], locations: [], queries: [], strategy: 'balanced' };
    const queries = generateSearchQueries(emptyPlan);
    expect(Array.isArray(queries)).toBe(true);
  });
});

describe('LOCATION_SYNONYMS', () => {
  it('should have Casablanca synonyms', () => {
    expect(LOCATION_SYNONYMS.Casablanca).toContain('Casa');
  });

  it('should have Remote synonyms', () => {
    expect(LOCATION_SYNONYMS.Remote).toContain('Teletravail');
  });
});
