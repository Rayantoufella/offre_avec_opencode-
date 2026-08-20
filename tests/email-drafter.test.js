import { describe, it, expect } from 'vitest';
import {
  generateDraft, generateBatchDrafts, CANDIDAT, DOMAINS,
  detectDomain, detectContractType, matchProjects
} from '../scripts/gmail/email-drafter.js';

describe('email-drafter', () => {
  describe('detectDomain', () => {
    it('should detect backend domain', () => {
      const offer = { Poste: 'Développeur Backend PHP Laravel', Technologies: 'PHP, Laravel, MySQL' };
      expect(detectDomain(offer)).toBe('backend');
    });

    it('should detect frontend domain', () => {
      const offer = { Poste: 'Développeur Frontend React', Technologies: 'React, TypeScript, CSS' };
      expect(detectDomain(offer)).toBe('frontend');
    });

    it('should detect fullstack domain', () => {
      const offer = { Poste: 'Fullstack React Laravel', Technologies: 'React, PHP, Laravel' };
      expect(detectDomain(offer)).toBe('fullstack');
    });

    it('should detect devops domain', () => {
      const offer = { Poste: 'Ingénieur DevOps', Technologies: 'Docker, Kubernetes, AWS, CI/CD' };
      expect(detectDomain(offer)).toBe('devops');
    });

    it('should default to backend when unclear', () => {
      const offer = { Poste: 'Manager' };
      expect(detectDomain(offer)).toBe('backend');
    });
  });

  describe('detectContractType', () => {
    it('should detect CDI', () => {
      expect(detectContractType({ Type_offre: 'CDI' })).toBe('cdi');
    });

    it('should detect stage', () => {
      expect(detectContractType({ Type_offre: 'Stage' })).toBe('stage');
    });

    it('should detect alternance', () => {
      expect(detectContractType({ Type_offre: 'Alternance' })).toBe('alternance');
    });

    it('should detect freelance', () => {
      expect(detectContractType({ Type_offre: 'Freelance' })).toBe('freelance');
    });

    it('should default to CDI', () => {
      expect(detectContractType({})).toBe('cdi');
    });

    it('should detect contract type in description', () => {
      expect(detectContractType({ Description: 'Poste en CDD pour 6 mois' })).toBe('cdd');
    });
  });

  describe('matchProjects', () => {
    it('should match Laravel projects', () => {
      const projects = matchProjects(['php', 'laravel', 'mysql']);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].score).toBeGreaterThan(0);
    });

    it('should return max 2 projects', () => {
      const projects = matchProjects(['php', 'laravel', 'vue', 'react', 'docker']);
      expect(projects.length).toBeLessThanOrEqual(2);
    });

    it('should sort by score descending', () => {
      const projects = matchProjects(['php', 'laravel']);
      if (projects.length >= 2) {
        expect(projects[0].score).toBeGreaterThanOrEqual(projects[1].score);
      }
    });
  });

  describe('generateDraft', () => {
    it('should generate a draft with all fields', () => {
      const offer = {
        Email: 'hr@test.com',
        Entreprise: 'TechCorp',
        Poste: 'Backend PHP Laravel',
        Type_offre: 'CDI',
        Technologies: 'PHP, Laravel, MySQL'
      };
      const draft = generateDraft(offer);
      expect(draft.to).toBe('hr@test.com');
      expect(draft.subject).toContain('Backend PHP Laravel');
      expect(draft.body).toContain('TechCorp');
      expect(draft.body).toContain('Backend PHP Laravel');
      expect(draft.metadata.domain).toBe('backend');
      expect(draft.metadata.contract).toBe('cdi');
    });

    it('should use default values when fields missing', () => {
      const offer = {};
      const draft = generateDraft(offer);
      expect(draft.body).toContain('votre entreprise');
    });

    it('should personalize for stage contract', () => {
      const offer = {
        Entreprise: 'StartupAI',
        Poste: 'Dev Backend',
        Type_offre: 'Stage'
      };
      const draft = generateDraft(offer);
      expect(draft.subject).toContain('stage');
      expect(draft.body).toContain('stage');
    });
  });

  describe('generateBatchDrafts', () => {
    it('should generate drafts for multiple offers', () => {
      const offers = [
        { Email: 'a@test.com', Entreprise: 'A', Poste: 'Backend' },
        { Email: 'b@test.com', Entreprise: 'B', Poste: 'Frontend' }
      ];
      const results = generateBatchDrafts(offers);
      expect(results).toHaveLength(2);
      expect(results[0].draft).toBeDefined();
      expect(results[1].draft).toBeDefined();
    });
  });

  describe('CANDIDAT', () => {
    it('should have candidate info', () => {
      expect(CANDIDAT.nom).toBe('Toufella');
      expect(CANDIDAT.prenom).toBe('Rayan');
      expect(CANDIDAT.competences.length).toBeGreaterThan(0);
      expect(CANDIDAT.projets.length).toBeGreaterThan(0);
    });
  });
});
