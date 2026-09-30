import { buildNumberCard, numberPalette, SVG_FONT_STACK } from './defaultData';
import { slugifySetName } from './fileUtils';
import { LibraryCard, LibrarySet } from './library';

// Ready-made sets for the set library. Pictures are emoji (drawn by the device's own emoji font) or
// small generated drawings, so the whole library costs almost nothing to download or store.

const PASTELS = ['#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#ccfbf1', '#e0f2fe', '#e0e7ff', '#f3e8ff', '#fce7f3'];

const INK = '#0f172a';

/** [front, name] or, when names repeat within a set, [front, name, key]. */
type Pair = [front: string, name: string, key?: string];

type TextOptions = { lang?: string; background?: string };

/** Cards with an emoji or short text on the front, on soft background colors. */
function textCards(pairs: Pair[], { lang, background }: TextOptions = {}): LibraryCard[] {
  return pairs.map(([front, name, key], index) => ({
    key: key ?? slugifySetName(name),
    name,
    imageUrl: '',
    frontText: front,
    backgroundColor: background ?? PASTELS[index % PASTELS.length],
    lang,
  }));
}

/** Cards whose whole front is a color. */
function colorCards(pairs: [hex: string, name: string][], lang?: string): LibraryCard[] {
  return pairs.map(([hex, name]) => ({ key: slugifySetName(name), name, imageUrl: '', backgroundColor: hex, lang }));
}

function pictureCards(items: { name: string; image: string }[], background: string): LibraryCard[] {
  return items.map(({ name, image }) => ({ key: slugifySetName(name), name, imageUrl: image, backgroundColor: background }));
}

const svg = (body: string, defs = '') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${
      defs ? `<defs>${defs}</defs>` : ''
    }${body}</svg>`,
  )}`;

const round = (value: number) => Math.round(value * 10) / 10;

/** A point on a circle, measured clockwise from 12 o'clock. */
function onCircle(cx: number, cy: number, radius: number, turns: number) {
  const angle = turns * 2 * Math.PI;
  return { x: round(cx + radius * Math.sin(angle)), y: round(cy - radius * Math.cos(angle)) };
}

// --- Planets -------------------------------------------------------------------------------------

const STARS = [
  [38, 48, 1.8],
  [262, 36, 1.4],
  [276, 228, 2],
  [26, 244, 1.4],
  [64, 150, 1.1],
  [244, 124, 1.1],
  [150, 18, 1.4],
  [184, 284, 1.6],
  [104, 84, 0.9],
  [214, 262, 1],
]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.85"/>`)
  .join('');

type PlanetOptions = {
  /** Drawn inside the planet, e.g. bands, craters or continents. */
  details?: string;
  /** Drawn behind the planet (the far side of a ring). */
  behind?: string;
  /** Drawn in front of the planet (the near side of a ring). */
  inFront?: string;
};

function planet(radius: number, light: string, dark: string, { details = '', behind = '', inFront = '' }: PlanetOptions = {}) {
  const defs = [
    `<radialGradient id="body" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`,
    `<radialGradient id="shade" cx="0.38" cy="0.35" r="0.8"><stop offset="0.55" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.45"/></radialGradient>`,
    `<clipPath id="clip"><circle cx="150" cy="150" r="${radius}"/></clipPath>`,
  ].join('');
  return svg(
    `${STARS}${behind}<circle cx="150" cy="150" r="${radius}" fill="url(#body)"/><g clip-path="url(#clip)">${details}<circle cx="150" cy="150" r="${radius}" fill="url(#shade)"/></g>${inFront}`,
    defs,
  );
}

const craters = (spots: [number, number, number][], fill: string) =>
  spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.75"/>`).join('');

const bands = (rows: [number, number, string][]) =>
  rows.map(([y, height, fill]) => `<rect x="0" y="${y}" width="300" height="${height}" fill="${fill}" opacity="0.85"/>`).join('');

// A tilted ring in two halves: the far half is hidden behind the planet, the near half crosses it.
function ring(rx: number, ry: number, width: number, color: string, tilt: number) {
  const far = `<path d="M ${150 - rx} 150 A ${rx} ${ry} 0 0 1 ${150 + rx} 150" fill="none" stroke="${color}" stroke-width="${width}" transform="rotate(${tilt} 150 150)"/>`;
  const near = `<path d="M ${150 - rx} 150 A ${rx} ${ry} 0 0 0 ${150 + rx} 150" fill="none" stroke="${color}" stroke-width="${width}" transform="rotate(${tilt} 150 150)"/>`;
  return { far, near };
}

function sun() {
  const defs = `<radialGradient id="sun" cx="0.45" cy="0.42" r="0.7"><stop offset="0" stop-color="#fffbe6"/><stop offset="0.55" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></radialGradient>`;
  return svg(
    `${STARS}<circle cx="150" cy="150" r="130" fill="#fde047" opacity="0.18"/><circle cx="150" cy="150" r="114" fill="#fbbf24" opacity="0.28"/><circle cx="150" cy="150" r="96" fill="url(#sun)"/>`,
    defs,
  );
}

