import { describe, expect, it } from 'vitest';
import { fitStyle, unbreakableParts, widestPartEm } from './textFit';

describe('text fitting', () => {
  it('only lets lines break between words and after hyphens', () => {
    expect(unbreakableParts('Magnifying glass')).toEqual(['Magnifying', 'glass']);
    expect(unbreakableParts('Cock-a-doodle-doo')).toEqual(['Cock-', 'a-', 'doodle-', 'doo']);
    expect(unbreakableParts('  Wednesday ')).toEqual(['Wednesday']);
  });

  it('sizes by the widest word', () => {
    expect(widestPartEm('Rectangular prism')).toBeCloseTo(widestPartEm('Rectangular'));
    expect(widestPartEm('Wednesday')).toBeGreaterThan(widestPartEm('Wed'));
    expect(fitStyle('Wed')).toHaveProperty('--fit-em');
  });
});
