// Flags drawn with simple shapes (flag emoji don't show on Windows). Emblems are simplified.

type Flag = { name: string; width: number; height: number; body: string; defs?: string };

const round = (value: number) => Math.round(value * 100) / 100;

/** A five-pointed star centered on (cx, cy), with one point aimed along `angle` (radians, 0 = up). */
function star(cx: number, cy: number, radius: number, fill: string, angle = 0) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const r = index % 2 === 0 ? radius : radius * 0.382;
    const a = angle + (index * Math.PI) / 5;
    return `${round(cx + r * Math.sin(a))},${round(cy - r * Math.cos(a))}`;
  }).join(' ');
  return `<polygon points="${points}" fill="${fill}"/>`;
}

const vertical = (width: number, height: number, colors: string[]) =>
  colors.map((color, index) => `<rect x="${round((index * width) / colors.length)}" y="0" width="${round(width / colors.length) + 0.5}" height="${height}" fill="${color}"/>`).join('');

const horizontal = (width: number, height: number, colors: string[]) =>
  colors.map((color, index) => `<rect x="0" y="${round((index * height) / colors.length)}" width="${width}" height="${round(height / colors.length) + 0.5}" fill="${color}"/>`).join('');

function unitedStates(): Flag {
  const width = 300;
  const height = round((300 * 10) / 19);
  const stripe = height / 13;
  const stripes = Array.from({ length: 13 }, (_, index) =>
    index % 2 === 0 ? `<rect x="0" y="${round(index * stripe)}" width="${width}" height="${round(stripe) + 0.3}" fill="#b22234"/>` : '',
  ).join('');
  const cantonWidth = width * 0.4;
  const cantonHeight = stripe * 7;
  const stars = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, column) =>
      star((cantonWidth / 12) * (row % 2 === 0 ? 1 + column * 2 : 2 + column * 2), (cantonHeight / 10) * (row + 1), 3.6, '#ffffff'),
    ).join(''),
  ).join('');
  return {
    name: 'United States',
    width,
    height,
    body: `<rect width="${width}" height="${height}" fill="#ffffff"/>${stripes}<rect width="${cantonWidth}" height="${round(cantonHeight)}" fill="#3c3b6e"/>${stars}`,
  };
}

function unitedKingdom(): Flag {
  const [width, height] = [300, 150];
  return {
    name: 'United Kingdom',
    width,
    height,
    defs: `<clipPath id="uk"><rect width="${width}" height="${height}"/></clipPath>`,
    body: `<g clip-path="url(#uk)"><rect width="${width}" height="${height}" fill="#012169"/>
      <path d="M0 0L300 150M300 0L0 150" stroke="#ffffff" stroke-width="30"/>
      <path d="M0 0L300 150M300 0L0 150" stroke="#c8102e" stroke-width="10"/>
      <rect x="0" y="50" width="300" height="50" fill="#ffffff"/><rect x="125" y="0" width="50" height="150" fill="#ffffff"/>
      <rect x="0" y="60" width="300" height="30" fill="#c8102e"/><rect x="135" y="0" width="30" height="150" fill="#c8102e"/></g>`,
  };
}

// A maple leaf with a stem, drawn in a 100 × 100 box.
const MAPLE_LEAF =
  'M50 2 L57 18 L66 13 L62 38 L76 24 L80 32 L96 28 L89 46 L96 50 L72 68 L76 78 L53 74 L54 98 L46 98 L47 74 L24 78 L28 68 L4 50 L11 46 L4 28 L20 32 L24 24 L38 38 L34 13 L43 18 Z';

function canada(): Flag {
  const [width, height] = [300, 150];
  return {
    name: 'Canada',
    width,
    height,
    body: `<rect width="${width}" height="${height}" fill="#ffffff"/><rect width="75" height="${height}" fill="#d52b1e"/><rect x="225" width="75" height="${height}" fill="#d52b1e"/>
      <path d="${MAPLE_LEAF}" fill="#d52b1e" transform="translate(107 32) scale(0.86)"/>`,
  };
}

function mexico(): Flag {
  const [width, height] = [300, 171];
  return {
    name: 'Mexico',
    width,
    height,
    body: `${vertical(width, height, ['#006847', '#ffffff', '#ce1126'])}
      <path d="M126 104 Q150 128 174 104" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="150" cy="84" rx="15" ry="20" fill="#8b5a2b"/><circle cx="154" cy="66" r="7" fill="#8b5a2b"/>`,
  };
}

