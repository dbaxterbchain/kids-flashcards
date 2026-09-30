import { describe, expect, it } from 'vitest';
import { slugifySetName } from './fileUtils';

describe('slugifySetName', () => {
  it('makes readable ids from set names in any language', () => {
    expect(slugifySetName('  My Family  ')).toBe('my-family');
    expect(slugifySetName('Números y más')).toBe('numeros-y-mas');
    expect(slugifySetName('Spanish: animals')).toBe('spanish-animals');
    expect(slugifySetName('家族')).toBe('家族');
  });

  it('falls back to a default when nothing is left', () => {
    expect(slugifySetName('!!!')).toBe('custom-set');
    expect(slugifySetName('🐶')).toBe('custom-set');
  });
});
