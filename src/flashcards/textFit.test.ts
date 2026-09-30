import { describe, expect, it } from 'vitest';
import { fitStyle, splitRanges, unbreakableParts, widestPartEm } from './textFit';

describe('text fitting', () => {
  it('only lets lines break between words and after hyphens', () => {
    expect(unbreakableParts('Magnifying glass')).toEqual(['Magnifying', 'glass']);
    expect(unbreakableParts('Cock-a-doodle-doo')).toEqual(['Cock-', 'a-', 'doodle-', 'doo']);
    expect(unbreakableParts('  Wednesday ')).toEqual(['Wednesday']);
  });

  it('keeps number ranges whole', () => {
    expect(unbreakableParts('Numbers 0-10')).toEqual(['Numbers', '0-10']);
    expect(unbreakableParts('Ages 2-5 read-aloud')).toEqual(['Ages', '2-5', 'read-', 'aloud']);
    expect(splitRanges('Numbers 11-20 and 1-2-3')).toEqual(['Numbers ', '11-20', ' and ', '1-2-3']);
    expect(splitRanges('Farm animals')).toEqual(['Farm animals']);
  });

  it('sizes by the widest word', () => {
    expect(widestPartEm('Rectangular prism')).toBeCloseTo(widestPartEm('Rectangular'));
    expect(widestPartEm('Wednesday')).toBeGreaterThan(widestPartEm('Wed'));
    expect(fitStyle('Wed')).toHaveProperty('--fit-em');
  });
});
