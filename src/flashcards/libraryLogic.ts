import { SVG_FONT_STACK } from './defaultData';
import { LibraryCard } from './library';

// Logic gates for the set library: the standard symbols, drawn the same color so kids learn them by
// shape, and puzzles that fill in a gate's inputs and ask what comes out.

export type GateKind = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

type Bit = 0 | 1;

const INK = '#0f172a';
const BODY = '#fde68a';
// Wires carrying a 1 are lit up; wires carrying a 0 are gray.
const ON = '#f59e0b';
const OFF = '#94a3b8';

const round = (value: number) => Math.round(value * 10) / 10;

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${body}</svg>`,
  )}`;

const outline = `stroke="${INK}" stroke-width="7" stroke-linejoin="round"`;

const wire = (x1: number, y1: number, x2: number, y2: number, color = INK) =>
  `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;

const label = (x: number, y: number, text: string, size: number, fill = INK) =>
  `<text x="${round(x)}" y="${round(y)}" dominant-baseline="central" text-anchor="middle" fill="${fill}" font-family="${SVG_FONT_STACK}" font-size="${size}" font-weight="800">${text}</text>`;

type Point = { x: number; y: number };

/** A gate's symbol, with where its input wires meet it and where its output wire starts. */
type GateShape = { body: string; inputs: Point[]; output: Point; labelX: number };

const INPUT_HEIGHTS = [118, 182];

// OR-shaped gates have a curved back. This is where a wire at height y meets a back curve that runs
// from (backX, 90) to (backX, 210), bulging 34 to the right.
const curveX = (backX: number, y: number) => {
  const t = (y - 90) / 120;
  return backX + 68 * t * (1 - t);
};

// The little circle on a gate's tip means "flip the answer" (NOT).
const bubble = (tipX: number) => `<circle cx="${tipX + 9}" cy="150" r="9" fill="#ffffff" ${outline}/>`;

function gateShape(kind: GateKind): GateShape {
  const andBody = `<path d="M100 90 H152 A60 60 0 0 1 152 210 H100 Z" fill="${BODY}" ${outline}/>`;
  const orBody = `<path d="M92 90 Q182 90 222 150 Q182 210 92 210 Q126 150 92 90 Z" fill="${BODY}" ${outline}/>`;
  const xorBack = `<path d="M78 90 Q112 150 78 210" fill="none" ${outline} stroke-linecap="round"/>`;
  const andInputs = INPUT_HEIGHTS.map((y) => ({ x: 100, y }));
  const orInputs = INPUT_HEIGHTS.map((y) => ({ x: curveX(92, y), y }));
  const xorInputs = INPUT_HEIGHTS.map((y) => ({ x: curveX(78, y), y }));
  switch (kind) {
    case 'AND':
      return { body: andBody, inputs: andInputs, output: { x: 212, y: 150 }, labelX: 152 };
    case 'NAND':
      return { body: andBody + bubble(212), inputs: andInputs, output: { x: 230, y: 150 }, labelX: 152 };
    case 'OR':
      return { body: orBody, inputs: orInputs, output: { x: 222, y: 150 }, labelX: 160 };
    case 'NOR':
      return { body: orBody + bubble(222), inputs: orInputs, output: { x: 240, y: 150 }, labelX: 160 };
    case 'XOR':
      return { body: xorBack + orBody, inputs: xorInputs, output: { x: 222, y: 150 }, labelX: 160 };
    case 'XNOR':
      return { body: xorBack + orBody + bubble(222), inputs: xorInputs, output: { x: 240, y: 150 }, labelX: 160 };
    case 'NOT':
      return {
        body: `<path d="M104 96 L204 150 L104 204 Z" fill="${BODY}" ${outline}/>${bubble(204)}`,
        inputs: [{ x: 104, y: 150 }],
        output: { x: 222, y: 150 },
        labelX: 138,
      };
  }
}

/** A gate's symbol with its input and output wires, for learning to recognize it. */
export function gateImage(kind: GateKind) {
  const { body, inputs, output } = gateShape(kind);
  // Wires go first so the gate covers their ends.
  const wires = inputs.map(({ x, y }) => wire(30, y, x, y)).join('') + wire(output.x, output.y, 270, output.y);
  return svg(wires + body);
}

// Puzzles draw the gate a little smaller and to the left, to make room for the "?" on the right.
const PUZZLE_SCALE = 0.86;
const PUZZLE_SHIFT = -12;
const toPuzzle = ({ x, y }: Point) => ({
  x: 150 + (x - 150) * PUZZLE_SCALE + PUZZLE_SHIFT,
  y: 150 + (y - 150) * PUZZLE_SCALE,
});

const LABEL_SIZES: Record<GateKind, number> = { AND: 30, OR: 32, NOT: 22, NAND: 26, NOR: 28, XOR: 28, XNOR: 24 };

/** A gate with its name on it and its inputs filled in, asking what comes out. */
export function gatePuzzleImage(kind: GateKind, bits: Bit[]) {
  const shape = gateShape(kind);
  const inputs = shape.inputs.map(toPuzzle);
  const output = toPuzzle(shape.output);
  const wires = inputs
    .map(({ x, y }, index) => wire(56, y, x, y, bits[index] ? ON : OFF) + label(30, y, String(bits[index]), 40))
    .join('');
  const answer =
    wire(output.x, output.y, 236, output.y) +
    `<circle cx="260" cy="150" r="24" fill="#ffffff" ${outline}/>${label(260, 151, '?', 32)}`;
  const offset = 150 * (1 - PUZZLE_SCALE);
  const gate = `<g transform="translate(${round(offset + PUZZLE_SHIFT)} ${round(offset)}) scale(${PUZZLE_SCALE})">${
    shape.body
  }${label(shape.labelX, 150, kind, LABEL_SIZES[kind])}</g>`;
  return svg(wires + answer + gate);
}

/** What a gate gives out for its inputs. */
export function gateOutput(kind: GateKind, bits: Bit[]): Bit {
  const [a, b = 0] = bits;
  const result = {
    AND: a && b,
    OR: a || b,
    NOT: a ? 0 : 1,
    NAND: a && b ? 0 : 1,
    NOR: a || b ? 0 : 1,
    XOR: a === b ? 0 : 1,
    XNOR: a === b ? 1 : 0,
  }[kind];
  return result ? 1 : 0;
}

// --- Explanations ---------------------------------------------------------------------------------

const truthTable = (kind: GateKind) =>
  (kind === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]])
    .map((bits) => `${expression(kind, bits as Bit[])} = ${gateOutput(kind, bits as Bit[])}`)
    .join('\n');

const expression = (kind: GateKind, bits: Bit[]) => (kind === 'NOT' ? `NOT ${bits[0]}` : `${bits[0]} ${kind} ${bits[1]}`);

const GATE_EXPLANATIONS: Record<GateKind, [intro: string, outro: string]> = {
  AND: [
    'An AND gate gives out 1 only when input A and input B are both 1.',
    "It's like a flashlight with two switches in a row: it only lights up when both switches are on. You can spot an AND gate by its shape, flat at the back and round at the front, like a letter D.",
  ],
  OR: [
    'An OR gate gives out 1 when input A or input B is 1, or both are.',
    "It's like a doorbell with a button at the front door and another at the back: pressing either one rings the bell. Its shape has a curved back and a pointed front.",
  ],
  NOT: [
    'A NOT gate has just one input, and it flips it: 0 becomes 1, and 1 becomes 0.',
    "It's like a night light that turns on when the room light goes off. It's drawn as a triangle with a little circle on its tip. That little circle always means \"flip it\".",
  ],
  NAND: [
    'NAND means NOT AND. It gives the opposite of an AND gate: 0 only when both inputs are 1, and 1 the rest of the time.',
    "It's drawn as an AND gate with a little flip circle on its tip. Fun fact: you can build every other gate out of NAND gates alone!",
  ],
  NOR: [
    'NOR means NOT OR. It gives the opposite of an OR gate: 1 only when both inputs are 0.',
    "It's drawn as an OR gate with a little flip circle on its tip. Like NAND, you can build every other gate out of NOR gates alone.",
  ],
  XOR: [
    'XOR means "exclusive or": one or the other, but not both. It gives out 1 when its inputs are different.',
    "It's like a hallway light with a switch at each end: flipping either switch changes the light. It's drawn like an OR gate with an extra curve at the back. Computers use XOR gates to add numbers.",
  ],
  XNOR: [
    'XNOR means NOT XOR. It gives out 1 when both inputs are the same, and 0 when they are different.',
    "It's like a matching game: 1 for a match, 0 for no match. It's drawn as an XOR gate with a little flip circle on its tip.",
  ],
};

export const LOGIC_GATES_ABOUT = [
  'Inside every computer are billions of tiny switches. Wired together, they make logic gates. A logic gate takes in signals that are on (1) or off (0), follows one simple rule, and gives out a 1 or a 0.',
  'AND gives 1 only when both inputs are 1. OR gives 1 when at least one input is 1. NOT flips its input. XOR gives 1 when the inputs are different. NAND, NOR and XNOR give the opposite of AND, OR and XOR: the little circle on their tip means "flip the answer".',
  'Everything a computer does, from adding numbers to playing games, is built from logic gates.',
].join('\n');

export const LOGIC_PUZZLES_ABOUT = [
  'Each card shows a logic gate with its inputs filled in. A lit-up wire carries a 1, and a gray wire carries a 0. Work out what comes out: 1 or 0.',
  'Remember: AND needs both inputs to be 1. OR needs at least one. NOT flips its input. XOR needs the inputs to be different. NAND and NOR give the opposite of AND and OR.',
  'Learn the gates first with the Logic gates set, and tap the light bulb on any card to see how its answer works.',
].join('\n');

const GATE_RULES: Record<GateKind, string> = {
  AND: 'An AND gate gives out 1 only when both inputs are 1.',
  OR: 'An OR gate gives out 1 when at least one input is 1.',
  NOT: 'A NOT gate flips its input: 0 becomes 1 and 1 becomes 0.',
  NAND: 'A NAND gate gives the opposite of AND: 0 only when both inputs are 1.',
  NOR: 'A NOR gate gives the opposite of OR: 1 only when both inputs are 0.',
  XOR: 'An XOR gate gives out 1 when its inputs are different.',
  XNOR: 'An XNOR gate gives out 1 when its inputs are the same.',
};

function puzzleReason(kind: GateKind, bits: Bit[]) {
  const [a, b] = bits;
  const out = gateOutput(kind, bits);
  const ones = bits.filter(Boolean).length;
  const both = ones === 2 ? 'Both inputs are 1' : ones === 0 ? 'Both inputs are 0' : 'One input is 1 and the other is 0';
  switch (kind) {
    case 'NOT':
      return `The input is ${a}, so it flips to ${out}.`;
    case 'XOR':
    case 'XNOR':
      return `The inputs are ${a === b ? 'the same' : 'different'}, so the answer is ${out}.`;
    default:
      return `${both}, so the answer is ${out}.`;
  }
}

/** "How it works" for a gate puzzle: the rule, and why this answer follows from it. */
export const explainPuzzle = (kind: GateKind, bits: Bit[]) =>
  `${expression(kind, bits)} = ${gateOutput(kind, bits)}\n${GATE_RULES[kind]} ${puzzleReason(kind, bits)}`;

// --- Cards ----------------------------------------------------------------------------------------

const GATE_ORDER: GateKind[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];

export function logicGateCards(): LibraryCard[] {
  return GATE_ORDER.map((kind) => {
    const [intro, outro] = GATE_EXPLANATIONS[kind];
    return {
      key: kind.toLowerCase(),
      name: `${kind} gate`,
      imageUrl: gateImage(kind),
      backgroundColor: '#e0e7ff',
      explain: `${intro}\n${truthTable(kind)}\n${outro}`,
    };
  });
}

// Every input for the basic gates, and a couple for the others, with as many 1s as 0s to find.
const PUZZLES: [GateKind, Bit[]][] = [
  ['AND', [0, 0]],
  ['AND', [0, 1]],
  ['AND', [1, 0]],
  ['AND', [1, 1]],
  ['OR', [0, 0]],
  ['OR', [0, 1]],
  ['OR', [1, 0]],
  ['OR', [1, 1]],
  ['NOT', [0]],
  ['NOT', [1]],
  ['XOR', [0, 1]],
  ['XOR', [1, 1]],
  ['NAND', [1, 1]],
  ['NAND', [1, 0]],
  ['NOR', [0, 0]],
  ['NOR', [0, 1]],
];

export function logicPuzzleCards(): LibraryCard[] {
  return PUZZLES.map(([kind, bits]) => ({
    key: [kind.toLowerCase(), ...bits].join('-'),
    name: String(gateOutput(kind, bits)),
    imageUrl: gatePuzzleImage(kind, bits),
    backgroundColor: '#e0e7ff',
    explain: explainPuzzle(kind, bits),
  }));
}
