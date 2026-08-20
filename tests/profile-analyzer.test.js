import { describe, it, expect } from 'vitest';
import {
  analyzeProfile, profileToSearchTerms,
  TECH_CATEGORIES, SENIORITY_KEYWORDS, CONTRACT_KEYWORDS, WORK_MODE_KEYWORDS
} from '../scripts/deep-research/profile-analyzer.js';

describe('profile-analyzer', () => {
  const sampleCvData = {
    nom: 'Toufella',
    prenom: 'Rayan',
    email: 'rayan@test.com',
    telephone: '+212600000000',
    text: 'Développeur Backend PHP Laravel MySQL Docker. Junior. Casablanca. 2 ans d\'expérience.',
    competences: ['PHP', 'Laravel', 'MySQL'],
    formation: 'Formation Simplon'
  };

  describe('analyzeProfile', () => {
    it('should extract competences from CV text', () => {
      const profile = analyzeProfile(sampleCvData);
      expect(profile.competences).toContain('PHP');
      expect(profile.competences).toContain('Laravel');
      expect(profile.competences).toContain('MySQL');
    });

    it('should detect seniority', () => {
      const profile = analyzeProfile(sampleCvData);
      expect(profile.experience).toBe('Junior');
    });

    it('should detect location', () => {
      const profile = analyzeProfile(sampleCvData);
      expect(profile.localisation).toBe('Casablanca');
    });

    it('should extract categories', () => {
      const profile = analyzeProfile(sampleCvData);
      expect(profile.categories).toContain('Backend');
    });

    it('should handle empty CV data', () => {
      const profile = analyzeProfile({});
      expect(profile.nom).toBe('');
      expect(profile.competences).toBeDefined();
    });

    it('should extract preferences from user request', () => {
      const profile = analyzeProfile(sampleCvData, 'Backend Laravel CDI Casablanca');
      expect(profile.preferences.contract).toBe('CDI');
      expect(profile.preferences.location).toBe('Casablanca');
    });
  });

  describe('profileToSearchTerms', () => {
    it('should generate search terms from profile', () => {
      const profile = analyzeProfile(sampleCvData);
      const terms = profileToSearchTerms(profile);
      expect(terms.length).toBeGreaterThan(0);
      expect(terms).toContain('PHP');
    });

    it('should include experience level', () => {
      const profile = analyzeProfile(sampleCvData);
      const terms = profileToSearchTerms(profile);
      expect(terms).toContain('Junior');
    });

    it('should limit competences to 5', () => {
      const cvData = {
        ...sampleCvData,
        competences: ['PHP', 'Laravel', 'MySQL', 'Docker', 'Git', 'React', 'Vue.js']
      };
      const profile = analyzeProfile(cvData);
      const terms = profileToSearchTerms(profile);
      const techTerms = terms.filter(t => !['Junior', 'Mid', 'Senior'].includes(t));
      expect(techTerms.length).toBeLessThanOrEqual(5);
    });
  });

  describe('constants', () => {
    it('should have TECH_CATEGORIES', () => {
      expect(TECH_CATEGORIES.Backend).toContain('PHP');
      expect(TECH_CATEGORIES.Frontend).toContain('React');
    });

    it('should have SENIORITY_KEYWORDS', () => {
      expect(SENIORITY_KEYWORDS.Junior).toContain('junior');
      expect(SENIORITY_KEYWORDS.Senior).toContain('senior');
    });

    it('should have CONTRACT_KEYWORDS', () => {
      expect(CONTRACT_KEYWORDS.CDI).toContain('cdi');
      expect(CONTRACT_KEYWORDS.Stage).toContain('stage');
    });

    it('should have WORK_MODE_KEYWORDS', () => {
      expect(WORK_MODE_KEYWORDS.Remote).toContain('remote');
      expect(WORK_MODE_KEYWORDS.Hybride).toContain('hybride');
    });
  });
});
