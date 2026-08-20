import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  appendRow, getStats, ensureFile, calculateFollowUpDate,
  formatDateFR, getDefaultFilePath, TRACKING_COLUMNS
} from '../scripts/tracking/tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_FILE = path.resolve(__dirname, '../data/test_suivi.xlsx');

beforeAll(() => {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
  const testDir = path.dirname(TEST_FILE);
  const backupFiles = fs.readdirSync(testDir).filter(f => f.includes('test_suivi'));
  backupFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
});

describe('tracker', () => {
  describe('formatDateFR', () => {
    it('should format date as DD/MM/YYYY', () => {
      const d = new Date(2026, 7, 20);
      expect(formatDateFR(d)).toBe('20/08/2026');
    });

    it('should handle string dates', () => {
      expect(formatDateFR('2026-01-15')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('calculateFollowUpDate', () => {
    it('should add 7 days by default', () => {
      const d = new Date(2026, 7, 20);
      const followUp = calculateFollowUpDate(d);
      expect(followUp.getDate()).toBe(27);
      expect(followUp.getMonth()).toBe(7);
    });

    it('should add custom days', () => {
      const d = new Date(2026, 7, 20);
      const followUp = calculateFollowUpDate(d, 14);
      expect(followUp.getDate()).toBe(3);
      expect(followUp.getMonth()).toBe(8);
    });

    it('should handle string dates', () => {
      const followUp = calculateFollowUpDate('2026-08-20', 7);
      expect(followUp).toBeInstanceOf(Date);
    });
  });

  describe('TRACKING_COLUMNS', () => {
    it('should have 7 columns', () => {
      expect(TRACKING_COLUMNS.length).toBe(7);
    });

    it('should have required keys', () => {
      const keys = TRACKING_COLUMNS.map(c => c.key);
      expect(keys).toContain('entreprise');
      expect(keys).toContain('poste');
      expect(keys).toContain('lien_offre');
      expect(keys).toContain('recruteur_email');
      expect(keys).toContain('date_envoi');
      expect(keys).toContain('lien_entreprise');
      expect(keys).toContain('notes');
    });
  });

  describe('ensureFile', () => {
    it('should create file if it does not exist', async () => {
      const filePath = await ensureFile(TEST_FILE);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should not recreate if file exists', async () => {
      const mtime1 = fs.statSync(TEST_FILE).mtimeMs;
      await ensureFile(TEST_FILE);
      const mtime2 = fs.statSync(TEST_FILE).mtimeMs;
      expect(mtime1).toBe(mtime2);
    });
  });

  describe('appendRow', () => {
    it('should append a row to the file', async () => {
      const result = await appendRow({
        entreprise: 'TechCorp',
        post: 'Backend PHP Laravel',
        url_offre: 'https://example.com/job/1',
        email: 'hr@techcorp.com',
        notes: 'CDI Laravel'
      }, TEST_FILE);

      expect(result.appended).toBe(true);
      expect(result.dateEnvoi).toBeDefined();
      expect(result.relanceDate).toBeDefined();
    });

    it('should not duplicate same entry on same day', async () => {
      const result = await appendRow({
        entreprise: 'TechCorp',
        post: 'Backend PHP Laravel',
        url_offre: 'https://example.com/job/1',
        email: 'hr@techcorp.com'
      }, TEST_FILE);

      expect(result.appended).toBe(false);
      expect(result.reason).toBe('duplicate');
    });

    it('should allow different entries', async () => {
      const result = await appendRow({
        entreprise: 'StartupAI',
        post: 'Frontend React',
        url_offre: 'https://example.com/job/2',
        email: 'jobs@startupai.com'
      }, TEST_FILE);

      expect(result.appended).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      const stats = await getStats(TEST_FILE);
      expect(stats.total).toBe(2);
      expect(stats.entries.length).toBe(2);
      expect(stats.entries[0].entreprise).toBe('TechCorp');
    });

    it('should handle non-existent file', async () => {
      const stats = await getStats('/nonexistent/file.xlsx');
      expect(stats.total).toBe(0);
    });
  });

  describe('getDefaultFilePath', () => {
    it('should return a valid path', () => {
      const filePath = getDefaultFilePath();
      expect(filePath).toContain('suivi_candidatures.xlsx');
    });
  });
});
