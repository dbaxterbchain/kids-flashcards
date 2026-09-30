import { describe, expect, it } from 'vitest';
import { isNewerEmoji, newerEmojiIn } from './emojiSupport';
import { GAME_INFO } from './games';
import { LIBRARY_SETS } from './librarySets';
import { AVATARS } from './practice';
import { SHINY_STICKERS, STICKERS } from './stickers';

describe('emoji that older devices can show', () => {
  it('knows emoji newer than Emoji 12.0', () => {
    for (const emoji of ['🫀', '🫁', '🥷', '🦭', '🪼', '🫎', '🧋', '🛻', '🧑‍🏫', '🐈‍⬛', '❤️‍🔥', '🏃‍➡️', '🧑‍🧑‍🧒']) {
      expect(isNewerEmoji(emoji), emoji).toBe(true);
    }
    for (const emoji of ['🧠', '🦴', '🦷', '🩸', '🪁', '🪐', '🪕', '🧃', '🦩', '👩‍🚀', '🧑‍🤝‍🧑', '🧜‍♀️', '🕷️', '❤️']) {
      expect(isNewerEmoji(emoji), emoji).toBe(false);
    }
  });

  it('finds them in text', () => {
    expect(newerEmojiIn('A 🫎 and a 🐄 and a 🫎')).toEqual(['🫎', '🫎']);
    expect(newerEmojiIn('2 + 3')).toEqual([]);
  });

  it('keeps the library, avatars, stickers and games to emoji that Windows 10 can show', () => {
    const everywhere = [
      ...LIBRARY_SETS.flatMap((entry) => entry.cards.map((card) => [`${entry.name}: ${card.name}`, card.frontText ?? ''])),
      ...AVATARS.map((avatar) => [`avatar ${avatar.label}`, avatar.emoji]),
      ...[...STICKERS, ...SHINY_STICKERS].map((sticker) => ['sticker', sticker]),
      ...Object.values(GAME_INFO).map((game) => [game.name, game.emoji]),
    ];
    for (const [where, text] of everywhere) expect(newerEmojiIn(text), where).toEqual([]);
  });
});
