import { describe, it, expect } from 'vitest';

describe('workflow', () => {
  it('should export runWorkflow function', async () => {
    const mod = await import('../scripts/workflow/orchestrator.js');
    expect(typeof mod.runWorkflow).toBe('function');
    expect(typeof mod.startUploadServer).toBe('function');
    expect(typeof mod.stopUploadServer).toBe('function');
  });

  it('should have dry-run script', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const scriptPath = path.default.join(process.cwd(), 'scripts', 'workflow', 'dry-run.js');
    expect(fs.default.existsSync(scriptPath)).toBe(true);
  });

  it('should have test-one script', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const scriptPath = path.default.join(process.cwd(), 'scripts', 'workflow', 'test-one.js');
    expect(fs.default.existsSync(scriptPath)).toBe(true);
  });
});
