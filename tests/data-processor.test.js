import { describe, it, expect } from 'vitest';
import { processRawJobs, processSingleJob, detectApplicationType, cleanText } from '../scripts/deep-research/data-processor.js';

describe('data-processor', () => {
  const mockRawJobs = [
    {
      title: 'Backend PHP Developer',
      company: 'TechCorp',
      location: 'Casablanca',
      description: 'We are looking for a PHP developer with Laravel experience',
      source: 'LinkedIn',
      link: 'https://linkedin.com/jobs/123',
      technologies: ['PHP', 'Laravel', 'MySQL']
    },
    {
      title: '',
      company: 'Unknown',
      source: 'Indeed'
    },
    {
      title: 'Frontend Developer',
      company: 'WebInc',
      location: 'Rabat',
      email: 'hr@webinc.com',
      source: 'Company Career'
    }
  ];

  it('should process raw jobs', () => {
    const result = processRawJobs(mockRawJobs);
    expect(result.processed.length).toBeGreaterThan(0);
    expect(result.rejected.length).toBeGreaterThan(0);
    expect(result.stats.total).toBe(3);
  });

  it('should process single valid job', () => {
    const result = processSingleJob(mockRawJobs[0]);
    expect(result.valid).toBe(true);
    expect(result.job.title).toBe('Backend PHP Developer');
    expect(result.job.company).toBe('TechCorp');
    expect(result.job.technologies).toContain('PHP');
  });

  it('should reject job without title', () => {
    const result = processSingleJob(mockRawJobs[1]);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Missing title');
  });

  it('should clean text', () => {
    expect(cleanText('  Hello   World  ')).toBe('Hello World');
    expect(cleanText('Line1\nLine2')).toBe('Line1 Line2');
    expect(cleanText('')).toBe('');
    expect(cleanText(null)).toBe('');
  });

  it('should detect application type EMAIL', () => {
    const raw = { email: 'hr@company.com' };
    expect(detectApplicationType(raw)).toBe('EMAIL');
  });

  it('should detect application type LINKEDIN', () => {
    const raw = { link: 'https://linkedin.com/jobs/123', source: 'LinkedIn' };
    expect(detectApplicationType(raw)).toBe('LINKEDIN');
  });

  it('should detect application type UNKNOWN', () => {
    const raw = {};
    expect(detectApplicationType(raw)).toBe('UNKNOWN');
  });

  it('should extract technologies from multiple fields', () => {
    const raw = {
      title: 'PHP Developer',
      technologies: 'PHP, Laravel',
      stack: 'MySQL, Docker'
    };
    const result = processSingleJob(raw);
    expect(result.job.technologies.length).toBeGreaterThan(0);
  });
});
