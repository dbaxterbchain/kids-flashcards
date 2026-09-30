import { buildPracticeQueue, ProgressByCard } from './review';
import { FlashcardData, PracticeSettings, PromptMode, UNCATEGORIZED_SET_ID } from './types';

export type AvatarOption = { emoji: string; label: string; color: string };

// Emoji avatars in themes kids ask for. (Characters owned by studios, like Marvel heroes or Bluey,
// can't ship in the app; parents can use any picture of their own as a photo avatar instead.)
export const AVATAR_GROUPS: { label: string; avatars: AvatarOption[] }[] = [
  {
    label: 'Animals',
    avatars: [
      { emoji: '🦁', label: 'Lion', color: '#fde68a' },
      { emoji: '🐼', label: 'Panda', color: '#e2e8f0' },
      { emoji: '🦊', label: 'Fox', color: '#fed7aa' },
      { emoji: '🐸', label: 'Frog', color: '#bbf7d0' },
      { emoji: '🐰', label: 'Bunny', color: '#fbcfe8' },
      { emoji: '🐻', label: 'Bear', color: '#fde2c8' },
      { emoji: '🐨', label: 'Koala', color: '#cbd5e1' },
      { emoji: '🐯', label: 'Tiger', color: '#fdba74' },
      { emoji: '🐵', label: 'Monkey', color: '#fcd34d' },
      { emoji: '🦄', label: 'Unicorn', color: '#e9d5ff' },
      { emoji: '🐙', label: 'Octopus', color: '#fecdd3' },
      { emoji: '🐢', label: 'Turtle', color: '#a7f3d0' },
      { emoji: '🦖', label: 'Dinosaur', color: '#d9f99d' },
      { emoji: '🐳', label: 'Whale', color: '#bae6fd' },
      { emoji: '🐝', label: 'Bee', color: '#fef08a' },
      { emoji: '🐧', label: 'Penguin', color: '#c7d2fe' },
    ],
  },
  {
    label: 'Superheroes',
    avatars: [
      { emoji: '🦸', label: 'Superhero', color: '#fecaca' },
      { emoji: '🦸‍♀️', label: 'Super girl', color: '#fbcfe8' },
      { emoji: '🦸‍♂️', label: 'Super boy', color: '#bfdbfe' },
      { emoji: '🦹', label: 'Villain', color: '#e9d5ff' },
      { emoji: '🥷', label: 'Ninja', color: '#cbd5e1' },
      { emoji: '🛡️', label: 'Shield', color: '#fde68a' },
      { emoji: '⚡', label: 'Lightning', color: '#fef08a' },
      { emoji: '🕷️', label: 'Spider', color: '#fecdd3' },
    ],
  },
  {
    label: 'Puppies and pets',
    avatars: [
      { emoji: '🐶', label: 'Puppy', color: '#fde2c8' },
      { emoji: '🐕', label: 'Blue dog', color: '#93c5fd' },
      { emoji: '🦮', label: 'Orange dog', color: '#fdba74' },
      { emoji: '🐩', label: 'Poodle', color: '#fbcfe8' },
      { emoji: '🐱', label: 'Kitten', color: '#fef08a' },
      { emoji: '🐹', label: 'Hamster', color: '#fed7aa' },
      { emoji: '🐭', label: 'Mouse', color: '#e2e8f0' },
      { emoji: '🐠', label: 'Fish', color: '#a5f3fc' },
    ],
  },
  {
    label: 'Forest friends',
    avatars: [
      { emoji: '🌳', label: 'Tree friend', color: '#bbf7d0' },
      { emoji: '🌲', label: 'Pine tree', color: '#a7f3d0' },
      { emoji: '🍄', label: 'Mushroom', color: '#fecaca' },
      { emoji: '🦌', label: 'Deer', color: '#fde2c8' },
      { emoji: '🦉', label: 'Owl', color: '#e7e5e4' },
      { emoji: '🐿️', label: 'Squirrel', color: '#fed7aa' },
      { emoji: '🌻', label: 'Sunflower', color: '#fef08a' },
      { emoji: '🌿', label: 'Leaf', color: '#d9f99d' },
    ],
  },
  {
    label: 'Space and robots',
    avatars: [
      { emoji: '🚀', label: 'Rocket', color: '#bfdbfe' },
      { emoji: '👽', label: 'Alien', color: '#bbf7d0' },
      { emoji: '🤖', label: 'Robot', color: '#e2e8f0' },
      { emoji: '🛸', label: 'Flying saucer', color: '#e9d5ff' },
      { emoji: '🪐', label: 'Planet', color: '#fde68a' },
      { emoji: '⭐', label: 'Star', color: '#fef08a' },
      { emoji: '🌙', label: 'Moon', color: '#c7d2fe' },
      { emoji: '👩‍🚀', label: 'Astronaut', color: '#e0e7ff' },
    ],
  },
  {
    label: 'Fantasy',
    avatars: [
      { emoji: '🐉', label: 'Dragon', color: '#bbf7d0' },
      { emoji: '🧚', label: 'Fairy', color: '#fbcfe8' },
      { emoji: '🧜‍♀️', label: 'Mermaid', color: '#a5f3fc' },
      { emoji: '🧙', label: 'Wizard', color: '#c7d2fe' },
      { emoji: '🧞', label: 'Genie', color: '#bae6fd' },
      { emoji: '👑', label: 'Crown', color: '#fde68a' },
      { emoji: '🏰', label: 'Castle', color: '#e2e8f0' },
      { emoji: '🔮', label: 'Crystal ball', color: '#e9d5ff' },
    ],
  },
];

