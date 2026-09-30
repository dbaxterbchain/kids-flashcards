import { BackupError } from './backup';
import { slugifySetName } from './fileUtils';
import { isRecord, readCard, readList, readNumber, readText, uniqueBy } from './sanitize';
import { SaveResult, shareOrDownloadJson } from './shareFile';
import { FlashcardData, FlashcardSet, UNCATEGORIZED_SET_ID } from './types';

const SET_FORMAT = 'kids-flashcards-set';
const SET_VERSION = 1;

/** A set file that reached the app from outside (shared to it, or opened with it). */
export type IncomingSet = { pkg: SetPackage } | { error: string };

/** One set and its cards (pictures and recordings included), as shared between families. */
export type SetPackage = {
  format: typeof SET_FORMAT;
  version: number;
  exportedAt: string;
  name: string;
  cards: FlashcardData[];
};

/** Packs a set for sharing. Each child's progress and the card's other sets stay behind. */
export function createSetPackage(name: string, cards: FlashcardData[]): SetPackage {
  return {
    format: SET_FORMAT,
    version: SET_VERSION,
    exportedAt: new Date().toISOString(),
    name,
    cards: cards.map(({ review: _review, setIds: _setIds, ...card }) => card),
  };
}

export function saveSetFile(pkg: SetPackage): Promise<SaveResult> {
  return shareOrDownloadJson(pkg, `${slugifySetName(pkg.name)}-flashcards.json`, `${pkg.name} flashcards`);
}

/** Reads a shared set file, keeping only what's safe and recognizable. */
export function parseSetPackage(text: string): SetPackage {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("That file isn't a Kids Flashcards set.");
  }
  if (isRecord(data) && data.format === 'kids-flashcards-backup') {
    throw new BackupError('That file is a full backup. To use it, choose Restore from a backup under Settings.');
  }
  if (!isRecord(data) || data.format !== SET_FORMAT) {
    throw new BackupError("That file isn't a Kids Flashcards set.");
  }
  const version = readNumber(data.version);
  if (version === undefined || version > SET_VERSION) {
    throw new BackupError('This set was made by a newer version of Kids Flashcards. Update the app, then try again.');
  }
  // Newest first, the way the set was shown where it came from.
  const cards = uniqueBy(readList(data.cards, readCard), (card) => card.id).sort((a, b) => b.createdAt - a.createdAt);
  if (cards.length === 0) throw new BackupError('That set has no cards in it.');
  return {
    format: SET_FORMAT,
    version: SET_VERSION,
    exportedAt: readText(data.exportedAt, 40) ?? new Date(0).toISOString(),
    name: readText(data.name, 60)?.trim() || 'Shared set',
    cards,
  };
}

/** An id for a new set that no existing set (or the "No set" group) uses. */
export function uniqueSetId(name: string, takenIds: Iterable<string>) {
  const taken = new Set([...takenIds, UNCATEGORIZED_SET_ID]);
  const base = slugifySetName(name);
  let id = base;
  for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
  return id;
}

/** A name no existing set uses: "Animals", then "Animals (2)", and so on. */
export function uniqueSetName(name: string, existing: FlashcardSet[]) {
  const names = new Set(existing.map((set) => set.name.trim().toLowerCase()));
  let candidate = name;
  for (let copy = 2; names.has(candidate.toLowerCase()); copy += 1) candidate = `${name} (${copy})`;
  return candidate;
}

type ImportIds = {
  setId: string;
  cardId: (index: number) => string;
};

/**
 * Turns a package into a new set with its own copies of the cards, so importing never changes
 * anything already on the device. The cards keep the package's order (newest first).
 */
export function prepareSetImport(pkg: SetPackage, existing: FlashcardSet[], ids: ImportIds, now = Date.now()) {
  const set: FlashcardSet = { id: ids.setId, name: uniqueSetName(pkg.name, existing) };
  const cards: FlashcardData[] = pkg.cards.map(({ review: _review, ...card }, index) => ({
    ...card,
    id: ids.cardId(index),
    setIds: [set.id],
    createdAt: now - index,
  }));
  return { set, cards };
}
