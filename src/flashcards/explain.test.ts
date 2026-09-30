import { describe, expect, it } from 'vitest';
import { sentencesOf } from '../audio/sound';
import { explainedNote, explanationBlocks, paragraphsOf } from './explain';

describe('explanations', () => {
  it('splits into paragraphs, one per line', () => {
    expect(paragraphsOf('First.\n\n  Second.  \nThird.')).toEqual(['First.', 'Second.', 'Third.']);
  });

  it('keeps runs of equations together, like a truth table', () => {
    const blocks = explanationBlocks('An AND gate needs both.\n0 AND 0 = 0\n0 AND 1 = 0\n1 AND 1 = 1\nLike two switches.');
    expect(blocks).toEqual([
      { kind: 'text', text: 'An AND gate needs both.' },
      { kind: 'equations', rows: ['0 AND 0 = 0', '0 AND 1 = 0', '1 AND 1 = 1'] },
      { kind: 'text', text: 'Like two switches.' },
    ]);
  });

  it('leaves long sentences with an equals sign as text', () => {
    expect(explanationBlocks('All your fingers and toes: 10 + 10 = 20.')).toEqual([
      { kind: 'text', text: 'All your fingers and toes: 10 + 10 = 20.' },
    ]);
  });

  it('notes how many cards are explained', () => {
    expect(explainedNote([{ explain: 'a' }, { explain: 'b' }])).toBe('How it works on every card');
    expect(explainedNote([{ explain: 'a' }, {}, { explain: 'b' }])).toBe('How it works on 2 cards');
    expect(explainedNote([{}, {}])).toBeNull();
  });

  it('reads aloud a sentence at a time', () => {
    expect(sentencesOf('Binary uses 0 and 1. Is 3.5 a number? Yes!\n0 AND 1 = 0')).toEqual([
      'Binary uses 0 and 1.',
      'Is 3.5 a number?',
      'Yes!',
      '0 AND 1 = 0',
    ]);
  });
});
