// "How it works" explanations on cards, and "How this set works" introductions on sets.

/** Splits an explanation into its paragraphs (one per line). */
export const paragraphsOf = (text: string) =>
  text
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export type ExplanationBlock = { kind: 'text'; text: string } | { kind: 'equations'; rows: string[] };

// Short lines with an equals sign, like "1 AND 0 = 0" or "4 + 1 = 5", are shown as math.
const isEquation = (line: string) => line.length <= 24 && line.includes('=');

/** An explanation's paragraphs, with runs of equations (like a truth table) kept together. */
export function explanationBlocks(text: string): ExplanationBlock[] {
  const blocks: ExplanationBlock[] = [];
  for (const line of paragraphsOf(text)) {
    const last = blocks[blocks.length - 1];
    if (!isEquation(line)) blocks.push({ kind: 'text', text: line });
    else if (last?.kind === 'equations') last.rows.push(line);
    else blocks.push({ kind: 'equations', rows: [line] });
  }
  return blocks;
}

/** Notes how many of a set's cards have a "How it works" explanation, e.g. for a set's description. */
export function explainedNote(cards: { explain?: string }[]) {
  const explained = cards.filter((card) => card.explain).length;
  if (explained === 0) return null;
  return explained === cards.length ? 'How it works on every card' : `How it works on ${explained} cards`;
}
