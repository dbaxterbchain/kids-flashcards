import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type UsePwaResult = {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  updateAvailable: boolean;
  reloadForUpdate: () => void;
  offlineReady: boolean;
  dismissOfflineReady: () => void;
  isOffline: boolean;
};

export function usePwa(): UsePwaResult {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  const updateServiceWorker = useRef<ReturnType<typeof registerSW> | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    updateServiceWorker.current = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  }, [deferredPrompt]);

  const reloadForUpdate = useCallback(() => {
    updateServiceWorker.current?.(true);
    setUpdateAvailable(false);
  }, []);

  const dismissOfflineReady = useCallback(() => setOfflineReady(false), []);

  return {
    canInstall,
    promptInstall,
    updateAvailable,
    reloadForUpdate,
    offlineReady,
    dismissOfflineReady,
    isOffline,
  };
}
