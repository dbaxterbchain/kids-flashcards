// Emoji newer than Emoji 12.0 (2019) show as empty boxes on Windows 10 and other older systems. The
// library, avatars and stickers stick to older ones, and the card editor warns about newer ones.

const ZWJ = '‍';

// The newest emoji block: all but these older ones arrived after Emoji 12.0, and new emoji keep
// arriving in it.
const NEWEST_BLOCK: [number, number] = [0x1fa70, 0x1faff];
const OLDER_IN_NEWEST_BLOCK: [number, number][] = [
  [0x1fa70, 0x1fa73],
  [0x1fa78, 0x1fa7a],
  [0x1fa80, 0x1fa82],
  [0x1fa90, 0x1fa95],
];

// Emoji after 12.0 elsewhere, like the ninja (U+1F977) and the seal (U+1F9AD).
const NEWER_ELSEWHERE: [number, number][] = [
  [0x26a7, 0x26a7],
  [0x1f6d6, 0x1f6d7],
  [0x1f6dc, 0x1f6df],
  [0x1f6fb, 0x1f6fc],
  [0x1f7f0, 0x1f7f0],
  [0x1f90c, 0x1f90c],
  [0x1f972, 0x1f972],
  [0x1f977, 0x1f979],
  [0x1f9a3, 0x1f9a4],
  [0x1f9ab, 0x1f9ad],
  [0x1f9cb, 0x1f9cc],
];

// Older emoji joined into newer ones, written without variation selectors.
const NEWER_SEQUENCES = new Set(
  [
    '😶‍🌫', '😮‍💨', '😵‍💫', '🙂‍↔', '🙂‍↕', '❤‍🔥', '❤‍🩹', '🧔‍♂', '🧔‍♀', '🤵‍♂', '🤵‍♀', '👰‍♂', '👰‍♀',
    '👩‍🍼', '👨‍🍼', '🐈‍⬛', '🐻‍❄', '🐦‍⬛', '🐦‍🔥', '🍋‍🟩', '🍄‍🟫', '⛓‍💥',
  ],
);

const within = (codePoint: number, ranges: [number, number][]) =>
  ranges.some(([from, to]) => codePoint >= from && codePoint <= to);

function isNewerCodePoint(codePoint: number) {
  if (codePoint >= NEWEST_BLOCK[0] && codePoint <= NEWEST_BLOCK[1]) return !within(codePoint, OLDER_IN_NEWEST_BLOCK);
  return within(codePoint, NEWER_ELSEWHERE);
}

/** Whether one emoji (a single grapheme) is newer than Emoji 12.0. */
export function isNewerEmoji(emoji: string) {
  const plain = emoji.replace(/️/g, '');
  const codePoints = [...plain].map((char) => char.codePointAt(0) ?? 0);
  if (codePoints.some(isNewerCodePoint)) return true;
  if (NEWER_SEQUENCES.has(plain)) return true;
  // People doing jobs (🧑‍🏫) and more, all Emoji 12.1 or later, except people holding hands.
  if (plain.startsWith(`🧑${ZWJ}`) && !plain.startsWith(`🧑${ZWJ}🤝`)) return true;
  // Facing right (🏃‍➡️), from Emoji 15.1.
  return plain.includes(`${ZWJ}➡`);
}

/** The emoji in some text that older devices may show as empty boxes. */
export function newerEmojiIn(text: string) {
  // Without a way to split text into whole emoji (older browsers), check one character at a time.
  const segments =
    typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(({ segment }) => segment)
      : [...text];
  return segments.filter((segment) => /\p{Extended_Pictographic}/u.test(segment) && isNewerEmoji(segment));
}
