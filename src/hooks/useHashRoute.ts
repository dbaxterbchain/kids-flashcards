import { useCallback, useEffect, useState } from 'react';
import { GAME_KINDS, GameKind } from '../flashcards/games';

export type Route =
  | { name: 'home' }
  | { name: 'set'; setId: string }
  | { name: 'practice' }
  | { name: 'stickers' }
  | { name: 'game'; game: GameKind; setId: string }
  | { name: 'manage' };

type HistoryState = { depth?: number } | null;

function parseHash(hash: string): Route {
  const [section, id, extra] = hash.replace(/^#\/?/, '').split('/');
  if (section === 'set' && id) return { name: 'set', setId: decodeURIComponent(id) };
  if (section === 'game' && GAME_KINDS.includes(id as GameKind) && extra) {
    return { name: 'game', game: id as GameKind, setId: decodeURIComponent(extra) };
  }
  if (section === 'practice') return { name: 'practice' };
  if (section === 'stickers') return { name: 'stickers' };
  if (section === 'manage') return { name: 'manage' };
  return { name: 'home' };
}

function routeToHash(route: Route) {
  if (route.name === 'set') return `#/set/${encodeURIComponent(route.setId)}`;
  if (route.name === 'game') return `#/game/${route.game}/${encodeURIComponent(route.setId)}`;
  if (route.name === 'home') return '#/';
  return `#/${route.name}`;
}

const currentDepth = () => (window.history.state as HistoryState)?.depth ?? 0;

/**
 * Screens live in the URL hash so the browser (and Android) back button moves between them
 * instead of leaving the app.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const navigate = useCallback((next: Route, options: { replace?: boolean } = {}) => {
    const hash = routeToHash(next);
    if (options.replace) {
      window.history.replaceState({ depth: currentDepth() }, '', hash);
    } else {
      window.history.pushState({ depth: currentDepth() + 1 }, '', hash);
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  /** Goes back a screen, or home when this was the first screen opened. */
  const goBack = useCallback(() => {
    if (currentDepth() > 0) {
      window.history.back();
    } else {
      navigate({ name: 'home' }, { replace: true });
    }
  }, [navigate]);

  return { route, navigate, goBack };
}
