import { getAllCards, getAllSets, replaceCardsAndSets } from '../db/cardsDb';
import { getAllProgress, getProfiles, replaceProfilesAndProgress } from '../db/progressDb';
import { defaultPracticeSettings } from './practice';
import {
  isRecord,
  readCard,
  readDataUrl,
  readIds,
  readList,
  readNumber,
  readReview,
  readSet,
  readText,
  uniqueBy,
} from './sanitize';
import { SaveResult, shareOrDownloadJson } from './shareFile';
import { STORAGE_KEYS } from './storageKeys';
import { CardProgress, ChildProfile, FlashcardData, FlashcardSet, PracticeSettings, PromptMode } from './types';

export type { SaveResult } from './shareFile';

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

/** A problem with a backup or set file, worded for the person who picked it. */
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

/** Hands the backup file to the share sheet on phones and tablets, or downloads it everywhere else. */
export function saveBackupFile(backup: Backup): Promise<SaveResult> {
  return shareOrDownloadJson(backup, `kids-flashcards-backup-${backup.exportedAt.slice(0, 10)}.json`, 'Kids Flashcards backup');
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
    avatarImage: readDataUrl(value.avatarImage, 'image'),
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

/** Reads a backup file's text, keeping only what's safe and recognizable. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("That file isn't a Kids Flashcards backup.");
  }
  if (isRecord(data) && data.format === 'kids-flashcards-set') {
    throw new BackupError('That file is a single set. To add it, use Import a set under Sets.');
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
