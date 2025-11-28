import { FlashcardData, FlashcardSet } from './types';

export const defaultSets: FlashcardSet[] = [
  { id: 'starter', name: 'Starter Pack' },
  { id: 'alphabet', name: 'Alphabet' },
  { id: 'numbers', name: 'Numbers 0-10' },
];

const starterCards: FlashcardData[] = [
  {
    id: 'sunshine',
    name: 'Sun',
    imageUrl: buildSvgCard('Sun', '#ffb347', '#ffcc33'),
    createdAt: Date.now(),
    setIds: ['starter'],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    imageUrl: buildSvgCard('Rainbow', '#7d7aff', '#ff7eb6'),
    createdAt: Date.now() + 1,
    setIds: ['starter'],
  },
  {
    id: 'dino',
    name: 'Dinosaur',
    imageUrl: buildSvgCard('Dino', '#7de0d5', '#6dd5ed'),
    createdAt: Date.now() + 2,
    setIds: ['starter'],
  },
];

function buildAlphabetCards(): FlashcardData[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters.map((letter, index) => ({
    id: `alphabet-${letter.toLowerCase()}`,
    name: letter,
    imageUrl: buildSvgCard(letter, '#7de0d5', '#7d7aff'),
    createdAt: Date.now() + 100 + index,
    setIds: ['alphabet'],
  }));
}

function buildNumberCards(): FlashcardData[] {
  return Array.from({ length: 11 }, (_, num) => ({
    id: `number-${num}`,
    name: String(num),
    imageUrl: buildSvgCard(String(num), '#ffb347', '#7d7aff'),
    createdAt: Date.now() + 200 + num,
    setIds: ['numbers'],
  }));
}

export const defaultCards: FlashcardData[] = [
  ...starterCards,
  ...buildAlphabetCards(),
  ...buildNumberCards(),
];

export function buildSvgCard(label: string, startColor: string, endColor: string) {
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
      <defs>
        <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" rx="28" fill="url(#grad)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1f1f1f" font-family="'Baloo 2', 'Comic Sans MS', cursive" font-size="64" font-weight="800">${label}</text>
    </svg>
  `);
  return `data:image/svg+xml,${encoded}`;
}
