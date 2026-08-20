import { describe, it, expect } from 'vitest';
import { generateEmail, detectDomain, detectContractType } from '../scripts/gmail/email-generator.js';

describe('email-generator', () => {
  const baseOffer = {
    email: 'recruteur@exemple.com',
    entreprise: 'Acme Corp',
    poste: 'Developpeur Full Stack',
    type: '',
    objet: '',
    description: ''
  };

  it('should generate email with all required fields', () => {
    const email = generateEmail(baseOffer);
    expect(email.to).toBe('recruteur@exemple.com');
    expect(email.subject).toBeTruthy();
    expect(email.body).toBeTruthy();
    expect(email.entreprise).toBe('Acme Corp');
    expect(email.poste).toBe('Developpeur Full Stack');
  });

  it('should use provided subject when available', () => {
    const offer = { ...baseOffer, objet: 'Ma candidature' };
    const email = generateEmail(offer);
    expect(email.subject).toBe('Ma candidature');
  });

  it('should generate subject from template when not provided', () => {
    const email = generateEmail(baseOffer);
    expect(email.subject).toContain('Developpeur Full Stack');
  });

  it('should detect stage type', () => {
    const offer = { ...baseOffer, type: 'Stage' };
    const email = generateEmail(offer);
    expect(email.type).toBe('stage');
  });

  it('should detect alternance type', () => {
    const offer = { ...baseOffer, type: 'Alternance' };
    const email = generateEmail(offer);
    expect(email.type).toBe('alternance');
  });

  it('should detect CDI type', () => {
    const offer = { ...baseOffer, type: 'CDI' };
    const email = generateEmail(offer);
    expect(email.type).toBe('cdi');
  });

  it('should use formal French greeting', () => {
    const email = generateEmail(baseOffer);
    expect(email.body).toContain('Madame, Monsieur');
  });

  it('should include company name in body', () => {
    const email = generateEmail(baseOffer);
    expect(email.body).toContain('Acme Corp');
  });

  it('should include position in body', () => {
    const email = generateEmail(baseOffer);
    expect(email.body).toContain('Developpeur Full Stack');
  });

  it('should handle missing company gracefully', () => {
    const offer = { ...baseOffer, entreprise: '' };
    const email = generateEmail(offer);
    expect(email.body).toContain('votre entreprise');
  });

  it('should handle missing position gracefully', () => {
    const offer = { ...baseOffer, poste: '' };
    const email = generateEmail(offer);
    expect(email.body).toContain('ce poste');
  });

  it('should detect backend domain from Laravel job', () => {
    const offer = { ...baseOffer, poste: 'Backend Laravel PHP', description: 'API REST MySQL' };
    const domain = detectDomain(offer);
    expect(domain).toBe('backend');
  });

  it('should detect frontend domain from React job', () => {
    const offer = { ...baseOffer, poste: 'Frontend React', description: 'UI CSS JavaScript' };
    const domain = detectDomain(offer);
    expect(domain).toBe('frontend');
  });

  it('should include draft metadata', () => {
    const email = generateEmail(baseOffer);
    expect(email.draft).toBeDefined();
    expect(email.draft.metadata).toBeDefined();
    expect(email.draft.metadata.domain).toBeDefined();
    expect(email.draft.metadata.contract).toBeDefined();
  });
});
