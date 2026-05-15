import { describe, expect, it } from 'vitest';
import { passGen, VERSION_DICT } from './core.js';

const LIMITED_CHARSET = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='.split('')
);

describe('passGen', () => {
  it('matches known deterministic vectors across modes', async () => {
    await expect(passGen('mysupersecretpassword', 'github/work', 0, 20, 'V.1')).resolves.toBe('LDXfdUT6X7Ucm8nEQEfg');
    await expect(passGen('mysupersecretpassword', 'github/work', 1, 20, 'V.1')).resolves.toBe('EH&SCMEYN~9Gl7hKu6$L');
    await expect(passGen('mysupersecretpassword', 'github/work', 2, 20, 'V.1')).resolves.toBe('S1)P&wtDCdXA#)_lNCy7');
  });

  it('is deterministic for identical inputs', async () => {
    const input = ['correct horse battery staple', 'user@example.com', 2, 32, 'V.15'];
    const a = await passGen(...input);
    const b = await passGen(...input);
    expect(a).toBe(b);
  });

  it('respects requested output lengths', async () => {
    const lengths = [8, 10, 15, 20, 32, 40];
    for (const length of lengths) {
      const out = await passGen('alpha', 'beta', 2, length, 'V.2');
      expect(out).toHaveLength(length);
    }
  });

  it('limited mode stays inside the limited charset', async () => {
    const out = await passGen('alpha', 'beta', 2, 128, 'V.10');
    expect([...out].every((ch) => LIMITED_CHARSET.has(ch))).toBe(true);
  });

  it('base64-safe mode excludes plus and slash', async () => {
    const out = await passGen('alpha', 'beta', 0, 128, 'V.10');
    expect(out.includes('+')).toBe(false);
    expect(out.includes('/')).toBe(false);
  });

  it('version changes produce different passwords', async () => {
    const v1 = await passGen('alpha', 'beta', 2, 20, 'V.1');
    const v15 = await passGen('alpha', 'beta', 2, 20, 'V.15');
    expect(v1).not.toBe(v15);
  });

  it('exposes expected version keys', () => {
    expect(VERSION_DICT['V.1']).toBe(64);
    expect(VERSION_DICT['V.15']).toBe(8192);
  });
});