function planetCards(): LibraryCard[] {
  const saturnRings = [ring(130, 34, 12, '#e9d29a', -18), ring(106, 27, 7, '#b99b62', -18)];
  const uranusRing = ring(112, 24, 4, '#e0f2fe', 75);
  return pictureCards(
    [
      { name: 'Sun', image: sun() },
      {
        name: 'Mercury',
        image: planet(58, '#e5e7eb', '#6b7280', {
          details: craters([[132, 130, 10], [168, 158, 7], [140, 176, 6], [166, 124, 5]], '#9ca3af'),
        }),
      },
      {
        name: 'Venus',
        image: planet(80, '#fef3c7', '#d97706', {
          details:
            '<ellipse cx="150" cy="120" rx="80" ry="12" fill="#fff7ed" opacity="0.35" transform="rotate(-10 150 150)"/><ellipse cx="150" cy="168" rx="84" ry="10" fill="#fff7ed" opacity="0.3" transform="rotate(-10 150 150)"/>',
        }),
      },
      {
        name: 'Earth',
        image: planet(86, '#93c5fd', '#1d4ed8', {
          details:
            '<path d="M92 112c16-30 52-34 64-16 10 16-4 34-22 34-8 0-10 12-22 14-22 2-30-14-20-32z" fill="#22c55e"/><path d="M166 160c20-16 50-8 56 12 6 20-10 40-32 44-18 4-30-8-26-22 2-10-8-20 2-34z" fill="#16a34a"/><path d="M104 196c14-6 30-4 38 4" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.7"/><path d="M168 92c14-6 30-4 40 6" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.7"/>',
        }),
      },
      {
        name: 'Moon',
        image: planet(72, '#f9fafb', '#9ca3af', {
          details: craters([[126, 126, 13], [172, 146, 9], [140, 180, 10], [174, 108, 6], [112, 162, 5]], '#d1d5db'),
        }),
      },
      {
        name: 'Mars',
        image: planet(70, '#fdba74', '#9a3412', {
          details:
            '<ellipse cx="130" cy="146" rx="22" ry="10" fill="#7c2d12" opacity="0.35"/><ellipse cx="172" cy="178" rx="18" ry="8" fill="#7c2d12" opacity="0.3"/><ellipse cx="150" cy="84" rx="30" ry="9" fill="#ffffff" opacity="0.85"/>',
        }),
      },
      {
        name: 'Jupiter',
        image: planet(104, '#fde7c2', '#b7794a', {
          details: `${bands([
            [70, 16, '#d6a36a'],
            [100, 12, '#f3d7a7'],
            [124, 18, '#c08552'],
            [160, 14, '#e8c38f'],
            [186, 20, '#b46f3c'],
            [220, 12, '#d9ad78'],
          ])}<ellipse cx="186" cy="196" rx="22" ry="12" fill="#c2410c"/>`,
        }),
      },
      {
        name: 'Saturn',
        image: planet(66, '#fef3c7', '#ca8a04', {
          details: bands([
            [110, 10, '#fde68a'],
            [140, 12, '#eab308'],
            [172, 10, '#fde68a'],
          ]),
          behind: saturnRings.map((part) => part.far).join(''),
          inFront: saturnRings.map((part) => part.near).join(''),
        }),
      },
      {
        name: 'Uranus',
        image: planet(74, '#cffafe', '#0e7490', { behind: uranusRing.far, inFront: uranusRing.near }),
      },
      {
        name: 'Neptune',
        image: planet(74, '#bfdbfe', '#1e3a8a', {
          details:
            '<ellipse cx="170" cy="162" rx="16" ry="9" fill="#172554" opacity="0.6"/><ellipse cx="134" cy="118" rx="28" ry="4" fill="#ffffff" opacity="0.5"/>',
        }),
      },
    ],
    '#0b1026',
  );
}

// --- Numbers 11-20 -------------------------------------------------------------------------------

// Like the starter number cards, but with two ten-frames: one full ten plus the ones.
function teenNumberImage(value: number) {
  const frame = (left: number, filled: number) => {
    const dots = Array.from({ length: 10 }, (_, index) => {
      const cx = left + 16 + (index % 5) * 24;
      const cy = 205 + Math.floor(index / 5) * 24;
      return index < filled
        ? `<circle cx="${cx}" cy="${cy}" r="9" fill="${INK}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${INK}" stroke-opacity="0.25" stroke-width="2.5"/>`;
    }).join('');
    return `<rect x="${left}" y="189" width="128" height="56" rx="12" fill="#ffffff" fill-opacity="0.6"/>${dots}`;
  };
  return svg(
    `<text x="150" y="100" dominant-baseline="central" text-anchor="middle" fill="${INK}" font-family="${SVG_FONT_STACK}" font-size="140" font-weight="800">${value}</text>${frame(18, 10)}${frame(154, value - 10)}`,
  );
}

