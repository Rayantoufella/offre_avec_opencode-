import { describe, it, expect } from 'vitest';
import { extractJobTitleFromPost, SITE_CONFIG } from '../scripts/research/linkedin-search.js';

describe('linkedin-search', () => {
  describe('SITE_CONFIG', () => {
    it('should have correct name', () => {
      expect(SITE_CONFIG.name).toBe('LinkedIn');
    });

    it('should have correct base URL', () => {
      expect(SITE_CONFIG.baseUrl).toBe('https://www.linkedin.com');
    });

    it('should have all required features', () => {
      expect(SITE_CONFIG.features).toContain('search');
      expect(SITE_CONFIG.features).toContain('scroll');
      expect(SITE_CONFIG.features).toContain('groups');
      expect(SITE_CONFIG.features).toContain('company_pages');
      expect(SITE_CONFIG.features).toContain('feed');
      expect(SITE_CONFIG.features).toContain('people');
      expect(SITE_CONFIG.features).toContain('messages');
    });
  });

  describe('extractJobTitleFromPost', () => {
    it('should extract first line as title', () => {
      const text = 'Backend Developer at TechCorp\nWe are hiring...\nApply now';
      const title = extractJobTitleFromPost(text);
      expect(title).toBe('Backend Developer at TechCorp');
    });

    it('should handle empty text', () => {
      const title = extractJobTitleFromPost('');
      expect(title).toBe('');
    });

    it('should handle null text', () => {
      const title = extractJobTitleFromPost(null);
      expect(title).toBe('');
    });

    it('should handle single line text', () => {
      const title = extractJobTitleFromPost('Frontend Developer');
      expect(title).toBe('Frontend Developer');
    });

    it('should truncate long titles to 100 chars', () => {
      const longTitle = 'A'.repeat(150);
      const title = extractJobTitleFromPost(longTitle);
      expect(title.length).toBe(100);
    });

    it('should skip empty lines', () => {
      const text = '\n\nBackend Developer\n\nMore info';
      const title = extractJobTitleFromPost(text);
      expect(title).toBe('Backend Developer');
    });
  });
});
