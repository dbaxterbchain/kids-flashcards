import { CardProgress, ChildProfile } from '../flashcards/types';

// Children and their practice progress live in their own database, so adding them didn't require a
// version upgrade of the cards database (which can stall while another tab still has it open).
const DB_NAME = 'kids-flashcards-progress';
const DB_VERSION = 1;
const PROFILE_STORE = 'profiles';
const PROGRESS_STORE = 'progress';

let dbPromise: Promise<IDBDatabase> | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PROFILE_STORE)) {
          db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
          db.createObjectStore(PROGRESS_STORE, { keyPath: ['profileId', 'cardId'] });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        // Let a future version upgrade this database instead of waiting on this tab.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

// Progress keys are [profileId, cardId]; an array sorts after every string, so this range covers
// every card for one child.
const profileRange = (profileId: string) => IDBKeyRange.bound([profileId], [profileId, []]);

export async function getProfiles(): Promise<ChildProfile[]> {
  const db = await openDb();
  return requestToPromise(db.transaction(PROFILE_STORE).objectStore(PROFILE_STORE).getAll());
}

export async function putProfile(profile: ChildProfile) {
  const db = await openDb();
  const tx = db.transaction(PROFILE_STORE, 'readwrite');
  tx.objectStore(PROFILE_STORE).put(profile);
  await transactionDone(tx);
}

export async function deleteProfile(profileId: string) {
  const db = await openDb();
  const tx = db.transaction([PROFILE_STORE, PROGRESS_STORE], 'readwrite');
  tx.objectStore(PROFILE_STORE).delete(profileId);
  tx.objectStore(PROGRESS_STORE).delete(profileRange(profileId));
  await transactionDone(tx);
}

export async function getProgress(profileId: string): Promise<CardProgress[]> {
  const db = await openDb();
  return requestToPromise(db.transaction(PROGRESS_STORE).objectStore(PROGRESS_STORE).getAll(profileRange(profileId)));
}

export async function putProgress(records: CardProgress[]) {
  if (records.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(PROGRESS_STORE, 'readwrite');
  const store = tx.objectStore(PROGRESS_STORE);
  records.forEach((record) => store.put(record));
  await transactionDone(tx);
}

export async function getAllProgress(): Promise<CardProgress[]> {
  const db = await openDb();
  return requestToPromise(db.transaction(PROGRESS_STORE).objectStore(PROGRESS_STORE).getAll());
}

/** Replaces every child and all progress in one transaction, so a failure leaves the old ones in place. */
export async function replaceProfilesAndProgress(profiles: ChildProfile[], progress: CardProgress[]) {
  const db = await openDb();
  const tx = db.transaction([PROFILE_STORE, PROGRESS_STORE], 'readwrite');
  const profileStore = tx.objectStore(PROFILE_STORE);
  const progressStore = tx.objectStore(PROGRESS_STORE);
  profileStore.clear();
  progressStore.clear();
  profiles.forEach((profile) => profileStore.put(profile));
  progress.forEach((record) => progressStore.put(record));
  await transactionDone(tx);
}
