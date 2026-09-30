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
  { id: 'computers', label: 'Computers' },
  { id: 'music', label: 'Music and sports' },
] as const;

export type LibrarySubject = (typeof LIBRARY_SUBJECTS)[number]['id'];

/** A card as the library describes it. It becomes a regular card when a grown-up adds the set. */
export type LibraryCard = Pick<FlashcardData, 'name' | 'imageUrl' | 'frontText' | 'backgroundColor' | 'lang' | 'prompt'> & {
  /** Unique within its set and part of the card's id, so adding a set again doesn't make copies. */
  key: string;
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
  const set: FlashcardSet = { id: librarySetId(entry), name: uniqueSetName(entry.name, existingSets) };
  const byId = new Map(existingCards.map((card) => [card.id, card]));
  const cards = entry.cards.map((card, index): FlashcardData => {
    const id = libraryCardId(entry, card);
    const existing = byId.get(id);
    if (existing) return { ...existing, setIds: [...new Set([...(existing.setIds ?? []), set.id])] };
    const { key: _key, ...content } = card;
    // Counting down keeps the library's order, since sets show their newest cards first.
    return { ...content, id, setIds: [set.id], createdAt: now - index };
  });
  return { set, cards };
}
