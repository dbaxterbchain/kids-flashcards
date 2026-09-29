import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SignalWifiBadIcon from '@mui/icons-material/SignalWifiBad';
import { Alert, AlertColor, Button, Snackbar } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorage';

type Props = {
  canInstall: boolean;
  onInstall: () => Promise<void>;
  updateAvailable: boolean;
  onUpdate: () => void;
  offlineReady: boolean;
  onDismissOfflineReady: () => void;
  isOffline: boolean;
};

type Notice = {
  severity: AlertColor;
  icon: ReactNode;
  text: string;
  action?: ReactNode;
  onClose?: () => void;
  autoHideMs?: number;
};

const INSTALL_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

export function PwaPromptBanner({
  canInstall,
  onInstall,
  updateAvailable,
  onUpdate,
  offlineReady,
  onDismissOfflineReady,
  isOffline,
}: Props) {
  const [installSnoozedUntil, setInstallSnoozedUntil] = useLocalStorageState('kids-flashcards:install-snoozed-until', 0);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  // Going offline again after reconnecting should show the notice again.
  useEffect(() => {
    if (!isOffline) setOfflineDismissed(false);
  }, [isOffline]);

  // Show one notice at a time, most important first, so they never pile up on top of each other.
  let key: string | null = null;
  let notice: Notice | null = null;
  if (updateAvailable) {
    key = 'update';
    notice = {
      severity: 'info',
      icon: <RefreshIcon fontSize="small" />,
      text: 'A new version is ready.',
      action: (
        <Button color="inherit" size="small" onClick={onUpdate}>
          Refresh
        </Button>
      ),
    };
  } else if (isOffline && !offlineDismissed) {
    key = 'offline';
    notice = {
      severity: 'warning',
      icon: <SignalWifiBadIcon fontSize="small" />,
      text: "You're offline. Your saved cards still work.",
      onClose: () => setOfflineDismissed(true),
    };
  } else if (canInstall && installSnoozedUntil < Date.now()) {
    key = 'install';
    notice = {
      severity: 'info',
      icon: <CloudDownloadIcon fontSize="small" />,
      text: 'Install Kids Flashcards to use it full screen, even offline.',
      action: (
        <>
          <Button color="inherit" size="small" onClick={() => setInstallSnoozedUntil(Date.now() + INSTALL_SNOOZE_MS)}>
            Not now
          </Button>
          <Button color="inherit" size="small" onClick={() => void onInstall()}>
            Install
          </Button>
        </>
      ),
    };
  } else if (offlineReady) {
    key = 'offline-ready';
    notice = {
      severity: 'success',
      icon: <DownloadDoneIcon fontSize="small" />,
      text: 'Ready to use offline.',
      onClose: onDismissOfflineReady,
      autoHideMs: 5000,
    };
  }

  if (!notice) return null;

  return (
    <Snackbar
      key={key}
      open
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      autoHideDuration={notice.autoHideMs ?? null}
      onClose={(_, reason) => {
        if (reason === 'timeout') notice?.onClose?.();
      }}
    >
      <Alert
        severity={notice.severity}
        icon={notice.icon}
        action={notice.action}
        onClose={notice.onClose}
        sx={{ alignItems: 'center', width: '100%' }}
      >
        {notice.text}
      </Alert>
    </Snackbar>
  );
}