const TEEN_NAMES = ['Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

function teenNumberCards(): LibraryCard[] {
  return TEEN_NAMES.map((name, index) => ({
    key: String(index + 11),
    name,
    imageUrl: teenNumberImage(index + 11),
    backgroundColor: numberPalette[(index + 1) % numberPalette.length],
  }));
}

/** Numbers 1-10 drawn like the starter cards (numeral and ten-frame), named in another language. */
function numberWordCards(words: string[], lang: string): LibraryCard[] {
  return words.map((name, index) => ({
    key: String(index + 1),
    name,
    imageUrl: buildNumberCard(index + 1),
    backgroundColor: numberPalette[index + 1],
    lang,
  }));
}

// --- 3D shapes -----------------------------------------------------------------------------------

const outline = `stroke="${INK}" stroke-width="6" stroke-linejoin="round"`;

const polygon = (points: string, fill: string) => `<polygon points="${points}" fill="${fill}" ${outline}/>`;

function shapeCards(): LibraryCard[] {
  const cylinderSide = `<linearGradient id="side" x1="0" x2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="0.5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#5b21b6"/></linearGradient>`;
  const coneSide = `<linearGradient id="side" x1="0" x2="1"><stop offset="0" stop-color="#fbcfe8"/><stop offset="0.5" stop-color="#ec4899"/><stop offset="1" stop-color="#9d174d"/></linearGradient>`;
  const sphereFill = `<radialGradient id="ball" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#ccfbf1"/><stop offset="1" stop-color="#0d9488"/></radialGradient>`;
  return pictureCards(
    [
      {
        name: 'Cube',
        image: svg(
          polygon('70,110 190,110 190,230 70,230', '#60a5fa') +
            polygon('70,110 190,110 230,70 110,70', '#bfdbfe') +
            polygon('190,110 230,70 230,190 190,230', '#2563eb'),
        ),
      },
      {
        name: 'Sphere',
        image: svg(
          `<ellipse cx="150" cy="252" rx="70" ry="10" fill="${INK}" opacity="0.15"/><circle cx="150" cy="142" r="92" fill="url(#ball)" ${outline}/><ellipse cx="118" cy="104" rx="22" ry="13" fill="#ffffff" opacity="0.5" transform="rotate(-30 118 104)"/>`,
          sphereFill,
        ),
      },
      {
        name: 'Cylinder',
        image: svg(
          `<path d="M90 90 V210 A60 20 0 0 0 210 210 V90 Z" fill="url(#side)" ${outline}/><ellipse cx="150" cy="90" rx="60" ry="20" fill="#ede9fe" ${outline}/>`,
          cylinderSide,
        ),
      },
      {
        name: 'Cone',
        image: svg(`<path d="M150 46 L90 222 A60 20 0 0 0 210 222 Z" fill="url(#side)" ${outline}/>`, coneSide),
      },
      {
        name: 'Pyramid',
        image: svg(polygon('190,230 240,194 150,50', '#ca8a04') + polygon('60,230 190,230 150,50', '#facc15')),
      },
      {
        name: 'Rectangular prism',
        image: svg(
          polygon('40,130 220,130 220,220 40,220', '#fb923c') +
            polygon('40,130 220,130 260,90 80,90', '#fed7aa') +
            polygon('220,130 260,90 260,180 220,220', '#ea580c'),
        ),
      },
      {
        name: 'Triangular prism',
        image: svg(polygon('110,116 180,76 240,180 170,220', '#16a34a') + polygon('50,220 170,220 110,116', '#4ade80')),
      },
    ],
    '#f8fafc',
  );
}

// --- Telling time --------------------------------------------------------------------------------

function clockImage(hours: number, minutes: number) {
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const hour = index % 5 === 0;
    const from = onCircle(150, 150, hour ? 104 : 112, index / 60);
    const to = onCircle(150, 150, 118, index / 60);
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${INK}" stroke-width="${hour ? 5 : 2}" stroke-linecap="round"/>`;
  }).join('');
  const numerals = Array.from({ length: 12 }, (_, index) => {
    const { x, y } = onCircle(150, 150, 86, (index + 1) / 12);
    return `<text x="${x}" y="${y}" dominant-baseline="central" text-anchor="middle" fill="${INK}" font-family="${SVG_FONT_STACK}" font-size="26" font-weight="800">${index + 1}</text>`;
  }).join('');
  // Both hands stop short of the numbers, so the number each one points at stays easy to read.
  const hourEnd = onCircle(150, 150, 46, ((hours % 12) + minutes / 60) / 12);
  const minuteEnd = onCircle(150, 150, 68, minutes / 60);
  return svg(
    `<circle cx="150" cy="150" r="124" fill="#ffffff" stroke="${INK}" stroke-width="8"/>${ticks}${numerals}` +
      `<line x1="150" y1="150" x2="${minuteEnd.x}" y2="${minuteEnd.y}" stroke="#2563eb" stroke-width="7" stroke-linecap="round"/>` +
      `<line x1="150" y1="150" x2="${hourEnd.x}" y2="${hourEnd.y}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>` +
      `<circle cx="150" cy="150" r="8" fill="${INK}"/>`,
  );
}

function clockCards(): LibraryCard[] {
  const times: [number, number, string][] = [
    [1, 0, "1 o'clock"],
    [3, 0, "3 o'clock"],
    [5, 0, "5 o'clock"],
    [8, 0, "8 o'clock"],
    [12, 0, "12 o'clock"],
    [2, 30, 'Half past 2'],
    [6, 30, 'Half past 6'],
    [10, 30, 'Half past 10'],
    [4, 15, 'Quarter past 4'],
    [8, 45, 'Quarter to 9'],
  ];
  return pictureCards(
    times.map(([hours, minutes, name]) => ({ name, image: clockImage(hours, minutes) })),
    '#dbeafe',
  );
}

// --- Fractions -----------------------------------------------------------------------------------

function fractionImage(parts: number, shaded: number) {
  const fill = (index: number) => (index < shaded ? '#f97316' : '#ffffff');
  if (parts === 1) return svg(`<circle cx="150" cy="150" r="112" fill="${fill(0)}" ${outline}/>`);
  const slices = Array.from({ length: parts }, (_, index) => {
    const start = onCircle(150, 150, 112, index / parts);
    const end = onCircle(150, 150, 112, (index + 1) / parts);
    return `<path d="M150 150 L${start.x} ${start.y} A112 112 0 0 1 ${end.x} ${end.y} Z" fill="${fill(index)}" ${outline}/>`;
  }).join('');
  return svg(slices);
}

