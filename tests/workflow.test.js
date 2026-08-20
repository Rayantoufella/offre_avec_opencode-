import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('workflow', () => {
  it('should have orchestrator script', () => {
    expect(fs.existsSync('scripts/workflow/orchestrator.js')).toBe(true);
  });

  it('should have dry-run script', () => {
    expect(fs.existsSync('scripts/workflow/dry-run.js')).toBe(true);
  });

  it('should have test-one script', () => {
    expect(fs.existsSync('scripts/workflow/test-one.js')).toBe(true);
  });
});