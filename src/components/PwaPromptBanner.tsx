type Props = {
  canInstall: boolean;
  onInstall: () => Promise<void>;
  updateAvailable: boolean;
  onUpdate: () => void;
  offlineReady: boolean;
  onDismissOfflineReady: () => void;
  isOffline: boolean;
};

export function PwaPromptBanner({
  canInstall,
  onInstall,
  updateAvailable,
  onUpdate,
  offlineReady,
  onDismissOfflineReady,
  isOffline,
}: Props) {
  if (!canInstall && !updateAvailable && !offlineReady && !isOffline) return null;

  return (
    <div className="pwa-banner" aria-live="polite">
      {updateAvailable && (
        <div className="pwa-banner__card">
          <div>
            <p className="pwa-banner__title">New version ready</p>
            <p className="pwa-banner__text">Reload to get the latest styles and fixes.</p>
          </div>
          <button className="cta small" type="button" onClick={onUpdate}>
            Refresh
          </button>
        </div>
      )}

      {offlineReady && (
        <div className="pwa-banner__card success">
          <div>
            <p className="pwa-banner__title">Ready to use offline</p>
            <p className="pwa-banner__text">Your cards and shell are cached locally.</p>
          </div>
          <button className="ghost light" type="button" onClick={onDismissOfflineReady}>
            Dismiss
          </button>
        </div>
      )}

      {isOffline && (
        <div className="pwa-banner__card warn">
          <div>
            <p className="pwa-banner__title">Offline mode</p>
            <p className="pwa-banner__text">You can still flip saved cards. Reconnect to sync new media.</p>
          </div>
        </div>
      )}

      {canInstall && (
        <div className="pwa-banner__card">
          <div>
            <p className="pwa-banner__title">Install Kids Flashcards</p>
            <p className="pwa-banner__text">Add to your home screen for a smoother, full-screen experience.</p>
          </div>
          <button className="cta small" type="button" onClick={onInstall}>
            Install
          </button>
        </div>
      )}
    </div>
  );
}
