import { getAllCards, getAllSets, replaceCardsAndSets } from '../db/cardsDb';
import { getAllProgress, getProfiles, replaceProfilesAndProgress } from '../db/progressDb';
import { defaultPracticeSettings } from './practice';
import { STORAGE_KEYS } from './storageKeys';
import {
  CardProgress,
  ChildProfile,
  FlashcardData,
  FlashcardReview,
  FlashcardSet,
  PracticeSettings,
  PromptMode,
} from './types';

const BACKUP_FORMAT = 'kids-flashcards-backup';
const BACKUP_VERSION = 1;

export type BackupSettings = {
  hiddenSetIds: string[];
  speakOnFlip: boolean;
};

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  cards: FlashcardData[];
  sets: FlashcardSet[];
  profiles: ChildProfile[];
  progress: CardProgress[];
  settings: BackupSettings;
};

/** A problem with a backup file, worded for the person who picked it. */
export class BackupError extends Error {}

/** Gathers everything saved on this device into one backup. */
export async function createBackup(settings: BackupSettings): Promise<Backup> {
  const [cards, sets, profiles, progress] = await Promise.all([getAllCards(), getAllSets(), getProfiles(), getAllProgress()]);
  const cardIds = new Set(cards.map((card) => card.id));
  const profileIds = new Set(profiles.map((profile) => profile.id));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cards,
    sets,
    profiles,
    // Progress for deleted cards or children isn't worth carrying along.
    progress: progress.filter((record) => cardIds.has(record.cardId) && profileIds.has(record.profileId)),
    settings,
  };
}

export type SaveResult = 'shared' | 'downloaded' | 'cancelled';

/** Hands the backup file to the share sheet on phones and tablets, or downloads it everywhere else. */
export async function saveBackupFile(backup: Backup): Promise<SaveResult> {
  const fileName = `kids-flashcards-backup-${backup.exportedAt.slice(0, 10)}.json`;
  const file = new File([JSON.stringify(backup)], fileName, { type: 'application/json' });

  const touchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (touchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Kids Flashcards backup' });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Sharing isn't available right now; fall back to a download.
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

// Backup files may come from someone else, so only known fields and safe values are kept: pictures
// and recordings must be embedded data (never links that would load from elsewhere), and colors
// must be plain hex colors.
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const readText = (value: unknown, maxLength: number) => (typeof value === 'string' ? value.slice(0, maxLength) : undefined);
const readNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
const readDataUrl = (value: unknown, kind: 'image' | 'audio') =>
  typeof value === 'string' && value.startsWith(`data:${kind}/`) ? value : undefined;
// Hex colors, rgb()/hsl() with plain numbers, or a color name like "red" (cards made before the color
// picker could hold any text). Nothing that could contain url() or other CSS gets through.
const COLOR_PATTERNS = [/^#[0-9a-f]{3,8}$/i, /^(rgb|hsl)a?\([\d\s.,%/+-]{1,60}\)$/i, /^[a-z]{3,20}$/i];
const readColor = (value: unknown) =>
  typeof value === 'string' && COLOR_PATTERNS.some((pattern) => pattern.test(value.trim())) ? value.trim() : undefined;
const readIds = (value: unknown) =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && id.length <= 100) : [];

function readReview(value: unknown): FlashcardReview | undefined {
  if (!isRecord(value)) return undefined;
  const nextReviewAt = readNumber(value.nextReviewAt);
  const intervalDays = readNumber(value.intervalDays);
  const easeFactor = readNumber(value.easeFactor);
  const reviewCount = readNumber(value.reviewCount);
  if (nextReviewAt === undefined || intervalDays === undefined || easeFactor === undefined || reviewCount === undefined) {
    return undefined;
  }
  return {
    lastReviewedAt: readNumber(value.lastReviewedAt) ?? null,
    nextReviewAt,
    intervalDays,
    easeFactor,
    reviewCount,
    lastCorrect: typeof value.lastCorrect === 'boolean' ? value.lastCorrect : undefined,
  };
}

function readCard(value: unknown): FlashcardData | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 100);
  const name = readText(value.name, 200)?.trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    imageUrl: readDataUrl(value.imageUrl, 'image') ?? '',
    frontText: readText(value.frontText, 200)?.trim() || undefined,
    createdAt: readNumber(value.createdAt) ?? Date.now(),
    audioUrl: readDataUrl(value.audioUrl, 'audio'),
    setIds: readIds(value.setIds),
    backgroundColor: readColor(value.backgroundColor),
    review: readReview(value.review),
  };
}

