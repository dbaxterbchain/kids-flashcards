import { uniqueSetName } from './setPackage';
import { FlashcardData, FlashcardSet } from './types';

export const LIBRARY_SUBJECTS = [
  { id: 'animals', label: 'Animals' },
  { id: 'everyday', label: 'Everyday words' },
  { id: 'people', label: 'Feelings and people' },
  { id: 'science', label: 'Science and nature' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
  { id: 'languages', label: 'World languages' },
  { id: 'world', label: 'The world' },
  { id: 'computers', label: 'Computers' },
  { id: 'music', label: 'Music and sports' },
] as const;

export type LibrarySubject = (typeof LIBRARY_SUBJECTS)[number]['id'];

/** A card as the library describes it. It becomes a regular card when a grown-up adds the set. */
export type LibraryCard = Pick<
  FlashcardData,
  'name' | 'imageUrl' | 'frontText' | 'backgroundColor' | 'lang' | 'prompt' | 'explain'
> & {
  /** Unique within its set and part of the card's id, so adding a set again doesn't make copies. */
  key: string;
  /** Emoji the card showed in earlier versions of the library, replaced by a drawing that works everywhere. */
  previousFronts?: string[];
};

export type LibrarySet = {
  id: string;
  name: string;
  subject: LibrarySubject;
  /** The youngest age the set is meant for. */
  minAge: number;
  description: string;
  /** The language the cards are read aloud in, for world-language sets. */
  lang?: string;
  /** "How this set works", for sets with ideas that need explaining. */
  about?: string;
  cards: LibraryCard[];
};

export const librarySetId = (entry: Pick<LibrarySet, 'id'>) => `library-${entry.id}`;

export const libraryCardId = (entry: Pick<LibrarySet, 'id'>, card: Pick<LibraryCard, 'key'>) =>
  `library-${entry.id}-${card.key}`;

/** The ready-made sets. They're loaded only when a grown-up opens the library, to keep the app quick to start. */
export const loadLibrary = () => import('./librarySets').then((module) => module.LIBRARY_SETS);

/**
 * Turns a library set into a set and cards for this device. Cards still here from an earlier add
 * (say the set was deleted but its cards kept) are reused as they are, including any edits.
 */
export function prepareLibrarySet(
  entry: LibrarySet,
  existingSets: FlashcardSet[],
  existingCards: FlashcardData[],
  now = Date.now(),
) {
  const set: FlashcardSet = { id: librarySetId(entry), name: uniqueSetName(entry.name, existingSets), about: entry.about };
  const byId = new Map(existingCards.map((card) => [card.id, card]));
  const cards = entry.cards.map((card, index): FlashcardData => {
    const id = libraryCardId(entry, card);
    const existing = byId.get(id);
    if (existing) {
      return { ...existing, ...newerPicture(existing, card), setIds: [...new Set([...(existing.setIds ?? []), set.id])] };
    }
    const { key: _key, previousFronts: _previousFronts, ...content } = card;
    // Counting down keeps the library's order, since sets show their newest cards first.
    return { ...content, id, setIds: [set.id], createdAt: now - index };
  });
  return { set, cards };
}

/**
 * The library's drawing for a card that still shows an emoji the library used to use (one that some
 * devices can't show). Cards a family gave their own picture keep it.
 */
function newerPicture(card: FlashcardData, libraryCard: LibraryCard): Partial<FlashcardData> | null {
  const outdated = !card.imageUrl && card.frontText && libraryCard.previousFronts?.includes(card.frontText);
  return outdated ? { imageUrl: libraryCard.imageUrl, frontText: libraryCard.frontText } : null;
}

/** What the library can add to a set a family already has, without changing anything they've written. */
export type LibraryUpdate = {
  /** The family's set, with the library's "How this set works" when it didn't have one. */
  set: FlashcardSet;
  /** Cards given a "How it works" explanation, a talk-about-it question or a picture they didn't have. */
  cards: FlashcardData[];
  explanations: number;
  prompts: number;
  /** Emoji some devices can't show, replaced with the library's drawings. */
  pictures: number;
  /** Whether the set gets the library's "How this set works". */
  about: boolean;
};

/**
 * Finds what's new in the library for a set added from it before: explanations, questions, an
 * introduction and drawings for emoji some devices can't show, filled in only where they're missing.
 * Cards a family renamed are left alone, since they may not be about the same thing any more, and
 * cards they deleted stay deleted.
 */
export function libraryUpdate(entry: LibrarySet, sets: FlashcardSet[], cards: FlashcardData[]): LibraryUpdate | null {
  const set = sets.find((candidate) => candidate.id === librarySetId(entry));
  if (!set) return null;
  const byId = new Map(cards.map((card) => [card.id, card]));
  let explanations = 0;
  let prompts = 0;
  let pictures = 0;
  const updated: FlashcardData[] = [];
  for (const libraryCard of entry.cards) {
    const card = byId.get(libraryCardId(entry, libraryCard));
    if (!card || card.name !== libraryCard.name) continue;
    const explain = !card.explain && libraryCard.explain ? libraryCard.explain : undefined;
    const prompt = !card.prompt && libraryCard.prompt ? libraryCard.prompt : undefined;
    const picture = newerPicture(card, libraryCard);
    if (!explain && !prompt && !picture) continue;
    if (explain) explanations += 1;
    if (prompt) prompts += 1;
    if (picture) pictures += 1;
    updated.push({ ...card, ...(explain ? { explain } : {}), ...(prompt ? { prompt } : {}), ...picture });
  }
  const about = Boolean(entry.about && !set.about);
  if (updated.length === 0 && !about) return null;
  return { set: about ? { ...set, about: entry.about } : set, cards: updated, explanations, prompts, pictures, about };
}

const count = (value: number, word: string) => `${value} ${word}${value === 1 ? '' : 's'}`;

/** Describes an update in a few words, e.g. "16 “How it works” explanations and a new picture". */
export function describeLibraryUpdate({
  explanations,
  prompts,
  pictures,
  about,
}: Pick<LibraryUpdate, 'explanations' | 'prompts' | 'pictures' | 'about'>) {
  const parts = [
    explanations > 0 && count(explanations, '“How it works” explanation'),
    prompts > 0 && count(prompts, 'talk-about-it question'),
    pictures > 0 && (pictures === 1 ? 'a new picture' : `${pictures} new pictures`),
    about && 'a “How this set works” introduction',
  ].filter((part): part is string => Boolean(part));
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