export const AVATARS: AvatarOption[] = AVATAR_GROUPS.flatMap((group) => group.avatars);

export const avatarColor = (emoji: string) => AVATARS.find((avatar) => avatar.emoji === emoji)?.color ?? '#e2e8f0';

export const AGE_PRESETS = [
  { id: '2-3', label: '2–3', settings: { choiceCount: 2, promptMode: 'find-picture', roundSize: 5 } },
  { id: '4-5', label: '4–5', settings: { choiceCount: 3, promptMode: 'find-picture', roundSize: 10 } },
  { id: '6+', label: '6+', settings: { choiceCount: 4, promptMode: 'mix', roundSize: 10 } },
] as const satisfies readonly {
  id: string;
  label: string;
  settings: Pick<PracticeSettings, 'choiceCount' | 'promptMode' | 'roundSize'>;
}[];

export const PROMPT_MODE_LABELS: Record<PromptMode, string> = {
  'find-picture': 'Find the picture',
  'name-picture': 'Name the picture',
  mix: 'Mixed questions',
};

export function defaultPracticeSettings(): PracticeSettings {
  return { setIds: null, ...AGE_PRESETS[0].settings, readAloud: true, soundEffects: true };
}

export function filterCardsForSets(cards: FlashcardData[], setIds: string[] | null) {
  if (setIds === null) return cards;
  const includeUncategorized = setIds.includes(UNCATEGORIZED_SET_ID);
  return cards.filter((card) => {
    const cardSets = card.setIds ?? [];
    if (cardSets.length === 0) return includeUncategorized;
    return cardSets.some((setId) => setIds.includes(setId));
  });
}

export function promptSideFor(mode: PromptMode, index: number): Exclude<PromptMode, 'mix'> {
  if (mode === 'mix') return index % 2 === 0 ? 'find-picture' : 'name-picture';
  return mode;
}

export function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function createSeededRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Picks the cards for one round: missed and due cards first, then the ones due soonest. */
export function buildRound(cards: FlashcardData[], progress: ProgressByCard, roundSize: number) {
  const { queue } = buildPracticeQueue(cards, progress);
  return shuffle(queue.slice(0, roundSize).map((card) => card.id));
}

const normalizeName = (name: string) => name.trim().toLowerCase();

/** The answer plus wrong answers, preferring cards from the same set so the choice is meaningful. */
export function buildOptions(correct: FlashcardData, pool: FlashcardData[], count: number, seed: number) {
  const random = createSeededRng(seed);
  const correctSets = new Set(correct.setIds ?? []);
  const usedNames = new Set([normalizeName(correct.name)]);
  const candidates = shuffle(
    pool.filter((card) => card.id !== correct.id),
    random,
  );
  const sameSet = candidates.filter((card) => (card.setIds ?? []).some((setId) => correctSets.has(setId)));
  const otherSets = candidates.filter((card) => !sameSet.includes(card));

  const distractors: FlashcardData[] = [];
  for (const card of [...sameSet, ...otherSets]) {
    if (distractors.length >= count - 1) break;
    // Two answers with the same name would make the question ambiguous.
    const name = normalizeName(card.name);
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    distractors.push(card);
  }
  return shuffle([correct, ...distractors], random);
}

export function formatTimeUntil(ms: number) {
  if (ms <= 0) return 'now';
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
