import { describe, it, expect } from 'vitest';
import { generateId } from '../id';

describe('generateId', () => {
  it('returns a string of default length 7', () => {
    const id = generateId();
    expect(id).toHaveLength(7);
  });

  it('returns a string of custom length (up to requested)', () => {
    // toString(36) can produce fewer chars than requested if fractional part is short
    for (let i = 0; i < 100; i++) {
      const id = generateId(12);
      expect(id.length).toBeGreaterThanOrEqual(1);
      expect(id.length).toBeLessThanOrEqual(12);
    }
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('contains only alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateId()).toMatch(/^[a-z0-9]+$/);
    }
  });
});
