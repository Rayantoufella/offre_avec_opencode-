import { describe, it, expect } from 'vitest';
import { validateOffer, filterValidOffers, getOfferSummary } from '../scripts/validation/offer-validator.js';

describe('offer-validator', () => {
  const validOffer = {
    email: 'test@example.com',
    entreprise: 'Test Corp',
    poste: 'Dev',
    url: 'https://example.com',
    description: 'Offre test'
  };

  it('should validate a complete offer', () => {
    const result = validateOffer(validOffer);
    expect(result.status).toBe('VALID');
    expect(result.errors).toHaveLength(0);
  });

  it('should reject offer without email', () => {
    const offer = { ...validOffer, email: '' };
    const result = validateOffer(offer);
    expect(result.status).toBe('SKIP');
    expect(result.errors.some(e => e.includes('Email'))).toBe(true);
  });

  it('should reject invalid email', () => {
    const offer = { ...validOffer, email: 'not-an-email' };
    const result = validateOffer(offer);
    expect(result.status).toBe('SKIP');
  });

  it('should mark as incomplete when company missing', () => {
    const offer = { ...validOffer, entreprise: '' };
    const result = validateOffer(offer);
    expect(result.status).toBe('INCOMPLETE');
  });

  it('should mark as incomplete when position missing', () => {
    const offer = { ...validOffer, poste: '' };
    const result = validateOffer(offer);
    expect(result.status).toBe('INCOMPLETE');
  });

  it('should trim whitespace', () => {
    const offer = { ...validOffer, email: '  test@example.com  ' };
    const result = validateOffer(offer);
    expect(result.offer.email).toBe('test@example.com');
  });

  it('should filter valid offers from array', () => {
    const offers = [
      { row: 1, status: 'VALID', data: validOffer },
      { row: 2, status: 'SKIP', data: {} },
      { row: 3, status: 'VALID', data: validOffer }
    ];
    const valid = filterValidOffers(offers);
    expect(valid).toHaveLength(2);
  });

  it('should generate summary', () => {
    const results = [
      { status: 'VALID' },
      { status: 'VALID' },
      { status: 'INCOMPLETE', reason: 'test' },
      { status: 'SKIP', reason: 'no email' }
    ];
    const summary = getOfferSummary(results);
    expect(summary.total).toBe(4);
    expect(summary.valid).toBe(2);
    expect(summary.incomplete).toBe(1);
    expect(summary.skip).toBe(1);
    expect(summary.issues).toHaveLength(2);
  });
});
