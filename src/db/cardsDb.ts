import { FlashcardData } from '../components/Flashcard';

const DB_NAME = 'kids-flashcards-db';
const STORE_NAME = 'cards';
const DB_VERSION = 1;

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
  };

  cachedDb = await requestToPromise(openRequest);
  return cachedDb;
}

async function getStore(mode: IDBTransactionMode) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
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
