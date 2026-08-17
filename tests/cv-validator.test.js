import { describe, it, expect } from 'vitest';
import { validateCV } from '../scripts/validation/cv-validator.js';
import fs from 'fs';
import path from 'path';

describe('cv-validator', () => {
  const testPdf = path.join(process.cwd(), 'tests', 'test-cv.pdf');

  it('should reject missing file', () => {
    const result = validateCV('/nonexistent/file.pdf');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('introuvable');
  });

  it('should reject non-PDF files', () => {
    const result = validateCV('test.txt');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalide');
  });

  it('should reject null path', () => {
    const result = validateCV(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('non fourni');
  });

  it('should reject empty string', () => {
    const result = validateCV('');
    expect(result.valid).toBe(false);
  });

  it('should accept valid PDF if it exists', () => {
    if (fs.existsSync(testPdf)) {
      const result = validateCV(testPdf);
      expect(result.valid).toBe(true);
      expect(result.extension).toBe('.pdf');
      expect(result.readable).toBe(true);
    }
  });

  it('should reject empty PDF', () => {
    const emptyPdf = path.join(process.cwd(), 'tests', 'empty.pdf');
    if (!fs.existsSync(emptyPdf)) {
      fs.writeFileSync(emptyPdf, '');
    }
    const result = validateCV(emptyPdf);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('vide');
    fs.unlinkSync(emptyPdf);
  });

  it('should return size info for valid files', () => {
    if (fs.existsSync(testPdf)) {
      const result = validateCV(testPdf);
      expect(result.size).toBeGreaterThan(0);
    }
  });
});