function brazil(): Flag {
  const [width, height] = [300, 210];
  return {
    name: 'Brazil',
    width,
    height,
    defs: `<clipPath id="globe"><circle cx="150" cy="105" r="52"/></clipPath>`,
    body: `<rect width="${width}" height="${height}" fill="#009c3b"/><polygon points="150,21 276,105 150,189 24,105" fill="#ffdf00"/>
      <circle cx="150" cy="105" r="52" fill="#002776"/>
      <path d="M92 94 Q160 70 208 118" fill="none" stroke="#ffffff" stroke-width="9" clip-path="url(#globe)"/>`,
  };
}

function china(): Flag {
  const [width, height] = [300, 200];
  const unit = height / 20;
  const big = star(5 * unit, 5 * unit, 3 * unit, '#ffde00');
  const small = [
    [10, 2],
    [12, 4],
    [12, 7],
    [10, 9],
  ]
    .map(([x, y]) => star(x * unit, y * unit, unit, '#ffde00', Math.atan2(5 - x, -(5 - y))))
    .join('');
  return { name: 'China', width, height, body: `<rect width="${width}" height="${height}" fill="#ee1c25"/>${big}${small}` };
}

function india(): Flag {
  const [width, height] = [300, 200];
  const spokes = Array.from({ length: 24 }, (_, index) => {
    const angle = (index * Math.PI) / 12;
    return `<line x1="150" y1="100" x2="${round(150 + 25 * Math.sin(angle))}" y2="${round(100 - 25 * Math.cos(angle))}" stroke="#000080" stroke-width="1.6"/>`;
  }).join('');
  return {
    name: 'India',
    width,
    height,
    body: `${horizontal(width, height, ['#ff9933', '#ffffff', '#138808'])}<circle cx="150" cy="100" r="26" fill="none" stroke="#000080" stroke-width="4"/>${spokes}<circle cx="150" cy="100" r="5" fill="#000080"/>`,
  };
}

function greece(): Flag {
  const [width, height] = [300, 200];
  const stripe = height / 9;
  const stripes = Array.from({ length: 9 }, (_, index) =>
    index % 2 === 0 ? `<rect x="0" y="${round(index * stripe)}" width="${width}" height="${round(stripe) + 0.3}" fill="#0d5eaf"/>` : '',
  ).join('');
  const canton = stripe * 5;
  return {
    name: 'Greece',
    width,
    height,
    body: `<rect width="${width}" height="${height}" fill="#ffffff"/>${stripes}<rect width="${round(canton)}" height="${round(canton)}" fill="#0d5eaf"/>
      <rect x="0" y="${round(stripe * 2)}" width="${round(canton)}" height="${round(stripe)}" fill="#ffffff"/><rect x="${round(stripe * 2)}" y="0" width="${round(stripe)}" height="${round(canton)}" fill="#ffffff"/>`,
  };
}

const simple = (name: string, width: number, height: number, body: string): Flag => ({ name, width, height, body });

export const FLAGS: Flag[] = [
  simple('Japan', 300, 200, '<rect width="300" height="200" fill="#ffffff"/><circle cx="150" cy="100" r="60" fill="#bc002d"/>'),
  simple('France', 300, 200, vertical(300, 200, ['#0055a4', '#ffffff', '#ef4135'])),
  simple('Italy', 300, 200, vertical(300, 200, ['#009246', '#ffffff', '#ce2b37'])),
  simple('Germany', 300, 180, horizontal(300, 180, ['#000000', '#dd0000', '#ffce00'])),
  simple('Ireland', 300, 150, vertical(300, 150, ['#169b62', '#ffffff', '#ff883e'])),
  simple('Nigeria', 300, 150, vertical(300, 150, ['#008751', '#ffffff', '#008751'])),
  simple('Ukraine', 300, 200, horizontal(300, 200, ['#0057b7', '#ffd700'])),
  simple(
    'Sweden',
    300,
    188,
    '<rect width="300" height="188" fill="#006aa7"/><rect x="94" width="37" height="188" fill="#fecc00"/><rect y="75" width="300" height="38" fill="#fecc00"/>',
  ),
  simple(
    'Switzerland',
    200,
    200,
    '<rect width="200" height="200" fill="#da291c"/><rect x="81" y="38" width="38" height="124" fill="#ffffff"/><rect x="38" y="81" width="124" height="38" fill="#ffffff"/>',
  ),
  greece(),
  unitedStates(),
  unitedKingdom(),
  canada(),
  mexico(),
  brazil(),
  china(),
  india(),
];

/** A flag centered on a 300 × 300 card, with a thin edge so white flags don't disappear. */
export function flagImage(flag: Flag) {
  const x = round((300 - flag.width) / 2);
  const y = round((300 - flag.height) / 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${
    flag.defs ? `<defs>${flag.defs}</defs>` : ''
  }<g transform="translate(${x} ${y})">${flag.body}<rect width="${flag.width}" height="${flag.height}" fill="none" stroke="#94a3b8" stroke-width="1.5"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s*\n\s*/g, ''))}`;
}