function fractionCards(): LibraryCard[] {
  const fractions: [number, number, string][] = [
    [1, 1, 'One whole'],
    [2, 1, 'One half'],
    [3, 1, 'One third'],
    [3, 2, 'Two thirds'],
    [4, 1, 'One quarter'],
    [4, 3, 'Three quarters'],
    [5, 1, 'One fifth'],
    [6, 1, 'One sixth'],
    [8, 1, 'One eighth'],
  ];
  return pictureCards(
    fractions.map(([parts, shaded, name]) => ({ name, image: fractionImage(parts, shaded) })),
    '#fef3c7',
  );
}

// --- Math facts ----------------------------------------------------------------------------------

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const MINUS = '−';

// Each answer appears once in a set, so a question never has two right answers.
const doubles: Pair[] = range(1, 10).map((n) => [`${n} + ${n}`, String(n * 2)]);
const takeAway: Pair[] = [
  [3, 3],
  [4, 3],
  [5, 3],
  [7, 4],
  [6, 2],
  [10, 5],
  [8, 2],
  [9, 2],
  [10, 2],
  [10, 1],
].map(([a, b]) => [`${a} ${MINUS} ${b}`, String(a - b)]);
const makeTen: Pair[] = range(1, 9).map((n) => [`${n} + ? = 10`, String(10 - n)]);
const timesTable = (factor: number): Pair[] => range(1, 10).map((n) => [`${factor} × ${n}`, String(factor * n)]);
const binary: Pair[] = range(0, 15).map((n) => [n.toString(2).padStart(4, '0'), String(n)]);

// --- Reading -------------------------------------------------------------------------------------

const letters: Pair[] = range(0, 25).map((index) => {
  const letter = String.fromCharCode(65 + index);
  return [`${letter}${letter.toLowerCase()}`, letter];
});

// From the Dolch sight word lists, most common first.
const sightWords = (words: string[]): Pair[] => words.map((word) => [word, word]);

// --- The library ---------------------------------------------------------------------------------

