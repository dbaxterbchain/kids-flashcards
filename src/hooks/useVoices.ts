import { useSyncExternalStore } from 'react';
import { subscribeToVoices, voicesVersion } from '../audio/voices';

/** Re-renders when the device's voices load, or a grown-up picks a different voice. */
export function useVoices() {
  return useSyncExternalStore(subscribeToVoices, voicesVersion, voicesVersion);
}
