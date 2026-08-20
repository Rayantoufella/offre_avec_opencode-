import { describe, it, expect } from 'vitest';
import { createResearchPlan, formatPlanForDisplay, SOURCE_TYPES } from '../scripts/deep-research/research-planner.js';

describe('research-planner', () => {
  const mockProfile = {
    competences: ['PHP', 'Laravel', 'MySQL', 'Docker', 'JavaScript'],
    categories: ['Backend', 'Frontend'],
    experience: 'Junior',
    localisation: 'Agadir',
    targetRoles: ['Backend Developer'],
    preferences: { location: 'Casablanca', contract: 'CDI' }
  };

  it('should create a research plan', () => {
    const plan = createResearchPlan(mockProfile, 'Backend Laravel Maroc');
    expect(plan.keywords.length).toBeGreaterThan(0);
    expect(plan.locations.length).toBeGreaterThan(0);
    expect(plan.sources.length).toBeGreaterThan(0);
    expect(plan.queries.length).toBeGreaterThan(0);
    expect(plan.strategy).toBeDefined();
  });

  it('should generate keywords from profile', () => {
    const plan = createResearchPlan(mockProfile, '');
    expect(plan.keywords).toContain('PHP');
    expect(plan.keywords).toContain('Laravel');
  });

  it('should extract locations from request', () => {
    const plan = createResearchPlan(mockProfile, 'Backend Laravel Casablanca');
    expect(plan.locations).toContain('Casablanca');
  });

  it('should select sources based on request', () => {
    const plan = createResearchPlan(mockProfile, 'LinkedIn Backend');
    expect(plan.sources.some(s => s.name === 'LinkedIn')).toBe(true);
  });

  it('should generate queries', () => {
    const plan = createResearchPlan(mockProfile, 'Backend Laravel Maroc');
    expect(plan.queries.length).toBeGreaterThan(0);
    expect(plan.queries.some(q => q.includes('PHP') || q.includes('Laravel'))).toBe(true);
  });

  it('should format plan for display', () => {
    const plan = createResearchPlan(mockProfile, 'Backend Laravel Maroc');
    const display = formatPlanForDisplay(plan);
    expect(display).toContain('PLAN DE RECHERCHE');
    expect(display).toContain('Mots-cles');
    expect(display).toContain('Localisations');
  });

  it('should determine strategy', () => {
    const plan = createResearchPlan(mockProfile, 'LinkedIn Indeed Backend');
    expect(plan.strategy).toBe('multi_platform');
  });

  it('should handle empty profile', () => {
    const plan = createResearchPlan(null, 'Backend Laravel');
    expect(plan.keywords.length).toBeGreaterThan(0);
    expect(plan.locations.length).toBeGreaterThan(0);
  });
});

describe('SOURCE_TYPES', () => {
  it('should have LinkedIn source', () => {
    expect(SOURCE_TYPES.LINKEDIN).toBeDefined();
    expect(SOURCE_TYPES.LINKEDIN.requiresAuth).toBe(true);
  });

  it('should have Indeed source', () => {
    expect(SOURCE_TYPES.INDEED).toBeDefined();
    expect(SOURCE_TYPES.INDEED.requiresAuth).toBe(false);
  });
});
