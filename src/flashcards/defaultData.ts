import { FlashcardData, FlashcardSet } from './types';

export const defaultSets: FlashcardSet[] = [
  { id: 'numbers', name: 'Numbers 0-10' },
  { id: 'shapes', name: 'Shapes' },
  { id: 'colors', name: 'Colors' },
];

const numberNameInEnglish = (numberToConvert: number) => {
  const numbersToWords: { [key: number]: string } = {
    0: 'Zero',
    1: 'One',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    8: 'Eight',
    9: 'Nine',
    10: 'Ten',
  };

  return numbersToWords[numberToConvert];
};

// The gallery lists newest cards first, so each deck counts its timestamps down to show up in
// reading order: Numbers 0-10, then Shapes, then Colors.
const timestampSeed = Date.now();

// SVGs shown through <img> can't load web fonts like Baloo 2, so stick to rounded system fonts.
const SVG_FONT_STACK =
  "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const numberPalette = [
  '#e2e8f0',
  '#fca5a5',
  '#fdba74',
  '#fde047',
  '#bef264',
  '#86efac',
  '#5eead4',
  '#7dd3fc',
  '#a5b4fc',
  '#d8b4fe',
  '#f9a8d4',
];

function buildNumberCards(baseTimestamp: number): FlashcardData[] {
  return Array.from({ length: 11 }, (_, num) => ({
    id: `number-${num}`,
    name: numberNameInEnglish(num),
    imageUrl: buildNumberCard(num),
    backgroundColor: numberPalette[num],
    createdAt: baseTimestamp + 300 - num,
    setIds: ['numbers'],
  }));
}

type ShapeConfig = {
  id: string;
  name: string;
  height?: number;
  build: (fill: string, stroke: string) => string;
};

function buildShapeCards(baseTimestamp: number): FlashcardData[] {
  const stroke = '#0f172a';
  const palette = ['#f472b6', '#22d3ee', '#f97316', '#a78bfa', '#34d399', '#eab308', '#60a5fa', '#fb7185', '#4ade80', '#f59e0b'];
  const shapes: ShapeConfig[] = [
    { id: 'circle', name: 'Circle', build: (fill, s) => `<circle cx="200" cy="130" r="80" fill="${fill}" stroke="${s}" stroke-width="8" />` },
    { id: 'square', name: 'Square', build: (fill, s) => `<rect x="120" y="50" width="160" height="160" rx="14" fill="${fill}" stroke="${s}" stroke-width="8" />` },
    { id: 'triangle', name: 'Triangle', build: (fill, s) => `<polygon points="200,36 96,220 304,220" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
    { id: 'rectangle', name: 'Rectangle', build: (fill, s) => `<rect x="80" y="70" width="240" height="120" rx="18" fill="${fill}" stroke="${s}" stroke-width="8" />` },
    { id: 'star', name: 'Star', height: 300, build: (fill, s) => `<polygon points="200,32 236,122 332,126 254,186 282,278 200,226 118,278 146,186 68,126 164,122" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
    { id: 'heart', name: 'Heart', build: (fill, s) => `<path d="M200 238c-72-40-116-96-116-148 0-38 28-66 66-66 26 0 48 14 50 40 2-26 24-40 50-40 38 0 66 28 66 66 0 52-44 108-116 148z" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
    { id: 'oval', name: 'Oval', build: (fill, s) => `<ellipse cx="200" cy="130" rx="130" ry="76" fill="${fill}" stroke="${s}" stroke-width="8" />` },
    { id: 'diamond', name: 'Diamond', build: (fill, s) => `<polygon points="200,30 326,130 200,230 74,130" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
    { id: 'pentagon', name: 'Pentagon', height: 300, build: (fill, s) => `<polygon points="200,28 332,126 284,248 116,248 68,126" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
    { id: 'hexagon', name: 'Hexagon', height: 300, build: (fill, s) => `<polygon points="200,32 312,96 312,196 200,260 88,196 88,96" fill="${fill}" stroke="${s}" stroke-width="8" stroke-linejoin="round" />` },
  ];

  return shapes.map((shape, index) => ({
    id: `shape-${shape.id}`,
    name: shape.name,
    imageUrl: buildIllustratedCard(shape.build(palette[index % palette.length], stroke), shape.height ? shape.height : 0),
    createdAt: baseTimestamp + 200 - index,
    setIds: ['shapes'],
    backgroundColor: "#f8fafc"
  }));
}

type ColorConfig = {
  id: string;
  name: string;
  hex: string;
};

function buildColorCards(baseTimestamp: number): FlashcardData[] {
  const colors: ColorConfig[] = [
    { id: 'red', name: 'Red', hex: '#ef4444' },
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'yellow', name: 'Yellow', hex: '#facc15' },
    { id: 'green', name: 'Green', hex: '#22c55e' },
    { id: 'orange', name: 'Orange', hex: '#fb923c' },
    { id: 'purple', name: 'Purple', hex: '#a855f7' },
    { id: 'pink', name: 'Pink', hex: '#f472b6' },
    { id: 'brown', name: 'Brown', hex: '#b45309' },
    { id: 'black', name: 'Black', hex: '#111827' },
    { id: 'white', name: 'White', hex: '#f8fafc' },
  ];

  return colors.map((color, index) => ({
    id: `color-${color.id}`,
    name: color.name,
    imageUrl: '',
    backgroundColor: color.hex,
    createdAt: baseTimestamp + 100 - index,
    setIds: ['colors'],
  }));
}

export const defaultCards: FlashcardData[] = [
  ...buildNumberCards(timestampSeed),
  ...buildShapeCards(timestampSeed),
  ...buildColorCards(timestampSeed),
];

// A big numeral over a ten-frame (two rows of five dots) so kids can count the amount too.
// The background is transparent so the card's background color fills the whole face.
export function buildNumberCard(value: number) {
  const ink = '#0f172a';
  const dots = Array.from({ length: 10 }, (_, index) => {
    const cx = 70 + (index % 5) * 40;
    const cy = 207 + Math.floor(index / 5) * 40;
    return index < value
      ? `<circle cx="${cx}" cy="${cy}" r="14" fill="${ink}" />`
      : `<circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="${ink}" stroke-opacity="0.25" stroke-width="3" />`;
  }).join('');
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <text x="150" y="100" dominant-baseline="central" text-anchor="middle" fill="${ink}" font-family="${SVG_FONT_STACK}" font-size="150" font-weight="800">${value}</text>
      <rect x="45" y="182" width="210" height="90" rx="18" fill="#ffffff" fill-opacity="0.6" />
      ${dots}
    </svg>
  `);
  return `data:image/svg+xml,${encoded}`;
}

function buildIllustratedCard(content: string, height?: number) {
  const background = '#f8fafc';
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height ? height.toString(): "260"}">
      <rect width="400" height="${height ? height.toString(): "260"}" rx="40" fill="${background}" />
      <g transform="translate(0, 0)">${content}</g>
    </svg>
  `);
  return `data:image/svg+xml,${encoded}`;
}
