import { useEffect, useRef } from 'react';

// Kid lock keeps a child in the app: it fills the screen, catches back swipes and the back button,
// asks before the page closes or reloads, and turns off pinch zoom. A web page can't block the home
// button or the app switcher, so Grown-ups also explains the device's own lock (Guided Access on
// iPhone and iPad, App pinning on Android).

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void };

type HistoryState = { depth?: number; kidLockGuard?: boolean } | null;

const isFullscreen = () => {
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
};

/** Fills the screen, hiding the browser's buttons. Only works from a tap; iPhones don't allow it. */
export function enterFullscreen() {
  if (isFullscreen()) return;
  const root = document.documentElement as FullscreenElement;
  try {
    if (root.requestFullscreen) {
      root.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
    } else {
      root.webkitRequestFullscreen?.();
    }
  } catch {
    // Not allowed here; the rest of kid lock still works.
  }
}

export function exitFullscreen() {
  if (!isFullscreen()) return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => undefined);
    } else {
      doc.webkitExitFullscreen?.();
    }
  } catch {
    // Already left.
  }
}

const historyState = () => window.history.state as HistoryState;

/**
 * Puts a guard entry under the first screen, so going back from it lands on the guard (which sends
 * the child home) rather than leaving the app. Browsers ignore history added without a tap, so this
 * runs from one.
 */
function armBackGuard() {
  if ((historyState()?.depth ?? 0) > 0) return;
  const hash = window.location.hash || '#/';
  window.history.replaceState({ depth: 0, kidLockGuard: true }, '', '#/');
  window.history.pushState({ depth: 1 }, '', hash);
}

/**
 * Turns kid lock on while `enabled`. `onKidScreen` is false in Grown-ups, where closing the page or
 * leaving for another site is allowed.
 */
export function useKidLock(enabled: boolean, onKidScreen: boolean) {
  const onKidScreenRef = useRef(onKidScreen);
  onKidScreenRef.current = onKidScreen;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('kid-lock', enabled);
    if (!enabled) return undefined;

    // Every tap on a kid screen is a chance to (re)fill the screen and set the back guard, which
    // browsers only allow from a tap.
    const onTap = () => {
      if (!onKidScreenRef.current) return;
      armBackGuard();
      enterFullscreen();
    };

    // Going back onto the guard goes forward to the home screen again.
    const onPopState = () => {
      if (!historyState()?.kidLockGuard) return;
      window.history.pushState({ depth: 1 }, '', '#/');
    };

    // Asks before a swipe, reload or link closes the page. Kids can't read the question, so they stay.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!onKidScreenRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    // Safari ignores touch-action for pinch zoom, but lets pages cancel the gesture.
    const onGesture = (event: Event) => event.preventDefault();

    window.addEventListener('click', onTap, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('gesturestart', onGesture);
    return () => {
      root.classList.remove('kid-lock');
      window.removeEventListener('click', onTap, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('gesturestart', onGesture);
    };
  }, [enabled]);
}

/**
 * Kid-friendly touch behavior on kid screens, with or without kid lock: a long press doesn't open
 * the browser's menu (save image, copy) and pictures can't be dragged away.
 */
export function useKidScreen(onKidScreen: boolean) {
  useEffect(() => {
    if (!onKidScreen) return undefined;
    const isField = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('input, textarea, [contenteditable="true"]'));
    const block = (event: Event) => {
      if (!isField(event.target)) event.preventDefault();
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
    };
  }, [onKidScreen]);
}
