import { describe, it, expect } from 'vitest';

describe('upload client', () => {
  it('should export required functions', async () => {
    const mod = await import('../scripts/upload/client.js');
    expect(typeof mod.checkStatus).toBe('function');
    expect(typeof mod.upload).toBe('function');
    expect(typeof mod.testUpload).toBe('function');
    expect(typeof mod.createClient).toBe('function');
  });

  it('should create client with custom URL', async () => {
    const mod = await import('../scripts/upload/client.js');
    const client = mod.createClient('http://localhost:9999');
    expect(client.checkStatus).toBeDefined();
    expect(client.upload).toBeDefined();
    expect(client.testUpload).toBeDefined();
    expect(typeof client.destroy).toBe('function');
    client.destroy();
  });
});
