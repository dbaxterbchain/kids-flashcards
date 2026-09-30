import { FlashcardData, FlashcardSet } from '../flashcards/types';

const DB_NAME = 'kids-flashcards-db-v1.1';
const STORE_NAME = 'cards';
const SET_STORE = 'sets';
const DB_VERSION = 2;

let cachedDb: IDBDatabase | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function openDb(): Promise<IDBDatabase> {
  if (cachedDb) return cachedDb;

  const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
  openRequest.onupgradeneeded = () => {
    const db = openRequest.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(SET_STORE)) {
      db.createObjectStore(SET_STORE, { keyPath: 'id' });
    }
  };

  cachedDb = await requestToPromise(openRequest);
  return cachedDb;
}

async function getStore(mode: IDBTransactionMode) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

async function getSetStore(mode: IDBTransactionMode) {
  const db = await openDb();
  const tx = db.transaction(SET_STORE, mode);
  return tx.objectStore(SET_STORE);
}

export async function getAllCards(): Promise<FlashcardData[]> {
  const store = await getStore('readonly');
  const request = store.getAll();
  return requestToPromise(request);
}

export async function putCards(cards: FlashcardData[]) {
  const store = await getStore('readwrite');
  await Promise.all(cards.map((card) => requestToPromise(store.put(card))));
}

export async function putCard(card: FlashcardData) {
  const store = await getStore('readwrite');
  await requestToPromise(store.put(card));
}

export async function deleteCard(id: string) {
  const store = await getStore('readwrite');
  await requestToPromise(store.delete(id));
}

export async function getAllSets(): Promise<FlashcardSet[]> {
  const store = await getSetStore('readonly');
  const request = store.getAll();
  return requestToPromise(request);
}

export async function putSets(sets: FlashcardSet[]) {
  const store = await getSetStore('readwrite');
  await Promise.all(sets.map((set) => requestToPromise(store.put(set))));
}

export async function putSet(set: FlashcardSet) {
  const store = await getSetStore('readwrite');
  await requestToPromise(store.put(set));
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Replaces every card and set in one transaction, so a failure leaves the old ones in place. */
export async function replaceCardsAndSets(cards: FlashcardData[], sets: FlashcardSet[]) {
  const db = await openDb();
  const tx = db.transaction([STORE_NAME, SET_STORE], 'readwrite');
  const cardStore = tx.objectStore(STORE_NAME);
  const setStore = tx.objectStore(SET_STORE);
  cardStore.clear();
  setStore.clear();
  cards.forEach((card) => cardStore.put(card));
  sets.forEach((set) => setStore.put(set));
  await transactionDone(tx);
}

/** Adds a set and its cards together, so a failure (like full storage) doesn't leave half a set. */
export async function addSetWithCards(set: FlashcardSet, cards: FlashcardData[]) {
  const db = await openDb();
  const tx = db.transaction([STORE_NAME, SET_STORE], 'readwrite');
  const cardStore = tx.objectStore(STORE_NAME);
  tx.objectStore(SET_STORE).put(set);
  cards.forEach((card) => cardStore.put(card));
  await transactionDone(tx);
}

/** Deletes a set, deleting some cards and saving changes to others in the same transaction. */
export async function deleteSetAndCards(setId: string, deletedCardIds: string[], updatedCards: FlashcardData[]) {
  const db = await openDb();
  const tx = db.transaction([STORE_NAME, SET_STORE], 'readwrite');
  const cardStore = tx.objectStore(STORE_NAME);
  tx.objectStore(SET_STORE).delete(setId);
  deletedCardIds.forEach((id) => cardStore.delete(id));
  updatedCards.forEach((card) => cardStore.put(card));
  await transactionDone(tx);
}
