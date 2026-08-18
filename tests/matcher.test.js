import { describe, it, expect } from 'vitest';
import { matchSingleJob, matchJobs, getMatchSummary, SCORE_LABELS } from '../scripts/deep-research/matcher.js';

describe('matcher', () => {
  const mockProfile = {
    competences: ['PHP', 'Laravel', 'MySQL', 'Docker', 'JavaScript', 'Vue.js'],
    technologies: ['PHP', 'Laravel', 'MySQL', 'Docker'],
    experience: 'Junior',
    localisation: 'Agadir',
    categories: ['Backend']
  };

  const mockJob = {
    title: 'Backend Developer PHP Laravel',
    company: 'TechCorp',
    location: 'Casablanca',
    contractType: 'CDI',
    technologies: ['PHP', 'Laravel', 'MySQL'],
    description: 'Nous recherchons un developpeur Backend PHP Laravel avec experience sur MySQL et Docker',
    source: 'LinkedIn'
  };

  it('should match a single job', () => {
    const result = matchSingleJob(mockJob, mockProfile);
    expect(result.matchScore).toBeDefined();
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.matchLabel).toBeDefined();
    expect(result.matchReasons).toBeDefined();
    expect(Array.isArray(result.matchReasons)).toBe(true);
  });

  it('should give high score for matching job', () => {
    const result = matchSingleJob(mockJob, mockProfile);
    expect(result.matchScore).toBeGreaterThanOrEqual(70);
  });

  it('should give lower score for non-matching job', () => {
    const nonMatchingJob = {
      title: 'Data Scientist Python',
      company: 'DataInc',
      location: 'Paris',
      contractType: 'CDD',
      technologies: ['Python', 'TensorFlow', 'PyTorch'],
      description: 'Data Scientist avec experience Python et Machine Learning',
      source: 'Indeed'
    };
    const result = matchSingleJob(nonMatchingJob, mockProfile);
    expect(result.matchScore).toBeLessThan(60);
  });

  it('should match multiple jobs and sort by score', () => {
    const jobs = [
      { ...mockJob, title: 'Senior Java Developer' },
      { ...mockJob, title: 'Backend PHP Developer' },
      { ...mockJob, title: 'Frontend React Developer' }
    ];
    const matched = matchJobs(jobs, mockProfile);
    expect(matched.length).toBe(3);
    expect(matched[0].matchScore).toBeGreaterThanOrEqual(matched[1].matchScore);
  });

  it('should generate match summary', () => {
    const jobs = [mockJob, { ...mockJob, title: 'Different Job' }];
    const matched = matchJobs(jobs, mockProfile);
    const summary = getMatchSummary(matched);
    expect(summary.total).toBe(2);
    expect(summary.topMatches.length).toBeGreaterThan(0);
  });

  it('should handle job with no technologies', () => {
    const jobNoTech = {
      title: 'Developer',
      company: 'Test',
      location: 'Remote',
      description: 'Developer needed'
    };
    const result = matchSingleJob(jobNoTech, mockProfile);
    expect(result.matchScore).toBeDefined();
  });

  it('should handle empty profile', () => {
    const result = matchSingleJob(mockJob, null);
    expect(result.matchScore).toBeDefined();
  });
});

describe('SCORE_LABELS', () => {
  it('should have score ranges', () => {
    expect(SCORE_LABELS.length).toBeGreaterThan(0);
    expect(SCORE_LABELS[0].min).toBe(90);
    expect(SCORE_LABELS[SCORE_LABELS.length - 1].max).toBe(49);
  });
});
