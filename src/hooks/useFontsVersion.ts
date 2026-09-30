import { useSyncExternalStore } from 'react';
import { clearTextFit } from '../flashcards/textFit';

let version = 0;
const listeners = new Set<() => void>();

// Text sized by measuring (see textFit.ts) is measured again once web fonts finish loading.
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener('loadingdone', () => {
    clearTextFit();
    version += 1;
    listeners.forEach((listener) => listener());
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Changes when web fonts finish loading, so measured text re-renders at the right size. */
export function useFontsVersion() {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}
