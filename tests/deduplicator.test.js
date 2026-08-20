import { describe, it, expect } from 'vitest';
import { deduplicateJobs, areSimilar } from '../scripts/deep-research/deduplicator.js';

describe('deduplicator', () => {
  const mockJobs = [
    {
      title: 'Backend PHP Developer',
      company: 'TechCorp',
      location: 'Casablanca',
      sourceUrl: 'https://linkedin.com/jobs/1',
      source: 'LinkedIn'
    },
    {
      title: 'Backend PHP Developer',
      company: 'TechCorp',
      location: 'Casablanca',
      sourceUrl: 'https://indeed.com/jobs/1',
      source: 'Indeed'
    },
    {
      title: 'Frontend React Developer',
      company: 'WebInc',
      location: 'Rabat',
      sourceUrl: 'https://linkedin.com/jobs/2',
      source: 'LinkedIn'
    },
    {
      title: 'Backend PHP Developer',
      company: 'TechCorp',
      location: 'Casablanca',
      sourceUrl: 'https://linkedin.com/jobs/1',
      source: 'LinkedIn'
    }
  ];

  it('should detect similar jobs', () => {
    expect(areSimilar(mockJobs[0], mockJobs[1])).toBe(true);
  });

  it('should detect different jobs', () => {
    expect(areSimilar(mockJobs[0], mockJobs[2])).toBe(false);
  });

  it('should deduplicate jobs', () => {
    const result = deduplicateJobs(mockJobs);
    expect(result.unique.length).toBeLessThan(mockJobs.length);
    expect(result.duplicates.length).toBeGreaterThan(0);
    expect(result.stats.total).toBe(mockJobs.length);
  });

  it('should keep canonical job with most data', () => {
    const jobs = [
      { title: 'Developer', company: 'A', location: 'X', description: 'Short' },
      { title: 'Developer', company: 'A', location: 'X', description: 'This is a much longer description with more details about the position' }
    ];
    const result = deduplicateJobs(jobs);
    expect(result.unique.length).toBe(1);
    expect(result.unique[0].description.length).toBeGreaterThan(50);
  });

  it('should handle empty array', () => {
    const result = deduplicateJobs([]);
    expect(result.unique.length).toBe(0);
    expect(result.duplicates.length).toBe(0);
  });

  it('should handle single job', () => {
    const result = deduplicateJobs([mockJobs[0]]);
    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(0);
  });

  it('should detect URL duplicates', () => {
    const jobs = [
      { title: 'Different Title', company: 'Different', sourceUrl: 'https://same.com/job' },
      { title: 'Another Title', company: 'Another', sourceUrl: 'https://same.com/job' }
    ];
    const result = deduplicateJobs(jobs);
    expect(result.unique.length).toBe(1);
  });
});
