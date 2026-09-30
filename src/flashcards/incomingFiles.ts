// Set files that reach the app from outside: shared to it from another app (Android's share sheet,
// via the service worker) or opened with it (on computers).

const SHARED_CACHE = 'kids-flashcards-shared';
const SHARED_SET_URL = '/shared-set';

/** The text of a file shared to the app, if one is waiting. It's handed over only once. */
export async function takeSharedFile(): Promise<string | null> {
  if (typeof caches === 'undefined') return null;
  const cache = await caches.open(SHARED_CACHE);
  const response = await cache.match(SHARED_SET_URL);
  if (!response) return null;
  await cache.delete(SHARED_SET_URL);
  return response.text();
}

type LaunchParams = { files?: { getFile: () => Promise<File> }[] };
type LaunchQueue = { setConsumer: (consumer: (params: LaunchParams) => void) => void };

/** Calls back with the text of a file the installed app was opened with ("Open with" on computers). */
export function listenForOpenedFiles(onFile: (text: string) => void) {
  const queue = (window as typeof window & { launchQueue?: LaunchQueue }).launchQueue;
  queue?.setConsumer((params) => {
    const handle = params.files?.[0];
    if (!handle) return;
    handle
      .getFile()
      .then((file) => file.text())
      .then(onFile)
      .catch((error) => console.warn('Unable to open the file', error));
  });
}