function readSet(value: unknown): FlashcardSet | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 100);
  const name = readText(value.name, 100)?.trim();
  return id && name ? { id, name } : null;
}

const PROMPT_MODES: PromptMode[] = ['find-picture', 'name-picture', 'mix'];

function readSettings(value: unknown): PracticeSettings {
  const defaults = defaultPracticeSettings();
  if (!isRecord(value)) return defaults;
  const choiceCount = readNumber(value.choiceCount);
  const roundSize = readNumber(value.roundSize);
  return {
    setIds: value.setIds === null ? null : Array.isArray(value.setIds) ? readIds(value.setIds) : defaults.setIds,
    choiceCount: choiceCount ? Math.min(4, Math.max(2, Math.round(choiceCount))) : defaults.choiceCount,
    promptMode: PROMPT_MODES.includes(value.promptMode as PromptMode) ? (value.promptMode as PromptMode) : defaults.promptMode,
    roundSize: roundSize && roundSize >= 1 ? Math.min(50, Math.round(roundSize)) : defaults.roundSize,
    readAloud: typeof value.readAloud === 'boolean' ? value.readAloud : defaults.readAloud,
    soundEffects: typeof value.soundEffects === 'boolean' ? value.soundEffects : defaults.soundEffects,
  };
}

function readProfile(value: unknown): ChildProfile | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 100);
  const name = readText(value.name, 24)?.trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    avatar: readText(value.avatar, 16) || '🦁',
    createdAt: readNumber(value.createdAt) ?? Date.now(),
    settings: readSettings(value.settings),
  };
}

function readProgress(value: unknown): CardProgress | null {
  if (!isRecord(value)) return null;
  const profileId = readText(value.profileId, 100);
  const cardId = readText(value.cardId, 100);
  const review = readReview(value);
  return profileId && cardId && review ? { ...review, profileId, cardId } : null;
}

// Later entries with the same id replace earlier ones.
function uniqueBy<T>(items: (T | null)[], key: (item: T) => string): T[] {
  const byKey = new Map<string, T>();
  items.forEach((item) => {
    if (item) byKey.set(key(item), item);
  });
  return [...byKey.values()];
}

const readList = <T>(value: unknown, read: (item: unknown) => T | null) => (Array.isArray(value) ? value.map(read) : []);

/** Reads a backup file's text, keeping only what's safe and recognizable. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("That file isn't a Kids Flashcards backup.");
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT) {
    throw new BackupError("That file isn't a Kids Flashcards backup.");
  }
  const version = readNumber(data.version);
  if (version === undefined || version > BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of Kids Flashcards. Update the app, then try again.');
  }

  const cards = uniqueBy(readList(data.cards, readCard), (card) => card.id);
  const profiles = uniqueBy(readList(data.profiles, readProfile), (profile) => profile.id);
  const cardIds = new Set(cards.map((card) => card.id));
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const settings = isRecord(data.settings) ? data.settings : {};

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: readText(data.exportedAt, 40) ?? new Date(0).toISOString(),
    cards,
    sets: uniqueBy(readList(data.sets, readSet), (set) => set.id),
    profiles,
    progress: uniqueBy(readList(data.progress, readProgress), (record) => `${record.profileId}\u0000${record.cardId}`).filter(
      (record) => cardIds.has(record.cardId) && profileIds.has(record.profileId),
    ),
    settings: {
      hiddenSetIds: readIds(settings.hiddenSetIds),
      speakOnFlip: typeof settings.speakOnFlip === 'boolean' ? settings.speakOnFlip : true,
    },
  };
}

/** Replaces everything on this device with the backup. Reload the page afterwards to show it. */
export async function restoreBackup(backup: Backup) {
  await replaceCardsAndSets(backup.cards, backup.sets);
  await replaceProfilesAndProgress(backup.profiles, backup.progress);
  try {
    window.localStorage.setItem(STORAGE_KEYS.hiddenSets, JSON.stringify(backup.settings.hiddenSetIds));
    window.localStorage.setItem(STORAGE_KEYS.speakOnFlip, JSON.stringify(backup.settings.speakOnFlip));
  } catch (error) {
    console.warn('Unable to restore settings from the backup', error);
  }
}