export const LIBRARY_SETS: LibrarySet[] = [
  // Animals
  {
    id: 'farm-animals',
    name: 'Farm animals',
    subject: 'animals',
    minAge: 2,
    description: 'Cow, pig, sheep and the rest of the barnyard.',
    cards: textCards([
      ['🐮', 'Cow'],
      ['🐷', 'Pig'],
      ['🐑', 'Sheep'],
      ['🐐', 'Goat'],
      ['🐴', 'Horse'],
      ['🐔', 'Chicken'],
      ['🐓', 'Rooster'],
      ['🦆', 'Duck'],
      ['🦃', 'Turkey'],
      ['🦙', 'Llama'],
    ]),
  },
  {
    id: 'wild-animals',
    name: 'Wild animals',
    subject: 'animals',
    minAge: 2,
    description: 'Lions, elephants, giraffes and more from around the world.',
    cards: textCards([
      ['🦁', 'Lion'],
      ['🐯', 'Tiger'],
      ['🐘', 'Elephant'],
      ['🦒', 'Giraffe'],
      ['🦓', 'Zebra'],
      ['🦛', 'Hippo'],
      ['🐵', 'Monkey'],
      ['🦍', 'Gorilla'],
      ['🐻', 'Bear'],
      ['🦘', 'Kangaroo'],
      ['🐊', 'Crocodile'],
      ['🦏', 'Rhino'],
    ]),
  },
  {
    id: 'ocean-animals',
    name: 'Ocean animals',
    subject: 'animals',
    minAge: 2,
    description: 'Whales, octopuses, crabs and other sea creatures.',
    cards: textCards([
      ['🐳', 'Whale'],
      ['🐬', 'Dolphin'],
      ['🦈', 'Shark'],
      ['🐙', 'Octopus'],
      ['🦀', 'Crab'],
      ['🐠', 'Fish'],
      ['🐢', 'Sea turtle'],
      ['🦑', 'Squid'],
      ['🦞', 'Lobster'],
      ['🦐', 'Shrimp'],
      ['🐡', 'Pufferfish'],
      ['🐧', 'Penguin'],
    ]),
  },
  {
    id: 'pets',
    name: 'Pets',
    subject: 'animals',
    minAge: 2,
    description: 'Animals that live with families.',
    cards: textCards([
      ['🐶', 'Dog'],
      ['🐱', 'Cat'],
      ['🐹', 'Hamster'],
      ['🐰', 'Bunny'],
      ['🐟', 'Fish'],
      ['🦜', 'Parrot'],
      ['🐢', 'Turtle'],
      ['🐭', 'Mouse'],
      ['🦎', 'Lizard'],
    ]),
  },
  {
    id: 'bugs',
    name: 'Bugs',
    subject: 'animals',
    minAge: 3,
    description: 'Bees, butterflies, ladybugs and other creepy-crawlies.',
    cards: textCards([
      ['🐝', 'Bee'],
      ['🦋', 'Butterfly'],
      ['🐞', 'Ladybug'],
      ['🐜', 'Ant'],
      ['🐛', 'Caterpillar'],
      ['🕷️', 'Spider'],
      ['🐌', 'Snail'],
      ['🦗', 'Cricket'],
      ['🦟', 'Mosquito'],
      ['🦂', 'Scorpion'],
    ]),
  },

  // Everyday words
  {
    id: 'fruits',
    name: 'Fruits',
    subject: 'everyday',
    minAge: 2,
    description: 'Apples, bananas, grapes and other favorites.',
    cards: textCards([
      ['🍎', 'Apple'],
      ['🍌', 'Banana'],
      ['🍇', 'Grapes'],
      ['🍓', 'Strawberry'],
      ['🍊', 'Orange'],
      ['🍉', 'Watermelon'],
      ['🍍', 'Pineapple'],
      ['🍒', 'Cherries'],
      ['🍐', 'Pear'],
      ['🍑', 'Peach'],
      ['🥝', 'Kiwi'],
      ['🥭', 'Mango'],
      ['🍋', 'Lemon'],
    ]),
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    subject: 'everyday',
    minAge: 2,
    description: 'Carrots, broccoli, corn and more.',
    cards: textCards([
      ['🥕', 'Carrot'],
      ['🥦', 'Broccoli'],
      ['🌽', 'Corn'],
      ['🍅', 'Tomato'],
      ['🥔', 'Potato'],
      ['🥒', 'Cucumber'],
      ['🧅', 'Onion'],
      ['🥬', 'Lettuce'],
      ['🍄', 'Mushroom'],
      ['🌶️', 'Pepper'],
      ['🧄', 'Garlic'],
      ['🥑', 'Avocado'],
    ]),
  },
  {
    id: 'food-and-drinks',
    name: 'Food and drinks',
    subject: 'everyday',
    minAge: 2,
    description: 'Breakfast, lunch, dinner and treats.',
    cards: textCards([
      ['🍞', 'Bread'],
      ['🧀', 'Cheese'],
      ['🥚', 'Egg'],
      ['🥛', 'Milk'],
      ['🍕', 'Pizza'],
      ['🍝', 'Pasta'],
      ['🍚', 'Rice'],
      ['🥪', 'Sandwich'],
      ['🥞', 'Pancakes'],
      ['🍪', 'Cookie'],
      ['🍦', 'Ice cream'],
      ['💧', 'Water'],
      ['🧃', 'Juice'],
    ]),
  },
  {
    id: 'things-that-go',
    name: 'Things that go',
    subject: 'everyday',
    minAge: 2,
    description: 'Cars, trucks, trains, planes and boats.',
    cards: textCards([
      ['🚗', 'Car'],
      ['🚌', 'Bus'],
      ['🚒', 'Fire truck'],
      ['🚓', 'Police car'],
      ['🚑', 'Ambulance'],
      ['🚜', 'Tractor'],
      ['🚂', 'Train'],
      ['✈️', 'Airplane'],
      ['🚁', 'Helicopter'],
      ['🚲', 'Bike'],
      ['⛵', 'Boat'],
      ['🚚', 'Truck'],
    ]),
  },
  {
    id: 'clothes',
    name: 'Clothes',
    subject: 'everyday',
    minAge: 2,
    description: 'What we wear, from socks to sunglasses.',
    cards: textCards([
      ['👕', 'Shirt'],
      ['👖', 'Pants'],
      ['👗', 'Dress'],
      ['🧥', 'Coat'],
      ['🧦', 'Socks'],
      ['👟', 'Shoes'],
      ['🧢', 'Cap'],
      ['🧤', 'Gloves'],
      ['🧣', 'Scarf'],
      ['🩳', 'Shorts'],
      ['👢', 'Boots'],
      ['🕶️', 'Sunglasses'],
    ]),
  },
  {
    id: 'around-the-house',
    name: 'Around the house',
    subject: 'everyday',
    minAge: 2,
    description: 'Bed, chair, bathtub and other things at home.',
    cards: textCards([
      ['🛏️', 'Bed'],
      ['🪑', 'Chair'],
      ['🛋️', 'Couch'],
      ['🚪', 'Door'],
      ['🛁', 'Bathtub'],
      ['🚽', 'Toilet'],
      ['🧼', 'Soap'],
      ['📺', 'TV'],
      ['🧸', 'Teddy bear'],
      ['🥄', 'Spoon'],
      ['🧹', 'Broom'],
      ['🔑', 'Key'],
      ['⏰', 'Clock'],
    ]),
  },
  {
    id: 'body-parts',
    name: 'Body parts',
    subject: 'everyday',
    minAge: 2,
    description: 'Eyes, ears, nose, mouth and more.',
    cards: textCards([
      ['👀', 'Eyes'],
      ['👂', 'Ear'],
      ['👃', 'Nose'],
      ['👄', 'Mouth'],
      ['🦷', 'Tooth'],
      ['👅', 'Tongue'],
      ['✋', 'Hand'],
      ['💪', 'Arm'],
      ['🦵', 'Leg'],
      ['🦶', 'Foot'],
    ]),
  },
  {
    id: 'more-colors',
    name: 'More colors',
    subject: 'everyday',
    minAge: 3,
    description: 'Colors beyond the rainbow basics, like teal and maroon.',
    cards: colorCards([
      ['#9ca3af', 'Gray'],
      ['#1e3a8a', 'Navy'],
      ['#0d9488', 'Teal'],
      ['#40e0d0', 'Turquoise'],
      ['#84cc16', 'Lime'],
      ['#d946ef', 'Magenta'],
      ['#f5f5dc', 'Beige'],
      ['#800000', 'Maroon'],
      ['#c4b5fd', 'Lavender'],
      ['#ff7f50', 'Coral'],
    ]),
  },

  // Feelings and people
  {
    id: 'feelings',
    name: 'Feelings',
    subject: 'people',
    minAge: 2,
    description: 'Words for how we feel, to help kids name their feelings.',
    cards: textCards([
      ['😀', 'Happy'],
      ['😢', 'Sad'],
      ['😠', 'Angry'],
      ['😨', 'Scared'],
      ['😮', 'Surprised'],
      ['😴', 'Sleepy'],
      ['🤒', 'Sick'],
      ['🤪', 'Silly'],
      ['😌', 'Calm'],
      ['😟', 'Worried'],
      ['🤩', 'Excited'],
      ['🥰', 'Loved'],
    ]),
  },
  {
    id: 'community-helpers',
    name: 'Community helpers',
    subject: 'people',
    minAge: 3,
    description: 'Firefighters, doctors, teachers and other people who help us.',
    cards: textCards([
      ['👩‍🚒', 'Firefighter'],
      ['👮', 'Police officer'],
      ['👨‍⚕️', 'Doctor'],
      ['👩‍🏫', 'Teacher'],
      ['👨‍🍳', 'Chef'],
      ['👩‍🌾', 'Farmer'],
      ['👨‍🚀', 'Astronaut'],
      ['👩‍🔧', 'Mechanic'],
      ['👨‍🎨', 'Artist'],
      ['👩‍🔬', 'Scientist'],
      ['👷', 'Builder'],
      ['👩‍✈️', 'Pilot'],
    ]),
  },

  // Science and nature
  {
    id: 'weather',
    name: 'Weather',
    subject: 'science',
    minAge: 3,
    description: 'Sunny, rainy, snowy and stormy days.',
    cards: textCards([
      ['☀️', 'Sunny'],
      ['🌧️', 'Rainy'],
      ['☁️', 'Cloudy'],
      ['❄️', 'Snowy'],
      ['⛈️', 'Stormy'],
      ['🌬️', 'Windy'],
      ['🌫️', 'Foggy'],
      ['🌈', 'Rainbow'],
      ['⚡', 'Lightning'],
      ['🌪️', 'Tornado'],
    ]),
  },
  {
    id: 'nature',
    name: 'Nature',
    subject: 'science',
    minAge: 3,
    description: 'Trees, flowers, mountains, oceans and more of the outdoors.',
    cards: textCards([
      ['🌳', 'Tree'],
      ['🌸', 'Flower'],
      ['🍃', 'Leaf'],
      ['🌱', 'Sprout'],
      ['🌵', 'Cactus'],
      ['🍄', 'Mushroom'],
      ['🐚', 'Shell'],
      ['🌊', 'Wave'],
      ['⛰️', 'Mountain'],
      ['🌋', 'Volcano'],
      ['🏝️', 'Island'],
      ['🏜️', 'Desert'],
    ]),
  },
  {
    id: 'five-senses',
    name: 'Five senses',
    subject: 'science',
    minAge: 3,
    description: 'See, hear, smell, taste and touch.',
    cards: textCards([
      ['👀', 'See'],
      ['👂', 'Hear'],
      ['👃', 'Smell'],
      ['👅', 'Taste'],
      ['✋', 'Touch'],
    ]),
  },
  {
    id: 'space',
    name: 'Space',
    subject: 'science',
    minAge: 4,
    description: 'Rockets, stars, comets and astronauts.',
    cards: textCards([
      ['🚀', 'Rocket'],
      ['🌙', 'Moon'],
      ['⭐', 'Star'],
      ['☀️', 'Sun'],
      ['🌍', 'Earth'],
      ['🪐', 'Planet'],
      ['☄️', 'Comet'],
      ['🛰️', 'Satellite'],
      ['🔭', 'Telescope'],
      ['👩‍🚀', 'Astronaut'],
      ['🌌', 'Galaxy'],
      ['👽', 'Alien'],
    ]),
  },
  {
    id: 'planets',
    name: 'The planets',
    subject: 'science',
    minAge: 5,
    description: 'The Sun, the Moon and the eight planets, drawn to tell apart.',
    cards: planetCards(),
  },
  {
    id: 'solid-liquid-gas',
    name: 'Solid, liquid or gas?',
    subject: 'science',
    minAge: 5,
    description: 'Is it a solid, a liquid or a gas? Each card shows something to sort.',
    cards: textCards([
      ['🧊', 'Solid', 'ice'],
      ['🧱', 'Solid', 'brick'],
      ['🥄', 'Solid', 'spoon'],
      ['💧', 'Liquid', 'water'],
      ['🥛', 'Liquid', 'milk'],
      ['🍯', 'Liquid', 'honey'],
      ['💨', 'Gas', 'air'],
      ['🎈', 'Gas', 'balloon'],
      ['♨️', 'Gas', 'steam'],
    ]),
  },
  {
    id: 'science-tools',
    name: 'Science tools',
    subject: 'science',
    minAge: 6,
    description: 'Microscopes, magnets, test tubes and other tools scientists use.',
    cards: textCards([
      ['🔬', 'Microscope'],
      ['🔭', 'Telescope'],
      ['🧲', 'Magnet'],
      ['🧪', 'Test tube'],
      ['🌡️', 'Thermometer'],
      ['⚖️', 'Scale'],
      ['🔍', 'Magnifying glass'],
      ['🧫', 'Petri dish'],
      ['🥽', 'Goggles'],
      ['🔋', 'Battery'],
      ['⏱️', 'Stopwatch'],
      ['📏', 'Ruler'],
    ]),
  },

  // Math
  {
    id: 'numbers-11-20',
    name: 'Numbers 11-20',
    subject: 'math',
    minAge: 4,
    description: 'The teen numbers, each with ten-frames to count: a full ten plus the ones.',
    cards: teenNumberCards(),
  },
  {
    id: '3d-shapes',
    name: '3D shapes',
    subject: 'math',
    minAge: 5,
    description: 'Cube, sphere, cylinder, cone, pyramid and prisms.',
    cards: shapeCards(),
  },
  {
    id: 'doubles',
    name: 'Doubles',
    subject: 'math',
    minAge: 5,
    description: 'Adding a number to itself, from 1 + 1 to 10 + 10.',
    cards: textCards(doubles),
  },
  {
    id: 'take-away',
    name: 'Take away',
    subject: 'math',
    minAge: 5,
    description: 'Subtracting within 10.',
    cards: textCards(takeAway),
  },
  {
    id: 'make-ten',
    name: 'Make 10',
    subject: 'math',
    minAge: 6,
    description: 'What goes with each number to make 10?',
    cards: textCards(makeTen),
  },
  {
    id: 'telling-time',
    name: 'Telling time',
    subject: 'math',
    minAge: 6,
    description: "O'clock, half past and quarter hours on a clock face.",
    cards: clockCards(),
  },
  {
    id: 'times-2',
    name: '2 times table',
    subject: 'math',
    minAge: 7,
    description: '2 × 1 up to 2 × 10.',
    cards: textCards(timesTable(2)),
  },
  {
    id: 'times-5',
    name: '5 times table',
    subject: 'math',
    minAge: 7,
    description: '5 × 1 up to 5 × 10.',
    cards: textCards(timesTable(5)),
  },
  {
    id: 'times-10',
    name: '10 times table',
    subject: 'math',
    minAge: 7,
    description: '10 × 1 up to 10 × 10.',
    cards: textCards(timesTable(10)),
  },
  {
    id: 'fractions',
    name: 'Fractions',
    subject: 'math',
    minAge: 7,
    description: 'Halves, thirds, quarters and more, shown as parts of a circle.',
    cards: fractionCards(),
  },

  // Reading
  {
    id: 'letters',
    name: 'Letters A-Z',
    subject: 'reading',
    minAge: 3,
    description: 'Every letter, big and small. Kids hear a letter and find it.',
    cards: textCards(letters),
  },
  {
    id: 'opposites',
    name: 'Opposites',
    subject: 'reading',
    minAge: 4,
    description: 'Big and small, hot and cold, fast and slow.',
    cards: textCards([
      ['🐘', 'Big'],
      ['🐭', 'Small'],
      ['🔥', 'Hot'],
      ['🧊', 'Cold'],
      ['☀️', 'Day'],
      ['🌙', 'Night'],
      ['🐇', 'Fast'],
      ['🐢', 'Slow'],
      ['⬆️', 'Up'],
      ['⬇️', 'Down'],
      ['📢', 'Loud'],
      ['🤫', 'Quiet'],
    ]),
  },
  {
    id: 'sight-words-1',
    name: 'Sight words 1',
    subject: 'reading',
    minAge: 5,
    description: 'The first words kids learn to read at a glance. Kids hear a word and find it.',
    cards: textCards(
      sightWords(['the', 'and', 'a', 'to', 'I', 'you', 'it', 'in', 'is', 'said', 'for', 'up', 'look', 'go', 'we', 'see', 'my', 'can', 'me', 'play']),
      { background: '#fef9c3' },
    ),
  },
  {
    id: 'sight-words-2',
    name: 'Sight words 2',
    subject: 'reading',
    minAge: 5,
    description: 'The next twenty sight words.',
    cards: textCards(
      sightWords(['big', 'blue', 'come', 'down', 'find', 'funny', 'help', 'here', 'jump', 'little', 'make', 'not', 'one', 'red', 'run', 'three', 'two', 'where', 'yellow', 'away']),
      { background: '#dcfce7' },
    ),
  },

  // World languages
  {
    id: 'spanish-animals',
    name: 'Spanish: animals',
    subject: 'languages',
    minAge: 3,
    lang: 'es-MX',
    description: 'El perro, el gato and more, read aloud in Spanish.',
    cards: textCards(
      [
        ['🐶', 'el perro'],
        ['🐱', 'el gato'],
        ['🐦', 'el pájaro'],
        ['🐟', 'el pez'],
        ['🐮', 'la vaca'],
        ['🐴', 'el caballo'],
        ['🐷', 'el cerdo'],
        ['🐑', 'la oveja'],
        ['🐭', 'el ratón'],
        ['🐻', 'el oso'],
        ['🦁', 'el león'],
        ['🐘', 'el elefante'],
      ],
      { lang: 'es-MX' },
    ),
  },
  {
    id: 'spanish-colors',
    name: 'Spanish: colors',
    subject: 'languages',
    minAge: 3,
    lang: 'es-MX',
    description: 'Rojo, azul, amarillo and more, read aloud in Spanish.',
    cards: colorCards(
      [
        ['#ef4444', 'rojo'],
        ['#3b82f6', 'azul'],
        ['#facc15', 'amarillo'],
        ['#22c55e', 'verde'],
        ['#fb923c', 'naranja'],
        ['#a855f7', 'morado'],
        ['#f472b6', 'rosa'],
        ['#b45309', 'café'],
        ['#111827', 'negro'],
        ['#f8fafc', 'blanco'],
        ['#9ca3af', 'gris'],
      ],
      'es-MX',
    ),
  },
  {
    id: 'spanish-numbers',
    name: 'Spanish: numbers 1-10',
    subject: 'languages',
    minAge: 3,
    lang: 'es-MX',
    description: 'Uno to diez, read aloud in Spanish.',
    cards: numberWordCards(['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'], 'es-MX'),
  },
  {
    id: 'spanish-food',
    name: 'Spanish: food',
    subject: 'languages',
    minAge: 3,
    lang: 'es-MX',
    description: 'La manzana, el pan, la leche and more, read aloud in Spanish.',
    cards: textCards(
      [
        ['🍎', 'la manzana'],
        ['🍌', 'el plátano'],
        ['🍇', 'las uvas'],
        ['🍓', 'la fresa'],
        ['🍊', 'la naranja'],
        ['🍞', 'el pan'],
        ['🧀', 'el queso'],
        ['🥚', 'el huevo'],
        ['🥛', 'la leche'],
        ['💧', 'el agua'],
        ['🍦', 'el helado'],
        ['🍪', 'la galleta'],
      ],
      { lang: 'es-MX' },
    ),
  },
  {
    id: 'french-animals',
    name: 'French: animals',
    subject: 'languages',
    minAge: 3,
    lang: 'fr-FR',
    description: 'Le chien, le chat and more, read aloud in French.',
    cards: textCards(
      [
        ['🐶', 'le chien'],
        ['🐱', 'le chat'],
        ['🐦', "l'oiseau"],
        ['🐟', 'le poisson'],
        ['🐮', 'la vache'],
        ['🐴', 'le cheval'],
        ['🐷', 'le cochon'],
        ['🐑', 'le mouton'],
        ['🐭', 'la souris'],
        ['🐻', "l'ours"],
        ['🦁', 'le lion'],
        ['🐘', "l'éléphant"],
      ],
      { lang: 'fr-FR' },
    ),
  },
  {
    id: 'french-colors',
    name: 'French: colors',
    subject: 'languages',
    minAge: 3,
    lang: 'fr-FR',
    description: 'Rouge, bleu, jaune and more, read aloud in French.',
    cards: colorCards(
      [
        ['#ef4444', 'rouge'],
        ['#3b82f6', 'bleu'],
        ['#facc15', 'jaune'],
        ['#22c55e', 'vert'],
        ['#fb923c', 'orange'],
        ['#a855f7', 'violet'],
        ['#f472b6', 'rose'],
        ['#b45309', 'marron'],
        ['#111827', 'noir'],
        ['#f8fafc', 'blanc'],
        ['#9ca3af', 'gris'],
      ],
      'fr-FR',
    ),
  },
  {
    id: 'french-numbers',
    name: 'French: numbers 1-10',
    subject: 'languages',
    minAge: 3,
    lang: 'fr-FR',
    description: 'Un to dix, read aloud in French.',
    cards: numberWordCards(['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'], 'fr-FR'),
  },
  {
    id: 'french-food',
    name: 'French: food',
    subject: 'languages',
    minAge: 3,
    lang: 'fr-FR',
    description: 'La pomme, le pain, le lait and more, read aloud in French.',
    cards: textCards(
      [
        ['🍎', 'la pomme'],
        ['🍌', 'la banane'],
        ['🍇', 'le raisin'],
        ['🍓', 'la fraise'],
        ['🍊', "l'orange"],
        ['🍞', 'le pain'],
        ['🧀', 'le fromage'],
        ['🥚', "l'œuf"],
        ['🥛', 'le lait'],
        ['💧', "l'eau"],
        ['🍦', 'la glace'],
        ['🍰', 'le gâteau'],
      ],
      { lang: 'fr-FR' },
    ),
  },

  // Computers
  {
    id: 'computer-parts',
    name: 'Computer parts',
    subject: 'computers',
    minAge: 4,
    description: 'Keyboard, mouse, screen and the other parts of computers.',
    cards: textCards([
      ['🖥️', 'Computer'],
      ['💻', 'Laptop'],
      ['⌨️', 'Keyboard'],
      ['🖱️', 'Mouse'],
      ['🖨️', 'Printer'],
      ['📱', 'Phone'],
      ['🎧', 'Headphones'],
      ['🎤', 'Microphone'],
      ['📷', 'Camera'],
      ['🔋', 'Battery'],
      ['🔌', 'Plug'],
      ['🕹️', 'Joystick'],
    ]),
  },
  {
    id: 'coding-words',
    name: 'Coding words',
    subject: 'computers',
    minAge: 6,
    description: 'Words from beginner coding lessons, each with a picture to remember it by.',
    cards: textCards([
      ['📋', 'Algorithm'],
      ['👣', 'Sequence'],
      ['🔁', 'Loop'],
      ['🚦', 'Condition'],
      ['📦', 'Variable'],
      ['👆', 'Event'],
      ['⌨️', 'Input'],
      ['🖨️', 'Output'],
      ['🐛', 'Bug'],
      ['🔧', 'Debug'],
      ['📜', 'Program'],
      ['🤖', 'Robot'],
    ]),
  },
  {
    id: 'binary',
    name: 'Binary numbers',
    subject: 'computers',
    minAge: 8,
    description: 'How computers count: 0000 to 1111 in binary is 0 to 15.',
    cards: textCards(binary, { background: '#e0e7ff' }),
  },

  // Music and sports
  {
    id: 'instruments',
    name: 'Instruments',
    subject: 'music',
    minAge: 3,
    description: 'Drums, guitar, piano and more.',
    cards: textCards([
      ['🥁', 'Drum'],
      ['🎸', 'Guitar'],
      ['🎹', 'Piano'],
      ['🎺', 'Trumpet'],
      ['🎻', 'Violin'],
      ['🎷', 'Saxophone'],
      ['🪕', 'Banjo'],
      ['🔔', 'Bell'],
    ]),
  },
  {
    id: 'sports',
    name: 'Sports',
    subject: 'music',
    minAge: 3,
    description: 'Balls, bats, bikes and skates.',
    cards: textCards([
      ['⚽', 'Soccer'],
      ['🏀', 'Basketball'],
      ['⚾', 'Baseball'],
      ['🏈', 'Football'],
      ['🎾', 'Tennis'],
      ['🏐', 'Volleyball'],
      ['🏒', 'Hockey'],
      ['🏊', 'Swimming'],
      ['🚴', 'Biking'],
      ['⛸️', 'Skating'],
      ['⛳', 'Golf'],
      ['🎳', 'Bowling'],
    ]),
  },
];
